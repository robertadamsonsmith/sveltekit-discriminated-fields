import type { RemoteFormField, RemoteFormFieldType } from '@sveltejs/kit';

// Data type from fields' set method
export type DiscriminatedData<T> = T extends { set: (v: infer D) => unknown } ? D : never;

// Extract discriminator values from the fields type
type DiscriminatorValues<T, K extends string> = T extends Record<K, { value(): infer V }>
	? Exclude<V, undefined>
	: never;

// Extract value type from RemoteFormField (distributes over unions)
type ExtractFieldValue<F> = F extends RemoteFormField<infer V> ? V : never;

// Radio input element props (copied from SvelteKit's InputElementProps for 'radio')
type RadioProps = {
	name: string;
	type: 'radio';
	value?: string;
	'aria-invalid': boolean | 'false' | 'true' | undefined;
	get checked(): boolean;
	set checked(value: boolean);
};

// SvelteKit's AsArgs type for non-radio types
type NonRadioAsArgs<Type extends string, Value> = Type extends 'checkbox'
	? Value extends string[]
		? [type: Type, value: Value[number] | (string & {})]
		: [type: Type]
	: Type extends 'submit' | 'hidden'
		? [type: Type, value: Value | (string & {})]
		: [type: Type];

// Strict discriminator field type that overrides the .as() method
// - Radio: strictly typed to only accept valid discriminator values (NO string escape hatch)
// - Other types: use original SvelteKit behavior via the underlying RemoteFormField
type StrictDiscriminatorField<Value extends string, BaseField extends RemoteFormField<Value>> = Omit<BaseField, 'as'> & {
	// Strict radio overload - ONLY accepts valid discriminator values
	as(type: 'radio', value: Value): RadioProps;
	// All other input types - delegate to base RemoteFormField behavior
	// Uses rest params with conditional type that excludes 'radio' from valid types
	as<T extends Exclude<RemoteFormFieldType<Value>, 'radio'>>(
		...args: NonRadioAsArgs<T, Value>
	): ReturnType<BaseField['as']>;
};

// Convert union of RemoteFormFields to single StrictDiscriminatorField with union value
type UnifyField<F, V extends string = ExtractFieldValue<F> & string> = StrictDiscriminatorField<V, RemoteFormField<V>>;

// Type-safe set method
type Setter<K extends string, T, D = DiscriminatedData<T>> = {
	set: <V extends D[K & keyof D]>(data: Extract<D, { [P in K]: V }>) => void;
};

// Distributes keyof over union
type Keys<T> = T extends unknown ? keyof T : never;

// Discriminator value property
type KeyValue<K extends string, V> = { [P in `${K}Value`]: V };

// All fields from T
type Fields<T> = { [P in Keys<T>]: T extends Record<P, infer V> ? V : never };

// Discriminator value + all fields
type Variant<K extends string, T, V> = KeyValue<K, V> & Fields<T>;

// Narrows T to each variant
type Narrowed<K extends string, T> = T extends { [P in K]: { value(): infer V } }
	? Variant<K, T, V>
	: never;

// Narrowed variants + undefined case
type Union<K extends string, T> = Narrowed<K, T> | Variant<K, T, undefined>;

// Extract discriminator field type from union without distribution
type FieldUnion<K extends string, T> = T extends Record<K, infer F> ? F : never;

// Unified discriminator field with strict .as("radio", value)
type UnifiedDiscriminator<K extends string, T, F = FieldUnion<K, T>> = {
	readonly [P in K]: [F] extends [never] ? never : UnifyField<F>;
};

// Set method + narrowed fields union + unified discriminator
type DiscriminatedFields<K extends string, T> = Setter<K, T> & Union<K, T> & UnifiedDiscriminator<K, T>;

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
>(key: K, fields: T): DiscriminatedFields<K, T> {
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
	return proxy as DiscriminatedFields<K, T>;
}
