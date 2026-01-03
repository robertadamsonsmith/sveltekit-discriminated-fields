// Re-export discriminatedFields function and types
export { discriminatedFields, type DiscriminatedData } from './discriminated-fields.js';

// Re-export inference types (useful for compile-time checks and error messages)
export type { InferDiscriminator } from './infer-discriminator.js';

// Re-export UnionVariants component and its types
export { default as UnionVariants } from './UnionVariants.svelte';
export type { UnionVariantsProps } from './UnionVariants.svelte';
