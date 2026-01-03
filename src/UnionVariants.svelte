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
  type Reserved = "fields" | "key" | "fallback" | "partial" | "selector";

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

  // Snippet props - one snippet per variant
  type Snippets<K extends string, D, V extends string, IsPartial extends boolean> = IsPartial extends true
    ? { [P in Exclude<V, Reserved>]?: Snippet<[SnippetFields<K, D, P>]> }
    : { [P in Exclude<V, Reserved>]: Snippet<[SnippetFields<K, D, P>]> };

  // =============================================================================
  // Component props
  // =============================================================================

  export type UnionVariantsProps<
    K extends string,
    T extends { set: (v: never) => unknown } & Record<K, { value(): unknown }>,
    V extends string = Values<K, Data<T>>,
    IsPartial extends boolean = false,
  > = {
    fields: Validate<K, Data<T>, T>;
    key: K;
    /** Optional snippet shown when no variant is selected */
    fallback?: Snippet;
    /** When true, variant snippets are optional (default: false) */
    partial?: IsPartial;
    /**
     * CSS selector for the discriminator input element (select or radio container).
     * When provided, uses this selector instead of the default name-based lookup.
     * Example: "#method-select" for a select, or "#radio-group" for radios
     */
    selector?: string;
  } & Snippets<K, Data<T>, V, IsPartial>;
</script>

<script
  lang="ts"
  generics="K extends string, T extends { set: (v: never) => unknown } & Record<K, { value(): unknown }>, V extends string = Values<K, Data<T>>, IsPartial extends boolean = false"
>
  type Props = UnionVariantsProps<K, T, V, IsPartial>;

  let { fields, key, fallback, partial, selector, ...snippets }: Props = $props();

  // Get all variant values from the snippet names
  const variantValues = Object.keys(snippets) as V[];

  // Get the actual field name from the discriminator field
  const fieldName = $derived.by(() => {
    const discriminatorField = (fields as Record<K, { as(type: "select"): { name: string } }>)[key];
    return discriminatorField?.as("select")?.name ?? key;
  });

  // Generate CSS for showing/hiding variants based on select or radio value
  const css = $derived.by(() => {
    const attr = `data-union-${key}`;
    const name = fieldName;

    if (selector) {
      // Selector-based: use :has() with the provided selector to find any ancestor
      // Supports: select elements, radio inputs directly, or radio containers
      const selOpt = (v: string) => `*:has(${selector} option[value="${v}"]:checked)`;
      const radDirect = (v: string) => `*:has(${selector}[value="${v}"]:checked)`;
      const radContainer = (v: string) => `*:has(${selector} input[value="${v}"]:checked)`;

      // Hide all variant sections by default
      const hideAll = `*:has(${selector}) [${attr}]:not([${attr}="fallback"]) { display: none; }\n`;

      // Show the variant section that matches the selected value
      const showVariants = variantValues
        .map((v) => `${selOpt(v)} [${attr}="${v}"],
${radDirect(v)} [${attr}="${v}"],
${radContainer(v)} [${attr}="${v}"] { display: contents; }`)
        .join("\n");

      // Hide fallback when any variant is selected
      const hideFallback =
        fallback && variantValues.length
          ? `*:has(${selector}:checked) [${attr}="fallback"],
*:has(${selector} input:checked) [${attr}="fallback"],
${variantValues.map((v) => `${selOpt(v)} [${attr}="fallback"]`).join(",\n")} { display: none; }\n`
          : "";

      return hideAll + showVariants + hideFallback;
    }

    // Sibling-based (default): look for sibling elements containing the discriminator
    const sel = (s: string) => `*:has(select[name="${name}"]${s}) ~`;
    const rad = (s: string) => `*:has(input[name="${name}"]${s}) ~`;

    // Hide all variant sections by default (but not fallback)
    const hideAll = `${sel("")} [${attr}]:not([${attr}="fallback"]),
${rad("")} [${attr}]:not([${attr}="fallback"]) { display: none; }\n`;

    // Show the variant section that matches the selected value
    const showVariants = variantValues
      .map((v) => `${sel(` option[value="${v}"]:checked`)} [${attr}="${v}"],
${rad(`[value="${v}"]:checked`)} [${attr}="${v}"] { display: contents; }`)
      .join("\n");

    // Hide fallback when any variant is selected
    const hideFallback =
      fallback && variantValues.length
        ? `${rad(":checked")} [${attr}="fallback"],
${variantValues.map((v) => `${sel(` option[value="${v}"]:checked`)} [${attr}="fallback"]`).join(",\n")} { display: none; }\n`
        : "";

    return hideAll + showVariants + hideFallback;
  });
</script>

<svelte:head>
  {@html `<style>${css}</style>`}
</svelte:head>

{#if fallback}
  {@const attrs = { [`data-union-${key}`]: "fallback" }}
  <div {...attrs}>
    {@render fallback()}
  </div>
{/if}

{#each variantValues as v (v)}
  {@const snippet = (snippets as unknown as Record<V, Snippet<[T]>>)[v]}
  {@const attrs = { [`data-union-${key}`]: v }}
  <div {...attrs}>
    {@render snippet(fields as T)}
  </div>
{/each}
