<script lang="ts">
	import { shippingForm } from "./data.remote";
	import { FieldVariants, discriminated } from "sveltekit-discriminated-fields";

	const shipping = $derived(discriminated(shippingForm.fields, "speed"));
</script>

<h1>Radio Buttons with Non-Sibling Layout</h1>
<p>This page tests FieldVariants with radio buttons in a non-sibling DOM layout.</p>

<form {...shippingForm} id="shipping-form">
	<div class="form-header">
		<h2>Shipping Options</h2>
		<!-- Radio buttons are in a fieldset -->
		<fieldset id="speed-options" data-testid="speed-options">
			<legend>Select Speed:</legend>
			<label>
				<input {...shipping.fields.speed.as("radio", "standard")} />
				Standard
			</label>
			<label>
				<input {...shipping.fields.speed.as("radio", "express")} />
				Express
			</label>
		</fieldset>
	</div>

	<div class="form-body">
		<!-- Variants are in a different branch - form:has() handles this -->
		<div class="fields-container">
			<FieldVariants
				fields={shippingForm.fields}
				key="speed"
			>
				{#snippet fallback(props)}
					<p {...props} data-testid="fallback">Please select a shipping speed above.</p>
				{/snippet}
				{#snippet standard(shipping)}
					<div {...shipping} data-testid="standard-fields">
						<label>
							Estimated Days:
							<input {...shipping.fields.estimatedDays.as("text")} data-testid="days-input" />
						</label>
					</div>
				{/snippet}
				{#snippet express(shipping)}
					<div {...shipping} data-testid="express-fields">
						<label>
							Tracking ID:
							<input {...shipping.fields.trackingId.as("text")} data-testid="tracking-input" />
						</label>
					</div>
				{/snippet}
			</FieldVariants>
		</div>
	</div>

	{#if shippingForm.result?.success}
		<div class="message" data-testid="success-message">
			{shippingForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
