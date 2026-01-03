<script lang="ts">
	import { shapeForm, paymentForm, statusForm, itemForm, badForm, mixedTypeForm } from "./data.remote";
	import {
		discriminatedFields,
		UnionVariants,
		type DiscriminatedData,
	} from "sveltekit-discriminated-fields";

	// =============================================================================
	// Test 6: Partially shared fields should ERROR
	// 'notes' exists in 'a' and 'b' but not 'c' - this is invalid
	// =============================================================================

	import type { UnionVariantsProps } from "sveltekit-discriminated-fields";

	// This type should resolve to an error string, not the fields type
	type BadFieldsValidation = UnionVariantsProps<"type", typeof badForm.fields>["fields"];

	// @ts-expect-error - BadFieldsValidation is an error string, not assignable to fields
	const _badTest: BadFieldsValidation = badForm.fields;

	// =============================================================================
	// Test 7: Common fields should NOT be accessible from snippet parameters
	// The 'description' field is common to all variants and should be excluded
	// =============================================================================

	// Get the type that the book snippet receives
	type BookSnippetParam = Parameters<
		NonNullable<UnionVariantsProps<"category", typeof itemForm.fields>["book"]>
	>[0];

	// Simulate accessing description from within a snippet - should ERROR
	const _snippetParam = {} as BookSnippetParam;
	// @ts-expect-error - description should NOT be accessible from within snippet (common fields are excluded)
	_snippetParam.description;

	// Verify that variant-specific fields ARE accessible
	_snippetParam.author; // OK - book-specific field
	_snippetParam.isbn; // OK - book-specific field

	// =============================================================================
	// Test 8: Same field name but DIFFERENT types across variants should ERROR
	// 'data' is string in 'text' variant and number in 'numeric' variant
	// =============================================================================

	// This type should resolve to an error string because 'data' has different types
	type MixedTypeValidation = UnionVariantsProps<"format", typeof mixedTypeForm.fields>["fields"];

	// @ts-expect-error - MixedTypeValidation is an error string, not assignable to fields
	const _mixedTypeTest: MixedTypeValidation = mixedTypeForm.fields;

	// =============================================================================
	// Test 9: .as("radio", value) type safety - only valid discriminator values allowed
	// =============================================================================

	// This test uses shapeForm which has kind: "circle" | "rectangle" | "point"
	// We'll test that invalid values are rejected

	// First, create the discriminated fields (we'll use it for the test)
	const shapeForRadioTest = $derived(discriminatedFields("kind", shapeForm.fields));

	$effect(() => {
		// Valid calls - these should compile without error
		shapeForRadioTest.kind.as("radio", "circle");
		shapeForRadioTest.kind.as("radio", "rectangle");
		shapeForRadioTest.kind.as("radio", "point");

		// @ts-expect-error - "triangle" is not a valid discriminator value
		shapeForRadioTest.kind.as("radio", "triangle");

		// @ts-expect-error - empty string is not a valid discriminator value
		shapeForRadioTest.kind.as("radio", "");

		// @ts-expect-error - number is not a valid discriminator value
		shapeForRadioTest.kind.as("radio", 123);
	});

	// =============================================================================
	// Test 1: discriminatedFields() with 'kind' discriminator
	// =============================================================================

	const shape = $derived(discriminatedFields("kind", shapeForm.fields));

	// Type extraction test - this is compile-time only
	type ExtractedShapeData = DiscriminatedData<typeof shape>;

	// Test: kindValue provides narrowing
	$effect(() => {
		if (shape.kindValue === "circle") {
			// Should have access to radius
			shape.radius.value();
			shape.kind.value();

			// @ts-expect-error - width doesn't exist on circle
			shape.width;

			// @ts-expect-error - height doesn't exist on circle
			shape.height;
		}

		if (shape.kindValue === "rectangle") {
			// Should have access to width and height
			shape.width.value();
			shape.height.value();

			// @ts-expect-error - radius doesn't exist on rectangle
			shape.radius;
		}

		if (shape.kindValue === "point") {
			// Should have access to x and y
			shape.x.value();
			shape.y.value();

			// @ts-expect-error - radius doesn't exist on point
			shape.radius;
		}
	});

	// =============================================================================
	// Test 2: discriminatedFields() with 'type' discriminator
	// =============================================================================

	const payment = $derived(discriminatedFields("type", paymentForm.fields));

	$effect(() => {
		// Test: typeValue (not kindValue) when discriminator is 'type'
		if (payment.typeValue === "card") {
			payment.cardNumber.value();
			payment.cvv.value();

			// @ts-expect-error - accountNumber doesn't exist on card
			payment.accountNumber;
		}

		if (payment.typeValue === "bank") {
			payment.accountNumber.value();
			payment.sortCode.value();

			// @ts-expect-error - cardNumber doesn't exist on bank
			payment.cardNumber;
		}

		if (payment.typeValue === "cash") {
			// Cash has no extra fields
			payment.type.value();

			// @ts-expect-error - cardNumber doesn't exist on cash
			payment.cardNumber;
		}
	});

	// =============================================================================
	// Test 3: set() type safety
	// =============================================================================

	$effect(() => {
		// Valid calls
		shape.set({ kind: "circle", radius: 5 });
		shape.set({ kind: "rectangle", width: 10, height: 20 });
		shape.set({ kind: "point", x: 0, y: 0 });

		// @ts-expect-error - missing required field
		shape.set({ kind: "circle" });

		// @ts-expect-error - wrong field for variant
		shape.set({ kind: "circle", width: 10 });

		// @ts-expect-error - unknown kind
		shape.set({ kind: "triangle" });
	});

	// =============================================================================
	// Test 4: Variant with no extra fields (status: inactive)
	// =============================================================================

	const status = $derived(discriminatedFields("status", statusForm.fields));

	$effect(() => {
		if (status.statusValue === "active") {
			status.lastSeen.value();

			// @ts-expect-error - waitingSince doesn't exist on active
			status.waitingSince;
		}

		if (status.statusValue === "inactive") {
			// Only the discriminator is available
			status.status.value();

			// @ts-expect-error - lastSeen doesn't exist on inactive
			status.lastSeen;
		}

		if (status.statusValue === "pending") {
			status.waitingSince.value();

			// @ts-expect-error - lastSeen doesn't exist on pending
			status.lastSeen;
		}
	});

	// =============================================================================
	// Test 5: Common fields across ALL variants (should be allowed)
	// =============================================================================

	const item = $derived(discriminatedFields("category", itemForm.fields));

	$effect(() => {
		// 'description' is common to all variants - always accessible
		item.description.value();

		if (item.categoryValue === "book") {
			item.author.value();
			item.isbn.value();
			// Common field still accessible within narrowed context
			item.description.value();
		}
	});
</script>

<h1>Type Tests</h1>

<p>
	<strong>Note:</strong> This page is for compile-time TypeScript type checking only (via svelte-check).
	The forms here are not expected to function properly at runtime.
</p>

<!-- =============================================================================
     Test 5: UnionVariants component type inference in templates
     ============================================================================= -->

<h2>Shape Form (kind discriminator)</h2>
<form {...shapeForm}>
	<select {...shape.kind.as("select")}>
		<option value="">Select...</option>
		<option value="circle">Circle</option>
		<option value="rectangle">Rectangle</option>
		<option value="point">Point</option>
	</select>

	<UnionVariants fields={shape} key="kind">
		{#snippet fallback()}
			<p>Select a shape type</p>
		{/snippet}

		{#snippet circle(s)}
			<!-- s is correctly typed with radius field -->
			<input {...s.radius.as("number")} placeholder="radius" />
		{/snippet}

		{#snippet rectangle(s)}
			<!-- s is correctly typed with width and height fields -->
			<input {...s.width.as("number")} placeholder="width" />
			<input {...s.height.as("number")} placeholder="height" />
		{/snippet}

		{#snippet point(s)}
			<!-- s is correctly typed with x and y fields -->
			<input {...s.x.as("number")} placeholder="x" />
			<input {...s.y.as("number")} placeholder="y" />
		{/snippet}
	</UnionVariants>
</form>

<h2>Payment Form (type discriminator)</h2>
<form {...paymentForm}>
	<select {...payment.type.as("select")}>
		<option value="">Select...</option>
		<option value="card">Card</option>
		<option value="bank">Bank</option>
		<option value="cash">Cash</option>
	</select>

	<UnionVariants fields={payment} key="type">
		{#snippet fallback()}
			<p>Select a payment type</p>
		{/snippet}

		{#snippet card(p)}
			<input {...p.cardNumber.as("text")} placeholder="card number" />
			<input {...p.cvv.as("text")} placeholder="cvv" />
		{/snippet}

		{#snippet bank(p)}
			<input {...p.accountNumber.as("text")} placeholder="account" />
			<input {...p.sortCode.as("text")} placeholder="sort code" />
		{/snippet}

		{#snippet cash(_p)}
			<p>No additional fields for cash</p>
		{/snippet}
	</UnionVariants>
</form>

<h2>Status Form (variant with no extra fields)</h2>
<form {...statusForm}>
	<select {...status.status.as("select")}>
		<option value="">Select...</option>
		<option value="active">Active</option>
		<option value="inactive">Inactive</option>
		<option value="pending">Pending</option>
	</select>

	<UnionVariants fields={status} key="status">
		{#snippet fallback()}
			<p>Select a status</p>
		{/snippet}

		{#snippet active(s)}
			<input {...s.lastSeen.as("text")} placeholder="last seen" />
		{/snippet}

		{#snippet inactive(_s)}
			<p>No additional fields for inactive status</p>
		{/snippet}

		{#snippet pending(s)}
			<input {...s.waitingSince.as("text")} placeholder="waiting since" />
		{/snippet}
	</UnionVariants>
</form>

<!-- =============================================================================
     Test 6: partial={true} allows missing snippets
     ============================================================================= -->

<h2>Partial Variants (only circle and rectangle)</h2>
<UnionVariants fields={shape} key="kind" partial={true}>
	{#snippet circle(s)}
		<input {...s.radius.as("number")} />
	{/snippet}

	{#snippet rectangle(s)}
		<input {...s.width.as("number")} />
	{/snippet}

	<!-- point snippet intentionally missing - allowed with partial={true} -->
</UnionVariants>

<!-- =============================================================================
     Test 7: Common fields across ALL variants (should be allowed)
     ============================================================================= -->

<h2>Common Fields (description in all variants)</h2>
<form {...itemForm}>
	<!-- Common field can be used OUTSIDE UnionVariants -->
	<label>
		Description (common to all):
		<input {...item.description.as("text")} placeholder="description" />
	</label>

	<select {...item.category.as("select")}>
		<option value="">Select...</option>
		<option value="book">Book</option>
		<option value="electronics">Electronics</option>
		<option value="clothing">Clothing</option>
	</select>

	<!-- UnionVariants should work - common fields are allowed -->
	<UnionVariants fields={item} key="category">
		{#snippet fallback()}
			<p>Select a category</p>
		{/snippet}

		{#snippet book(i)}
			<input {...i.author.as("text")} placeholder="author" />
			<input {...i.isbn.as("text")} placeholder="isbn" />
		{/snippet}

		{#snippet electronics(i)}
			<input {...i.brand.as("text")} placeholder="brand" />
			<input {...i.warranty.as("text")} placeholder="warranty" />
		{/snippet}

		{#snippet clothing(i)}
			<input {...i.size.as("text")} placeholder="size" />
			<input {...i.color.as("text")} placeholder="color" />
		{/snippet}
	</UnionVariants>
</form>

<!-- =============================================================================
     Test 8: Partially shared fields should ERROR
     ============================================================================= -->

<h2>Partially Shared Fields (compile error expected)</h2>
<p>
	The <code>badForm</code> schema has 'notes' in variants 'a' and 'b' but not 'c'.
	Using it with <code>UnionVariants</code> produces a compile error.
	See the <code>@ts-expect-error</code> test in the script section.
</p>
