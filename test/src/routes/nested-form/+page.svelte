<script lang="ts">
	import { orderForm, productForm } from "./data.remote";
	import { discriminatedFields, UnionVariants } from "sveltekit-discriminated-fields";

	// Nested discriminatedUnion: wrap the nested 'shipping' fields
	const shipping = $derived(discriminatedFields("method", orderForm.fields.shipping));

	// Common fields: wrap the top-level fields, common fields (name, price) displayed outside
	const product = $derived(discriminatedFields("type", productForm.fields));
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

	<UnionVariants fields={shipping} key="method">
		{#snippet fallback()}
			<p data-testid="shipping-fallback">Select a shipping method</p>
		{/snippet}

		{#snippet pickup(s)}
			<div data-testid="pickup-fields">
				<label>
					Store Location:
					<input {...s.storeLocation.as("text")} data-testid="store-location" />
				</label>
			</div>
		{/snippet}

		{#snippet delivery(s)}
			<div data-testid="delivery-fields">
				<label>
					Address:
					<input {...s.address.as("text")} data-testid="delivery-address" />
				</label>
				<label>
					Instructions (optional):
					<input {...s.instructions.as("text")} data-testid="delivery-instructions" />
				</label>
			</div>
		{/snippet}
	</UnionVariants>

	{#if orderForm.result?.success}
		<div class="message" data-testid="order-success">{orderForm.result.message}</div>
	{/if}

	<button type="submit">Place Order</button>
</form>

<!-- =============================================================================
     Test 2: Common fields displayed outside UnionVariants
     ============================================================================= -->

<h2>Common Fields</h2>
<p>The 'name' and 'price' fields are common to all variants and displayed outside UnionVariants. Only variant-specific fields are inside the snippets.</p>

<form {...productForm} data-testid="common-fields-form">
	<!-- Common fields: displayed once, outside UnionVariants -->
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

	<UnionVariants fields={product} key="type" selector="#product-type">
		{#snippet fallback()}
			<p data-testid="product-fallback">Select a product type for additional options</p>
		{/snippet}

		{#snippet physical(p)}
			<div data-testid="physical-fields">
				<label>
					Weight (kg):
					<input {...p.weight.as("number")} data-testid="product-weight" />
				</label>
				<label>
					Dimensions:
					<input {...p.dimensions.as("text")} data-testid="product-dimensions" />
				</label>
			</div>
		{/snippet}

		{#snippet digital(p)}
			<div data-testid="digital-fields">
				<label>
					Download URL:
					<input {...p.downloadUrl.as("url")} data-testid="download-url" />
				</label>
				<label>
					File Size:
					<input {...p.fileSize.as("text")} data-testid="file-size" />
				</label>
			</div>
		{/snippet}

		{#snippet subscription(p)}
			<div data-testid="subscription-fields">
				<label>
					Billing Cycle:
					<select {...p.billingCycle.as("select")} data-testid="billing-cycle">
						<option value="monthly">Monthly</option>
						<option value="yearly">Yearly</option>
					</select>
				</label>
				<label>
					Trial Days:
					<input {...p.trialDays.as("number")} data-testid="trial-days" />
				</label>
			</div>
		{/snippet}
	</UnionVariants>

	{#if productForm.result?.success}
		<div class="message" data-testid="product-success">{productForm.result.message}</div>
	{/if}

	<button type="submit">Add Product</button>
</form>
