import { discriminatedFields } from '../../dist/index.js';

// Mock field object that mimics SvelteKit's structure
function createMockFields() {
	return {
		kind: { value: () => 'circle' as const },
		radius: { value: () => 10 },
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

console.log('All has() tests passed!');
