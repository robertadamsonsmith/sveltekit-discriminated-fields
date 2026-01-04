<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { RemoteFormField, RemoteFormFieldValue, RemoteFormFields } from "@sveltejs/kit";

  // =============================================================================
  // Core types - work with data type D instead of field object type T
  // =============================================================================

  // Extract data type from fields' set method
  type Data<T> = T extends { set: (v: infer D) => unknown } ? D : never;

  // Discriminator values from data (distributes over D)
  type Values<K extends string, D> = D extends Record<K, infer V> ? (V extends string ? V : never) : never;

  // Narrow D to variant where discriminator equals V
  type NarrowData<K extends string, D, V> = D extends Record<K, V> ? D : never;

  // Common keys (in EVERY variant) - for a union, keyof gives intersection
  type CommonKeys<D> = keyof D;

  // =============================================================================
  // Validation - detect problematic field configurations
  // =============================================================================

  // Get all keys from ALL variants (distributes over union to collect all keys)
  type AllDataKeys<D> = D extends D ? keyof D : never;

  // Variants containing key P (distributes to filter union members)
  // Checks if P is in keyof D (works for both required and optional properties)
  type VariantsWithKey<D, P> = D extends D ? (P extends keyof D ? D : never) : never;

  // Check if T is a union type (multiple members vs single type)
  type IsUnion<T, U = T> = T extends T ? ([U] extends [T] ? false : true) : never;

  // Key P is "partially shared" if:
  // - NOT in all variants (not in CommonKeys)
  // - In MORE THAN ONE variant (VariantsWithKey is a union)
  // Keys in exactly 1 variant are fine (variant-specific)
  type IsPartiallyShared<D, P> = P extends CommonKeys<D>
    ? false // In all variants - OK (common field)
    : IsUnion<VariantsWithKey<D, P>>; // true if 2+ variants have this key

  // Find all partially shared keys (in 2 to N-1 variants, not variant-specific)
  type PartiallySharedKeys<K extends string, D> = {
    [P in Exclude<AllDataKeys<D>, K>]: IsPartiallyShared<D, P> extends true ? P : never;
  }[Exclude<AllDataKeys<D>, K>];

  // Check if types match across variants for a given key
  type TypeAt<D, P extends PropertyKey> = D extends Record<P, infer V> ? V : never;

  // For mixed type detection, check if the type varies across variants
  type HasMixedTypes<D, P extends PropertyKey> = IsUnion<TypeAt<D, P>>;

  // Common keys with different types across variants
  type MixedTypeKeys<K extends string, D, CK extends PropertyKey = Exclude<CommonKeys<D>, K>> = CK extends CK
    ? HasMixedTypes<D, CK> extends true
      ? CK
      : never
    : never;

  // Validation - check for both partially shared keys AND mixed types
  type Validate<K extends string, D, T> = [PartiallySharedKeys<K, D>] extends [never]
    ? [MixedTypeKeys<K, D>] extends [never]
      ? T
      : `Error: Field '${MixedTypeKeys<K, D> & string}' has different types across variants. Common fields must have the same type in all variants.`
    : `Error: Field '${PartiallySharedKeys<K, D> & string}' exists in some variants but not all. Fields must be either unique to one variant or common to all variants.`;

  // =============================================================================
  // Snippet types - build field objects from data
  // =============================================================================

  // Reserved prop names
  type Reserved = "fields" | "key" | "fallback" | "partial" | "css";

  // Build field type - uses SvelteKit's RemoteFormFields for nested objects
  // This correctly includes set(), value(), issues(), allIssues() on nested containers
  type Field<V> = [V] extends [object]
    ? RemoteFormFields<V>
    : RemoteFormField<V & RemoteFormFieldValue>;

  // Variant snippet fields: narrowed data → field object, excluding common fields
  type SnippetFields<K extends string, D, V extends string, Narrow = NarrowData<K, D, V>> = {
    readonly [P in Exclude<keyof Narrow, K | CommonKeys<D>>]: Field<Narrow[P & keyof Narrow]>;
  } & {
    readonly [P in K]: Field<V>;
  };

  // Props passed to variant snippets for CSS targeting (spread onto wrapper element)
  export type VariantProps = { "data-fv"?: string };

  // Combined variant snippet argument - spread for props, access .fields for variant data
  // Mirrors form pattern: <form {...form}> + form.fields.x → <div {...v}> + v.fields.x
  export type VariantSnippetArg<F> = VariantProps & { readonly fields: F };

  // Snippet props - one snippet per variant, receives single arg with .fields property
  type Snippets<K extends string, D, V extends string, IsPartial extends boolean> = IsPartial extends true
    ? { [P in Exclude<V, Reserved>]?: Snippet<[VariantSnippetArg<SnippetFields<K, D, P>>]> }
    : { [P in Exclude<V, Reserved>]: Snippet<[VariantSnippetArg<SnippetFields<K, D, P>>]> };

  // =============================================================================
  // Component props
  // =============================================================================

  export type FieldVariantsProps<
    K extends string,
    T extends { set: (v: never) => unknown } & Record<K, { value(): unknown }>,
    V extends string = Values<K, Data<T>>,
    IsPartial extends boolean = false,
  > = {
    fields: Validate<K, Data<T>, T>;
    key: K;
    /** Optional snippet shown when no variant is selected. Receives (props) for CSS targeting. */
    fallback?: Snippet<[VariantProps]>;
    /** When true, variant snippets are optional (default: false) */
    partial?: IsPartial;
    /** Set to false to disable CSS generation (default: true) */
    css?: boolean;
  } & Snippets<K, Data<T>, V, IsPartial>;
</script>

<script
  lang="ts"
  generics="K extends string, T extends { set: (v: never) => unknown } & Record<K, { value(): unknown }>, V extends string = Values<K, Data<T>>, IsPartial extends boolean = false"
>
  import { onMount } from "svelte";

  type Props = FieldVariantsProps<K, T, V, IsPartial>;

  let { fields, key, fallback, partial, css: cssEnabled = true, ...snippets }: Props = $props();

  // Get all variant values from the snippet names
  const variantValues = Object.keys(snippets) as V[];

  // After hydration, switch from CSS-only to JS-based conditional rendering
  // This enables Svelte transitions and other JS-dependent features
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  // Get the current discriminator value
  const currentValue = $derived.by(() => {
    const discriminatorField = (fields as Record<K, { value(): unknown }>)[key];
    return discriminatorField?.value() as V | "" | undefined;
  });

  // Get the actual field name from the discriminator field (used for CSS selectors)
  const fieldName = $derived.by(() => {
    const discriminatorField = (fields as Record<K, { as(type: "select"): { name: string } }>)[key];
    return discriminatorField?.as("select")?.name ?? key;
  });

  // Generate CSS for showing/hiding variants based on select or radio value
  // Uses form:has() to scope to the containing form - works regardless of DOM structure
  const css = $derived.by(() => {
    if (!cssEnabled) return "";

    const name = fieldName;
    // Use .fieldName.variant format - the leading dot prevents collisions
    const fv = (v: string) => `[data-fv=".${name}.${v}"]`;
    const fvPrefix = `[data-fv^=".${name}."]`;

    // form:has() scopes to the containing form, name-based targeting is precise
    const sel = (v: string) => `form:has(select[name="${name}"] option[value="${v}"]:checked)`;
    const rad = (v: string) => `form:has(input[name="${name}"][value="${v}"]:checked)`;

    // Hide all variant sections by default (starts-with selector matches all variants for this field)
    const hideAll = `form:has([name="${name}"]) ${fvPrefix}:not(${fv("fallback")}) { display: none; }\n`;

    // Show the variant section that matches the selected value
    const showVariants = variantValues
      .map((v) => `${sel(v)} ${fv(v)},
${rad(v)} ${fv(v)} { display: contents; }`)
      .join("\n");

    // Hide fallback when ANY value is selected (not just known variants)
    // This checks for any non-empty option selected or any radio checked
    const hideFallback = fallback
      ? `form:has(select[name="${name}"] option:checked:not([value=""])) ${fv("fallback")},
form:has(input[name="${name}"]:checked) ${fv("fallback")} { display: none; }\n`
      : "";

    return hideAll + showVariants + hideFallback;
  });

  // Props to add to wrapper elements when CSS is enabled - uses .fieldName.variant format
  const wrapperProps = (variant: string): VariantProps =>
    cssEnabled ? { "data-fv": `.${fieldName}.${variant}` } : {};

  // Create snippet argument with non-enumerable fields property
  // This allows {...v} to only spread the CSS props, while v.fields is still accessible
  const createSnippetArg = (variant: string, variantFields: T): VariantSnippetArg<T> => {
    const arg = { ...wrapperProps(variant) };
    Object.defineProperty(arg, "fields", {
      value: variantFields,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return arg as VariantSnippetArg<T>;
  };
</script>

<svelte:head>
  {#if css && !hydrated}
    <!-- CSS-only visibility before JS hydrates -->
    {@html `<style>${css}</style>`}
  {/if}
</svelte:head>

{#if hydrated}
  <!-- After hydration: JS-based conditional rendering (enables transitions) -->
  <!-- Fallback shows when no value is selected (empty string or undefined) -->
  {#if !currentValue && fallback}
    {@render fallback(wrapperProps("fallback"))}
  {/if}

  {#each variantValues as v (v)}
    {#if currentValue === v}
      {@const snippet = (snippets as unknown as Record<V, Snippet<[VariantSnippetArg<T>]>>)[v]}
      {@render snippet(createSnippetArg(v, fields as T))}
    {/if}
  {/each}
{:else}
  <!-- Before hydration: render all, CSS handles visibility -->
  {#if fallback}
    {@render fallback(wrapperProps("fallback"))}
  {/if}

  {#each variantValues as v (v)}
    {@const snippet = (snippets as unknown as Record<V, Snippet<[VariantSnippetArg<T>]>>)[v]}
    {@render snippet(createSnippetArg(v, fields as T))}
  {/each}
{/if}
