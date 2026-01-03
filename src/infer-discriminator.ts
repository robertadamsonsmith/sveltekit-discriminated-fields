// Auto-detect discriminator key from a union of form field objects
//
// This allows discriminatedFields() and UnionVariants to work without
// explicitly specifying the discriminator key, when it can be unambiguously inferred.

// Get all keys from all variants of a union
type AllKeys<T> = T extends T ? keyof T : never;

// Check if key K in variant T has a value() returning a string literal (not just `string`)
type HasLiteralValue<T, K> = K extends keyof T
	? T[K] extends { value(): infer V }
		? V extends string
			? string extends V
				? false // It's `string`, not a literal
				: true // It's a string literal like "circle"
			: false
		: false
	: false;

// Check if K is a valid discriminator in ALL variants (distributes over T)
type IsDiscriminatorInAll<T, K> = T extends T ? HasLiteralValue<T, K> : never;

// K is a discriminator only if IsDiscriminatorInAll<T, K> is exactly `true` (not `true | false`)
type IsDiscriminator<T, K> = [IsDiscriminatorInAll<T, K>] extends [true] ? true : false;

// Filter to only keys that are valid discriminators
type DiscriminatorKeys<T, K = AllKeys<T>> = K extends K
	? IsDiscriminator<T, K> extends true
		? K
		: never
	: never;

// Check if T is a union (has more than one member)
type IsUnion<T, U = T> = T extends T ? ([U] extends [T] ? false : true) : never;

// Infer the single discriminator key, or produce an error message
export type InferDiscriminator<T> = DiscriminatorKeys<T> extends infer Keys
	? [Keys] extends [never]
		? "Error: No valid discriminator found. A discriminator must exist in all variants with distinct string literal values."
		: IsUnion<Keys> extends true
			? `Error: Multiple discriminator candidates found: ${Keys & string}. Please specify the key explicitly.`
			: Keys
	: never;

// Type guard to check if inference succeeded (result is a string key, not an error message)
export type IsValidInference<T> = InferDiscriminator<T> extends `Error: ${string}` ? false : true;

export type { DiscriminatorKeys };
