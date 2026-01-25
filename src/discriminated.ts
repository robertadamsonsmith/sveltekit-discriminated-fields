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

// Option props - simple value attribute for select options
type OptionProps = { value: string };

// =============================================================================
// Discriminator field - .as("radio") and .as("option") only accept valid values
// =============================================================================

// Discriminator field with variant-specific value() but union-accepting .as("radio") and .as("option")
type VariantDiscriminatorField<V extends string, AllV extends string> = Omit<RemoteFormField<V>, 'as'> & {
	as(type: 'radio', value: AllV): RadioProps;
	as(type: 'option'): OptionProps;
	as(type: 'option', value: AllV): OptionProps;
	as(type: Exclude<RemoteFormFieldType<V>, 'radio'>, ...args: unknown[]): ReturnType<RemoteFormField<V>['as']>;
};

// =============================================================================
// Nested field building - uses SvelteKit's RemoteFormFields
// =============================================================================

// Build field type - uses SvelteKit's RemoteFormFields for nested objects
// This correctly includes set(), value(), issues(), allIssues() on nested containers
// Uses NonNullable<V> to correctly handle optional fields (T | undefined)
// Without NonNullable, [T | undefined] extends [object] fails because undefined is not an object
type NestedField<V> = [NonNullable<V>] extends [object]
	? RemoteFormFields<V>
	: RemoteFormField<V & RemoteFormFieldValue>;


// =============================================================================
// Variant fields - new structure with .type and .fields
// =============================================================================

// Fields object containing discriminator field + variant-specific fields
type FieldsObject<K extends string, D, V extends string, AllV extends string> = {
	readonly [P in K]: VariantDiscriminatorField<V, AllV>;
} & {
	readonly [P in Exclude<keyof D, K>]: NestedField<D[P & keyof D]>;
};

// Variant fields - distributes over D to build each variant
// V is the specific variant value, AllV is all possible values (for .as("radio"))
type VariantFields<K extends string, D, AllV extends string> = D extends Record<K, infer V>
	? {
		readonly type: V;
		readonly fields: FieldsObject<K, D, V & string, AllV>;
	}
	: never;

// Undefined case (no variant selected yet) - includes common fields (keys in all variants)
type UndefinedVariant<K extends string, D, AllV extends string> = {
	readonly type: undefined;
	readonly fields: {
		readonly [P in K]: VariantDiscriminatorField<AllV, AllV>;
	} & {
		readonly [P in Exclude<keyof D, K>]: NestedField<D[P & keyof D]>;
	};
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
 * Wraps discriminated union form fields for type-safe narrowing.
 *
 * @example
 * ```svelte
 * <script>
 *   const priority = $derived(discriminated(priorityForm.fields, "level"));
 * </script>
 *
 * {#if priority.type === "high"}
 *   <input {...priority.fields.urgency.as("number")} />
 * {/if}
 *
 * <select {...priority.fields.level.as("select")}>
 *   <option {...priority.fields.level.as("option")}>Select...</option>
 *   <option {...priority.fields.level.as("option", "high")}>High</option>
 * </select>
 * ```
 *
 * @param fields - Form fields from a discriminated union schema
 * @param key - Discriminator key (e.g. 'type', 'kind')
 * @returns Object with `.type` (discriminator value), `.fields` (all form fields), `.set()`, `.allIssues()`
 */
export function discriminated<
	K extends string,
	T extends { set: (v: never) => unknown } & Record<K, { value(): unknown; as(type: 'radio', value: string): object }>
>(fields: T, key: K): DiscriminatedFields<K, DiscriminatedData<T>> {
	// Wrap the discriminator field to intercept as("option", value?) calls
	const wrapDiscriminatorField = (field: T[K]) => {
		return new Proxy(field, {
			get(fieldTarget, fieldProp) {
				if (fieldProp === 'as') {
					return (type: string, value?: string) => {
						if (type === 'option') {
							return { value: value ?? '' };
						}
						return fieldTarget.as(type as 'radio', value as string);
					};
				}
				return Reflect.get(fieldTarget, fieldProp);
			}
		});
	};

	// Create the fields proxy that wraps the discriminator field
	const fieldsProxy = new Proxy(fields, {
		get(target, prop) {
			if (prop === key) return wrapDiscriminatorField(target[key]);
			return Reflect.get(target, prop);
		}
	});

	// Create the main proxy with .type, .fields, .set, .allIssues
	const proxy = new Proxy(fields, {
		get(target, prop) {
			if (prop === 'type') return target[key].value();
			if (prop === 'fields') return fieldsProxy;
			if (prop === 'set') return (data: Parameters<T['set']>[0]) => target.set(data);
			if (prop === 'allIssues') return () => (target as unknown as { allIssues?: () => unknown }).allIssues?.();
			return undefined;
		},
		has(_target, prop) {
			return prop === 'type' || prop === 'fields' || prop === 'set' || prop === 'allIssues';
		}
	});

	return proxy as unknown as DiscriminatedFields<K, DiscriminatedData<T>>;
}
