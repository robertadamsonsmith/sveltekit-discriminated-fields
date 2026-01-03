<script lang="ts">
	import { shippingForm } from "./data.remote";
	import { UnionVariants, discriminatedFields } from "sveltekit-discriminated-fields";

	const shipping = $derived(discriminatedFields("speed", shippingForm.fields));
</script>

<h1>Selector Prop with Radio Buttons</h1>
<p>This page tests the <code>selector</code> prop with radio buttons in a non-sibling layout.</p>

<form {...shippingForm} id="shipping-form">
	<div class="form-header">
		<h2>Shipping Options</h2>
		<!-- Radio buttons are in a fieldset with an id -->
		<fieldset id="speed-options" data-testid="speed-options">
			<legend>Select Speed:</legend>
			<label>
				<input {...shipping.speed.as("radio", "standard")} />
				Standard
			</label>
			<label>
				<input {...shipping.speed.as("radio", "express")} />
				Express
			</label>
		</fieldset>
	</div>

	<div class="form-body">
		<!-- Variants are in a different branch, using selector to find the fieldset -->
		<div class="fields-container">
			<UnionVariants
				fields={shippingForm.fields}
				key="speed"
				selector="#speed-options"
			>
				{#snippet fallback()}
					<p data-testid="fallback">Please select a shipping speed above.</p>
				{/snippet}
				{#snippet standard(fields)}
					<div data-testid="standard-fields">
						<label>
							Estimated Days:
							<input {...fields.estimatedDays.as("text")} data-testid="days-input" />
						</label>
					</div>
				{/snippet}
				{#snippet express(fields)}
					<div data-testid="express-fields">
						<label>
							Tracking ID:
							<input {...fields.trackingId.as("text")} data-testid="tracking-input" />
						</label>
					</div>
				{/snippet}
			</UnionVariants>
		</div>
	</div>

	{#if shippingForm.result?.success}
		<div class="message" data-testid="success-message">
			{shippingForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
