<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { InferDiscriminator } from "./infer-discriminator.js";

  // Extract discriminator values from a union of field objects
  type DiscriminatorValues<K extends string, T> =
    T extends Record<K, { value(): infer V }>
      ? V extends string
        ? V
        : never
      : never;

  // Narrow T to the variant where discriminator equals V
  type NarrowToVariant<K extends string, T, V> =
    T extends Record<K, { value(): V }> ? T : never;

  // Reserved prop names that can't be variant names
  type ReservedProps = "fields" | "key" | "fallback" | "partial";

  // =============================================================================
  // Shared field name detection
  // Fields can be:
  // - Unique to one variant: OK
  // - Common to ALL variants: OK (accessible at top level, outside UnionVariants)
  // - Shared by SOME but not ALL: ERROR (would cause duplicate form submissions)
  // =============================================================================

  // Keys that look like form fields (have a value() method) - excludes methods like set/allIssues
  type FieldKeys<T> = {
    [P in keyof T]: T[P] extends { value(): unknown } ? P : never;
  }[keyof T];

  // Get field keys for a specific variant (excluding discriminator)
  type VariantFieldKeys<K extends string, T, V extends string> = Exclude<
    FieldKeys<NarrowToVariant<K, T, V>>,
    K
  >;

  // Get union of field keys from all variants EXCEPT V (distributes over the Exclude result)
  type OtherVariantsFieldKeys<
    K extends string,
    T,
    V extends string,
    OtherV extends string = Exclude<DiscriminatorValues<K, T>, V>,
  > = OtherV extends OtherV ? VariantFieldKeys<K, T, OtherV> : never;

  // Keys that variant V shares with at least one other variant
  type SharedFieldKeys<
    K extends string,
    T,
    V extends string,
  > = VariantFieldKeys<K, T, V> & OtherVariantsFieldKeys<K, T, V>;

  // Union of all shared keys across all variants (distributes over V)
  type AllSharedFieldKeys<
    K extends string,
    T,
    V extends string = DiscriminatorValues<K, T>,
  > = V extends V ? SharedFieldKeys<K, T, V> : never;

  // Check if field P exists in variant V
  type HasField<T, P> = P extends keyof T
    ? T[P] extends { value(): unknown }
      ? true
      : false
    : false;

  // Check if field P exists in ALL variants (distributes, so result is union of true/false)
  type FieldExistsInAll<
    K extends string,
    T,
    P extends string,
    V extends string = DiscriminatorValues<K, T>,
  > = V extends V ? HasField<NarrowToVariant<K, T, V>, P> : never;

  // A field is common if it exists in all variants (no false in the result)
  type IsCommonField<K extends string, T, P extends string> = false extends FieldExistsInAll<K, T, P>
    ? false
    : true;

  // =============================================================================
  // Type uniformity check - fields shared across variants must have the same type
  // =============================================================================

  // Get the value type of field P in variant V
  type FieldValueType<K extends string, T, V extends string, P extends string> = NarrowToVariant<
    K,
    T,
    V
  >[P & keyof NarrowToVariant<K, T, V>] extends { value(): infer R }
    ? R
    : never;

  // Union of all value types for field P across all variants
  type AllFieldValueTypes<
    K extends string,
    T,
    P extends string,
    V extends string = DiscriminatorValues<K, T>,
  > = V extends V ? FieldValueType<K, T, V, P> : never;

  // Check if the union of all types equals each individual type (i.e., all types are the same)
  // If types differ: (string | number) extends string = false
  // If types same: string extends string = true
  type FieldTypeMatchesInVariant<
    K extends string,
    T,
    P extends string,
    V extends string,
    Union = AllFieldValueTypes<K, T, P>,
  > = [Union] extends [FieldValueType<K, T, V, P>] ? true : false;

  // Check if field P has the same type in ALL variants
  type FieldHasSameTypeInAll<
    K extends string,
    T,
    P extends string,
    V extends string = DiscriminatorValues<K, T>,
  > = V extends V ? FieldTypeMatchesInVariant<K, T, P, V> : never;

  // A field has uniform type if no variant returns false
  type IsUniformTypeField<K extends string, T, P extends string> = false extends FieldHasSameTypeInAll<
    K,
    T,
    P
  >
    ? false
    : true;

  // =============================================================================
  // Field classification
  // =============================================================================

  // Fields shared by SOME but not ALL variants (problematic - would cause duplicate submissions)
  type PartiallySharedFieldKeys<K extends string, T> = {
    [P in AllSharedFieldKeys<K, T>]: IsCommonField<K, T, P & string> extends true ? never : P;
  }[AllSharedFieldKeys<K, T>];

  // Fields in ALL variants but with DIFFERENT types (problematic - type mismatch)
  type MixedTypeFieldKeys<K extends string, T> = {
    [P in AllSharedFieldKeys<K, T>]: IsCommonField<K, T, P & string> extends true
      ? IsUniformTypeField<K, T, P & string> extends true
        ? never
        : P
      : never;
  }[AllSharedFieldKeys<K, T>];

  // Fields common to ALL variants WITH the same type (safe to use outside UnionVariants)
  type CommonFieldKeys<K extends string, T> = {
    [P in AllSharedFieldKeys<K, T>]: IsCommonField<K, T, P & string> extends true
      ? IsUniformTypeField<K, T, P & string> extends true
        ? P
        : never
      : never;
  }[AllSharedFieldKeys<K, T>];

  // =============================================================================
  // Validation - produces error messages for invalid field configurations
  // =============================================================================

  // Validates that T has no partially shared field keys
  type ValidateNoPartiallySharedFields<K extends string, T> = [
    PartiallySharedFieldKeys<K, T>,
  ] extends [never]
    ? T
    : `Error: Field '${PartiallySharedFieldKeys<K, T> & string}' exists in some variants but not all. Fields must be either unique to one variant or common to all variants.`;

  // Validates that T has no mixed-type field keys
  type ValidateNoMixedTypeFields<K extends string, T> = [MixedTypeFieldKeys<K, T>] extends [never]
    ? T
    : `Error: Field '${MixedTypeFieldKeys<K, T> & string}' exists in all variants but with different types. Shared fields must have the same type across all variants.`;

  // Combined validation
  type ValidateFields<K extends string, T> = [PartiallySharedFieldKeys<K, T>] extends [never]
    ? [MixedTypeFieldKeys<K, T>] extends [never]
      ? T
      : ValidateNoMixedTypeFields<K, T>
    : ValidateNoPartiallySharedFields<K, T>;

  // Variant type with common fields removed (for snippet parameters)
  // This prevents accidentally rendering common fields twice
  type VariantOnlyFields<K extends string, T, V extends string> = Omit<
    NarrowToVariant<K, T, V>,
    CommonFieldKeys<K, T>
  >;

  // Snippet props mapped from variant values - optionality controlled by Partial flag
  // Note: snippets receive variant-only fields (common fields are excluded to prevent duplicates)
  type VariantSnippets<
    K extends string,
    T,
    V extends string,
    IsPartial extends boolean,
  > = IsPartial extends true
    ? { [P in Exclude<V, ReservedProps>]?: Snippet<[VariantOnlyFields<K, T, P>]> }
    : { [P in Exclude<V, ReservedProps>]: Snippet<[VariantOnlyFields<K, T, P>]> };

  // Full props type with explicit key
  export type UnionVariantsPropsWithKey<
    K extends string,
    T extends Record<K, { value(): unknown }>,
    V extends string = DiscriminatorValues<K, T>,
    IsPartial extends boolean = false,
  > = {
    fields: ValidateFields<K, T>;
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
  } & VariantSnippets<K, T, V, IsPartial>;

  // Props type with auto-inferred key (key is optional)
  export type UnionVariantsPropsInferred<
    T extends Record<string, { value(): unknown }>,
    K extends string = InferDiscriminator<T> extends infer I ? (I extends string ? I : never) : never,
    V extends string = DiscriminatorValues<K, T>,
    IsPartial extends boolean = false,
  > = InferDiscriminator<T> extends string
    ? {
        fields: ValidateFields<K, T>;
        key?: K;
        fallback?: Snippet;
        partial?: IsPartial;
        selector?: string;
      } & VariantSnippets<K, T, V, IsPartial>
    : {
        fields: InferDiscriminator<T>; // This will be the error message
        key: never;
      };

  // Combined props type - key can be explicit or inferred
  export type UnionVariantsProps<
    K extends string,
    T extends Record<K, { value(): unknown }>,
    V extends string = DiscriminatorValues<K, T>,
    IsPartial extends boolean = false,
  > = UnionVariantsPropsWithKey<K, T, V, IsPartial>;
</script>

<script
  lang="ts"
  generics="K extends string, T extends Record<K, { value(): unknown }>, V extends string = DiscriminatorValues<K, T>, IsPartial extends boolean = false"
>
  type Props = UnionVariantsProps<K, T, V, IsPartial>;

  let { fields, key: keyProp, fallback, partial, selector, ...snippets }: Props = $props();

  // Auto-detect discriminator key if not provided
  function findDiscriminatorKey(f: Record<string, { value(): unknown }>): string {
    const fieldKeys = Object.keys(f).filter((k) => {
      const field = f[k];
      return field && typeof field === "object" && "value" in field && typeof field.value === "function";
    });

    const candidates = fieldKeys.filter((k) => {
      const field = f[k];
      const value = field.value();
      return typeof value === "string" || value === undefined;
    });

    if (candidates.length === 0) {
      throw new Error("No valid discriminator key found in fields");
    }
    return candidates[0];
  }

  // Use provided key or auto-detect
  const key = $derived(keyProp ?? findDiscriminatorKey(fields as Record<string, { value(): unknown }>)) as K;

  // Get all variant values from the snippet names (excluding fallback)
  const variantValues = Object.keys(snippets) as V[];

  // Get the actual field name from the discriminator field (handles nested paths like "shipping.method")
  const fieldName = $derived.by(() => {
    const discriminatorField = (fields as Record<K, { as(type: "select"): { name: string } }>)[key];
    return discriminatorField?.as("select")?.name ?? key;
  });

  // Generate CSS for showing/hiding variants based on select or radio value
  const css = $derived.by(() => {
    const attr = `data-union-${key}`;
    const name = fieldName;

    if (selector) {
      // Input-based: use :has() with the provided selector to find any ancestor
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
