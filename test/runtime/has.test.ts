import { discriminatedFields } from '../../dist/index.js';

// Mock field object that mimics SvelteKit's structure
// SvelteKit provides ALL fields from ALL variants at runtime
function createMockFields() {
	return {
		kind: { value: () => 'circle' as const },
		radius: { value: () => 10 },
		width: { value: () => 100 },
		height: { value: () => 50 },
		set: () => {},
		allIssues: () => undefined,
	};
}

const fields = createMockFields();
const shape = discriminatedFields('kind', fields);

// Test that 'in' operator works for kindValue
console.assert('kindValue' in shape, "'kindValue' should be in shape");

// Test that 'in' operator works for original fields
console.assert('kind' in shape, "'kind' should be in shape");
console.assert('radius' in shape, "'radius' should be in shape");
console.assert('set' in shape, "'set' should be in shape");

// Test that 'in' operator returns false for non-existent properties
console.assert(!('nonExistent' in shape), "'nonExistent' should not be in shape");
console.assert(!('typeValue' in shape), "'typeValue' should not be in shape (wrong key)");

// =============================================================================
// Runtime behavior: all fields are accessible regardless of narrowing
//
// Type narrowing is a compile-time TypeScript feature only. At runtime, all
// variant fields exist on the proxy and can be accessed. This is expected
// behavior - the library provides compile-time safety, not runtime validation.
// =============================================================================

// Even though kindValue is 'circle', we can access fields from other variants at runtime
console.assert(shape.kindValue === 'circle', "kindValue should be 'circle'");

// At runtime, we can still access 'width' even though it's not on the circle variant
// TypeScript would reject this at compile time, but JavaScript doesn't care
const widthField = (shape as any).width;
console.assert(widthField.value() === 100, "width is accessible at runtime even when narrowed to circle");

console.log('All runtime tests passed!');
