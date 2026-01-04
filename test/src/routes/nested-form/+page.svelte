<script lang="ts">
	import { orderForm, productForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	// Nested discriminatedUnion: wrap the nested 'shipping' fields
	const shipping = $derived(discriminated("method", orderForm.fields.shipping));

	// Common fields: wrap the top-level fields, common fields (name, price) displayed outside
	const product = $derived(discriminated("type", productForm.fields));
</script>

<h1>Nested & Common Fields</h1>

<!-- =============================================================================
     Test 1: Nested discriminatedUnion (shipping is child of order)
     ============================================================================= -->

<h2>Nested Discriminated Union</h2>
<p>The shipping options are nested inside the order schema. Top-level fields (orderId, customerName) are outside the union.</p>

<form {...orderForm} data-testid="nested-form">
	<div>
		<label>
			Order ID:
			<input {...orderForm.fields.orderId.as("text")} data-testid="order-id" />
		</label>
	</div>

	<div>
		<label>
			Customer Name:
			<input {...orderForm.fields.customerName.as("text")} data-testid="customer-name" />
		</label>
	</div>

	<fieldset>
		<legend>Shipping Method:</legend>
		<label>
			<input {...shipping.method.as("radio", "pickup")} data-testid="shipping-pickup" />
			Pickup
		</label>
		<label>
			<input {...shipping.method.as("radio", "delivery")} data-testid="shipping-delivery" />
			Delivery
		</label>
	</fieldset>

	<FieldVariants fields={shipping} key="method">
		{#snippet fallback(props)}
			<p {...props} data-testid="shipping-fallback">Select a shipping method</p>
		{/snippet}

		{#snippet pickup(v)}
			<div {...v} data-testid="pickup-fields">
				<label>
					Store Location:
					<input {...v.fields.storeLocation.as("text")} data-testid="store-location" />
				</label>
			</div>
		{/snippet}

		{#snippet delivery(v)}
			<div {...v} data-testid="delivery-fields">
				<label>
					Address:
					<input {...v.fields.address.as("text")} data-testid="delivery-address" />
				</label>
				<label>
					Instructions (optional):
					<input {...v.fields.instructions.as("text")} data-testid="delivery-instructions" />
				</label>
			</div>
		{/snippet}
	</FieldVariants>

	{#if orderForm.result?.success}
		<div class="message" data-testid="order-success">{orderForm.result.message}</div>
	{/if}

	<button type="submit">Place Order</button>
</form>

<!-- =============================================================================
     Test 2: Common fields displayed outside FieldVariants
     ============================================================================= -->

<h2>Common Fields</h2>
<p>The 'name' and 'price' fields are common to all variants and displayed outside FieldVariants. Only variant-specific fields are inside the snippets.</p>

<form {...productForm} data-testid="common-fields-form">
	<!-- Common fields: displayed once, outside FieldVariants -->
	<div data-testid="common-fields">
		<label>
			Product Name:
			<input {...product.name.as("text")} data-testid="product-name" />
		</label>
		<label>
			Price:
			<input {...product.price.as("number")} data-testid="product-price" />
		</label>
	</div>

	<select {...product.type.as("select")} data-testid="product-type" id="product-type">
		<option value="">Select product type...</option>
		<option value="physical">Physical</option>
		<option value="digital">Digital</option>
		<option value="subscription">Subscription</option>
	</select>

	<FieldVariants fields={product} key="type">
		{#snippet fallback(props)}
			<p {...props} data-testid="product-fallback">Select a product type for additional options</p>
		{/snippet}

		{#snippet physical(v)}
			<div {...v} data-testid="physical-fields">
				<label>
					Weight (kg):
					<input {...v.fields.weight.as("number")} data-testid="product-weight" />
				</label>
				<label>
					Dimensions:
					<input {...v.fields.dimensions.as("text")} data-testid="product-dimensions" />
				</label>
			</div>
		{/snippet}

		{#snippet digital(v)}
			<div {...v} data-testid="digital-fields">
				<label>
					Download URL:
					<input {...v.fields.downloadUrl.as("url")} data-testid="download-url" />
				</label>
				<label>
					File Size:
					<input {...v.fields.fileSize.as("text")} data-testid="file-size" />
				</label>
			</div>
		{/snippet}

		{#snippet subscription(v)}
			<div {...v} data-testid="subscription-fields">
				<label>
					Billing Cycle:
					<select {...v.fields.billingCycle.as("select")} data-testid="billing-cycle">
						<option value="monthly">Monthly</option>
						<option value="yearly">Yearly</option>
					</select>
				</label>
				<label>
					Trial Days:
					<input {...v.fields.trialDays.as("number")} data-testid="trial-days" />
				</label>
			</div>
		{/snippet}
	</FieldVariants>

	{#if productForm.result?.success}
		<div class="message" data-testid="product-success">{productForm.result.message}</div>
	{/if}

	<button type="submit">Add Product</button>
</form>
