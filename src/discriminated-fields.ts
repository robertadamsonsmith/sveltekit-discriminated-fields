import type { RemoteFormField, RemoteFormFields, RemoteFormFieldType, RemoteFormFieldValue } from '@sveltejs/kit';

// =============================================================================
// Core type extraction
// =============================================================================

// Data type from fields' set method
export type DiscriminatedData<T> = T extends { set: (v: infer D) => unknown } ? D : never;

// Discriminator values from data type
type DiscriminatorValues<K extends string, D> = D extends Record<K, infer V> ? Exclude<V, undefined> : never;

// =============================================================================
// Radio props - extracted from RemoteFormField.as("radio") return type
// =============================================================================

type RadioProps = RemoteFormField<string> extends { as(type: 'radio', value: string): infer R } ? R : never;

// =============================================================================
// Discriminator field - .as("radio") only accepts valid values
// =============================================================================

// Discriminator field with variant-specific value() but union-accepting .as("radio")
type VariantDiscriminatorField<V extends string, AllV extends string> = Omit<RemoteFormField<V>, 'as'> & {
	as(type: 'radio', value: AllV): RadioProps;
	as(type: Exclude<RemoteFormFieldType<V>, 'radio'>, ...args: unknown[]): ReturnType<RemoteFormField<V>['as']>;
};

// =============================================================================
// Build discriminated fields from data type
// =============================================================================

// =============================================================================
// Nested field building - uses SvelteKit's RemoteFormFields
// =============================================================================

// Build field type - uses SvelteKit's RemoteFormFields for nested objects
// This correctly includes set(), value(), issues(), allIssues() on nested containers
type NestedField<V> = [V] extends [object]
	? RemoteFormFields<V>
	: RemoteFormField<V & RemoteFormFieldValue>;

// =============================================================================
// Variant fields
// =============================================================================

// Variant fields - distributes over D to build each variant
// V is the specific variant value, AllV is all possible values (for .as("radio"))
type VariantFields<K extends string, D, AllV extends string> = D extends Record<K, infer V>
	? { readonly [P in `${K}Value`]: V } & { readonly [P in K]: VariantDiscriminatorField<V & string, AllV> } & {
			readonly [P in Exclude<keyof D, K>]: NestedField<D[P & keyof D]>;
		}
	: never;

// Undefined case (no variant selected yet) - includes common fields (keys in all variants)
type UndefinedVariant<K extends string, D, AllV extends string> = { readonly [P in `${K}Value`]: undefined } & {
	readonly [P in K]: VariantDiscriminatorField<AllV, AllV>;
} & {
	readonly [P in Exclude<keyof D, K>]: NestedField<D[P & keyof D]>;
};

// Type-safe set method
type SetMethod<K extends string, D> = {
	set: <V extends DiscriminatorValues<K, D>>(data: Extract<D, Record<K, V>>) => void;
};

// Common methods - extracted from SvelteKit's RemoteFormFields
// This ensures we stay in sync if SvelteKit changes the method signature
type CommonMethods = RemoteFormFields<unknown> extends { allIssues: infer M } ? { allIssues: M } : never;

// Full discriminated fields type
type DiscriminatedFields<K extends string, D, AllV extends string = DiscriminatorValues<K, D> & string> = (
	| VariantFields<K, D, AllV>
	| UndefinedVariant<K, D, AllV>
) &
	SetMethod<K, D> &
	CommonMethods;

// =============================================================================
// Main function
// =============================================================================

/**
 * Wraps discriminated union form fields for type-safe access.
 * - All original fields pass through unchanged (type, issues, allIssues, etc.)
 * - `set` is overridden with type-safe version
 * - `${key}Value` is added for discriminator value (e.g., `reward.typeValue`)
 * - Discriminator field `.as("radio", value)` is type-safe (only valid values allowed)
 *
 * @example
 * ```svelte
 * <script>
 *   const priority = $derived(discriminatedFields("level", priorityForm.fields));
 * </script>
 *
 * <input {...priority.level.as("radio", "high")} /> <!-- type-safe: only valid values allowed -->
 * ```
 *
 * @param key - Discriminator key (e.g. 'type')
 * @param fields - Form fields from a discriminated union schema
 * @returns Passthrough object with type-safe set(), ${key}Value, and .as("radio", value)
 */
export function discriminatedFields<
	K extends string,
	T extends { set: (v: never) => unknown } & Record<K, { value(): unknown; as(type: 'radio', value: string): object }>
>(key: K, fields: T): DiscriminatedFields<K, DiscriminatedData<T>> {
	const proxy = new Proxy(fields, {
		get(target, prop) {
			if (prop === `${key}Value`) return target[key].value();
			if (prop === 'set') return (data: Parameters<T['set']>[0]) => target.set(data);
			return Reflect.get(target, prop);
		},
		has(target, prop) {
			return prop === `${key}Value` || prop in target;
		}
	});
	return proxy as DiscriminatedFields<K, DiscriminatedData<T>>;
}
