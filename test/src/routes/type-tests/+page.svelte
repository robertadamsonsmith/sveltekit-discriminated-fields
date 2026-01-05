<script lang="ts">
	import {
		shapeForm,
		paymentForm,
		statusForm,
		itemForm,
		badForm,
		mixedTypeForm,
		nestedObjectForm,
	} from "./data.remote";
	import {
		discriminated,
		FieldVariants,
		type DiscriminatedData,
	} from "sveltekit-discriminated-fields";

	// =============================================================================
	// Test 6: Partially shared fields should ERROR
	// 'notes' exists in 'a' and 'b' but not 'c' - this is invalid
	// =============================================================================

	import type { FieldVariantsProps } from "sveltekit-discriminated-fields";

	// This type should resolve to an error string, not the fields type
	type BadFieldsValidation = FieldVariantsProps<"type", typeof badForm.fields>["fields"];

	// @ts-expect-error - BadFieldsValidation is an error string, not assignable to fields
	const _badTest: BadFieldsValidation = badForm.fields;

	// =============================================================================
	// Test 7: Common fields should NOT be accessible from snippet parameters
	// The 'description' field is common to all variants and should be excluded
	// =============================================================================

	// Get the type that the book snippet receives
	type BookSnippetParam = Parameters<
		NonNullable<FieldVariantsProps<"category", typeof itemForm.fields>["book"]>
	>[0];

	// Simulate accessing description from within a snippet - should ERROR
	const _snippetParam = {} as BookSnippetParam;
	// @ts-expect-error - description should NOT be accessible from within snippet (common fields are excluded)
	_snippetParam.fields.description;

	// Verify that variant-specific fields ARE accessible via .fields
	_snippetParam.fields.author; // OK - book-specific field
	_snippetParam.fields.isbn; // OK - book-specific field

	// =============================================================================
	// Test 8: Same field name but DIFFERENT types across variants should ERROR
	// 'data' is string in 'text' variant and number in 'numeric' variant
	// =============================================================================

	// This type should resolve to an error string because 'data' has different types
	type MixedTypeValidation = FieldVariantsProps<"format", typeof mixedTypeForm.fields>["fields"];

	// @ts-expect-error - MixedTypeValidation is an error string, not assignable to fields
	const _mixedTypeTest: MixedTypeValidation = mixedTypeForm.fields;

	// =============================================================================
	// Test 9: .as("radio", value) type safety - only valid discriminator values allowed
	// =============================================================================

	// This test uses shapeForm which has kind: "circle" | "rectangle" | "point"
	// We'll test that invalid values are rejected

	// First, create the discriminated fields (we'll use it for the test)
	const shapeForRadioTest = $derived(discriminated(shapeForm.fields, "kind"));

	$effect(() => {
		// Valid calls - these should compile without error
		shapeForRadioTest.fields.kind.as("radio", "circle");
		shapeForRadioTest.fields.kind.as("radio", "rectangle");
		shapeForRadioTest.fields.kind.as("radio", "point");

		// @ts-expect-error - "triangle" is not a valid discriminator value
		shapeForRadioTest.fields.kind.as("radio", "triangle");

		// @ts-expect-error - empty string is not a valid discriminator value
		shapeForRadioTest.fields.kind.as("radio", "");

		// @ts-expect-error - number is not a valid discriminator value
		shapeForRadioTest.fields.kind.as("radio", 123);
	});

	// =============================================================================
	// Test 1: discriminated() with 'kind' discriminator
	// =============================================================================

	const shape = $derived(discriminated(shapeForm.fields, "kind"));

	// Type extraction test - this is compile-time only
	type ExtractedShapeData = DiscriminatedData<typeof shape>;

	// Test: kindValue provides narrowing
	$effect(() => {
		if (shape.type === "circle") {
			// Should have access to radius
			shape.fields.radius.value();
			shape.fields.kind.value();

			// @ts-expect-error - width doesn't exist on circle
			shape.fields.width;

			// @ts-expect-error - height doesn't exist on circle
			shape.fields.height;
		}

		if (shape.type === "rectangle") {
			// Should have access to width and height
			shape.fields.width.value();
			shape.fields.height.value();

			// @ts-expect-error - radius doesn't exist on rectangle
			shape.fields.radius;
		}

		if (shape.type === "point") {
			// Should have access to x and y
			shape.fields.x.value();
			shape.fields.y.value();

			// @ts-expect-error - radius doesn't exist on point
			shape.fields.radius;
		}
	});

	// =============================================================================
	// Test 2: discriminated() with 'type' discriminator
	// =============================================================================

	const payment = $derived(discriminated(paymentForm.fields, "type"));

	$effect(() => {
		// Test: .type (discriminator value) when discriminator is 'type'
		if (payment.type === "card") {
			payment.fields.cardNumber.value();
			payment.fields.cvv.value();

			// @ts-expect-error - accountNumber doesn't exist on card
			payment.fields.accountNumber;
		}

		if (payment.type === "bank") {
			payment.fields.accountNumber.value();
			payment.fields.sortCode.value();

			// @ts-expect-error - cardNumber doesn't exist on bank
			payment.fields.cardNumber;
		}

		if (payment.type === "cash") {
			// Cash has no extra fields
			payment.fields.type.value();

			// @ts-expect-error - cardNumber doesn't exist on cash
			payment.fields.cardNumber;
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

	const status = $derived(discriminated(statusForm.fields, "status"));

	$effect(() => {
		if (status.type === "active") {
			status.fields.lastSeen.value();

			// @ts-expect-error - waitingSince doesn't exist on active
			status.fields.waitingSince;
		}

		if (status.type === "inactive") {
			// Only the discriminator is available
			status.fields.status.value();

			// @ts-expect-error - lastSeen doesn't exist on inactive
			status.fields.lastSeen;
		}

		if (status.type === "pending") {
			status.fields.waitingSince.value();

			// @ts-expect-error - lastSeen doesn't exist on pending
			status.fields.lastSeen;
		}
	});

	// =============================================================================
	// Test 5: Common fields across ALL variants (should be allowed)
	// =============================================================================

	const item = $derived(discriminated(itemForm.fields, "category"));

	$effect(() => {
		// 'description' is common to all variants - always accessible
		item.fields.description.value();

		if (item.type === "book") {
			item.fields.author.value();
			item.fields.isbn.value();
			// Common field still accessible within narrowed context
			item.fields.description.value();
		}
	});

	// =============================================================================
	// Test 10: Nested objects within variants (recursive field building)
	// =============================================================================

	const nestedObj = $derived(discriminated(nestedObjectForm.fields, "type"));

	$effect(() => {
		// 'name' is common to all variants
		nestedObj.fields.name.value();

		if (nestedObj.type === "person") {
			// Should have access to nested address object with fields
			nestedObj.fields.address.street.value();
			nestedObj.fields.address.city.value();
			nestedObj.fields.address.zipCode.value();

			// @ts-expect-error - headquarters doesn't exist on person
			nestedObj.fields.headquarters;
		}

		if (nestedObj.type === "company") {
			// Should have access to nested headquarters object with fields
			nestedObj.fields.headquarters.country.value();
			nestedObj.fields.headquarters.employees.value();

			// @ts-expect-error - address doesn't exist on company
			nestedObj.fields.address;
		}
	});
</script>

<h1>Type Tests</h1>

<p>
	<strong>Note:</strong> This page is for compile-time TypeScript type checking only (via svelte-check).
	The forms here are not expected to function properly at runtime.
</p>

<!-- =============================================================================
     Test 5: FieldVariants component type inference in templates
     ============================================================================= -->

<h2>Shape Form (kind discriminator)</h2>
<form {...shapeForm}>
	<select {...shape.fields.kind.as("select")}>
		<option value="">Select...</option>
		<option value="circle">Circle</option>
		<option value="rectangle">Rectangle</option>
		<option value="point">Point</option>
	</select>

	<FieldVariants fields={shapeForm.fields} key="kind">
		{#snippet fallback(props)}
			<p {...props}>Select a shape type</p>
		{/snippet}

		{#snippet circle(shape)}
			<!-- shape.fields is correctly typed with radius field -->
			<input {...shape} {...shape.fields.radius.as("number")} placeholder="radius" />
		{/snippet}

		{#snippet rectangle(shape)}
			<!-- shape.fields is correctly typed with width and height fields -->
			<div {...shape}>
				<input {...shape.fields.width.as("number")} placeholder="width" />
				<input {...shape.fields.height.as("number")} placeholder="height" />
			</div>
		{/snippet}

		{#snippet point(shape)}
			<!-- shape.fields is correctly typed with x and y fields -->
			<div {...shape}>
				<input {...shape.fields.x.as("number")} placeholder="x" />
				<input {...shape.fields.y.as("number")} placeholder="y" />
			</div>
		{/snippet}
	</FieldVariants>
</form>

<h2>Payment Form (type discriminator)</h2>
<form {...paymentForm}>
	<select {...payment.fields.type.as("select")}>
		<option value="">Select...</option>
		<option value="card">Card</option>
		<option value="bank">Bank</option>
		<option value="cash">Cash</option>
	</select>

	<FieldVariants fields={paymentForm.fields} key="type">
		{#snippet fallback(props)}
			<p {...props}>Select a payment type</p>
		{/snippet}

		{#snippet card(payment)}
			<div {...payment}>
				<input {...payment.fields.cardNumber.as("text")} placeholder="card number" />
				<input {...payment.fields.cvv.as("text")} placeholder="cvv" />
			</div>
		{/snippet}

		{#snippet bank(payment)}
			<div {...payment}>
				<input {...payment.fields.accountNumber.as("text")} placeholder="account" />
				<input {...payment.fields.sortCode.as("text")} placeholder="sort code" />
			</div>
		{/snippet}

		{#snippet cash(payment)}
			<p {...payment}>No additional fields for cash</p>
		{/snippet}
	</FieldVariants>
</form>

<h2>Status Form (variant with no extra fields)</h2>
<form {...statusForm}>
	<select {...status.fields.status.as("select")}>
		<option value="">Select...</option>
		<option value="active">Active</option>
		<option value="inactive">Inactive</option>
		<option value="pending">Pending</option>
	</select>

	<FieldVariants fields={statusForm.fields} key="status">
		{#snippet fallback(props)}
			<p {...props}>Select a status</p>
		{/snippet}

		{#snippet active(status)}
			<input {...status} {...status.fields.lastSeen.as("text")} placeholder="last seen" />
		{/snippet}

		{#snippet inactive(status)}
			<p {...status}>No additional fields for inactive status</p>
		{/snippet}

		{#snippet pending(status)}
			<input {...status} {...status.fields.waitingSince.as("text")} placeholder="waiting since" />
		{/snippet}
	</FieldVariants>
</form>

<!-- =============================================================================
     Test 6: partial={true} allows missing snippets
     ============================================================================= -->

<h2>Partial Variants (only circle and rectangle)</h2>
<FieldVariants fields={shapeForm.fields} key="kind" partial={true}>
	{#snippet circle(shape)}
		<input {...shape} {...shape.fields.radius.as("number")} />
	{/snippet}

	{#snippet rectangle(shape)}
		<input {...shape} {...shape.fields.width.as("number")} />
	{/snippet}

	<!-- point snippet intentionally missing - allowed with partial={true} -->
</FieldVariants>

<!-- =============================================================================
     Test 7: Common fields across ALL variants (should be allowed)
     ============================================================================= -->

<h2>Common Fields (description in all variants)</h2>
<form {...itemForm}>
	<!-- Common field can be used OUTSIDE FieldVariants -->
	<label>
		Description (common to all):
		<input {...item.fields.description.as("text")} placeholder="description" />
	</label>

	<select {...item.fields.category.as("select")}>
		<option value="">Select...</option>
		<option value="book">Book</option>
		<option value="electronics">Electronics</option>
		<option value="clothing">Clothing</option>
	</select>

	<!-- FieldVariants should work - common fields are allowed -->
	<FieldVariants fields={itemForm.fields} key="category">
		{#snippet fallback()}
			<p>Select a category</p>
		{/snippet}

		{#snippet book(item)}
			<input {...item} {...item.fields.author.as("text")} placeholder="author" />
			<input {...item.fields.isbn.as("text")} placeholder="isbn" />
		{/snippet}

		{#snippet electronics(item)}
			<input {...item} {...item.fields.brand.as("text")} placeholder="brand" />
			<input {...item.fields.warranty.as("text")} placeholder="warranty" />
		{/snippet}

		{#snippet clothing(item)}
			<input {...item} {...item.fields.size.as("text")} placeholder="size" />
			<input {...item.fields.color.as("text")} placeholder="color" />
		{/snippet}
	</FieldVariants>
</form>

<!-- =============================================================================
     Test 8: Partially shared fields should ERROR
     ============================================================================= -->

<h2>Partially Shared Fields (compile error expected)</h2>
<p>
	The <code>badForm</code> schema has 'notes' in variants 'a' and 'b' but not 'c'.
	Using it with <code>FieldVariants</code> produces a compile error.
	See the <code>@ts-expect-error</code> test in the script section.
</p>

<!-- =============================================================================
     Test 9: FieldVariants works with raw fields (not wrapped with discriminated)
     ============================================================================= -->

<h2>Raw Fields (without discriminated wrapper)</h2>
<form {...shapeForm}>
	<select {...shapeForm.fields.kind.as("select")}>
		<option value="">Select...</option>
		<option value="circle">Circle</option>
		<option value="rectangle">Rectangle</option>
		<option value="point">Point</option>
	</select>

	<FieldVariants fields={shapeForm.fields} key="kind">
		{#snippet fallback()}
			<p>Select a shape type</p>
		{/snippet}

		{#snippet circle(shape)}
			<input {...shape} {...shape.fields.radius.as("number")} placeholder="radius" />
		{/snippet}

		{#snippet rectangle(shape)}
			<input {...shape} {...shape.fields.width.as("number")} placeholder="width" />
			<input {...shape.fields.height.as("number")} placeholder="height" />
		{/snippet}

		{#snippet point(shape)}
			<input {...shape} {...shape.fields.x.as("number")} placeholder="x" />
			<input {...shape.fields.y.as("number")} placeholder="y" />
		{/snippet}
	</FieldVariants>
</form>
