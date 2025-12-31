// Data type from fields' set method
export type DiscriminatedData<T> = T extends { set: (v: infer D) => unknown } ? D : never;

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

// Set method + fields union
type DiscriminatedFields<K extends string, T> = Setter<K, T> & Union<K, T>;

/**
 * Wraps discriminated union form fields, adding ${key}Value for type narrowing.
 * - All original fields pass through unchanged (type, issues, allIssues, etc.)
 * - `set` is overridden with type-safe version
 * - `${key}Value` is added for discriminator value (e.g., `reward.typeValue`)
 *
 * @param key - Discriminator key (e.g. 'type')
 * @param fields - Form fields from a discriminated union schema
 * @returns Passthrough object with type-safe set() and ${key}Value for narrowing
 */
export function discriminatedFields<
	K extends string,
	T extends { set: (v: never) => unknown } & Record<K, { value(): unknown }>
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
