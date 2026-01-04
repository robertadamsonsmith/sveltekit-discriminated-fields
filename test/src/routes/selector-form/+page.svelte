<script lang="ts">
	import { contactForm } from "./data.remote";
	import { FieldVariants } from "sveltekit-discriminated-fields";
	import { slide } from "svelte/transition";
</script>

<h1>Non-Sibling Layout Test</h1>
<p>This page tests FieldVariants with a non-sibling DOM layout (no selector needed with form:has).</p>
<p><strong>Progressive Enhancement Demo:</strong> With JS enabled, variant sections slide in/out. Without JS, CSS handles visibility.</p>

<!-- The form has a nested structure where discriminator and variants are NOT siblings -->
<form {...contactForm} id="contact-form">
	<div class="form-header">
		<h2>Contact Preferences</h2>
		<!-- Discriminator is nested deep in the header -->
		<div class="selector-wrapper">
			<label>
				Contact Method:
				<select {...contactForm.fields.method.as("select")} id="method-select" data-testid="method-select">
					<option value="">Choose...</option>
					<option value="email">Email</option>
					<option value="phone">Phone</option>
				</select>
			</label>
		</div>
	</div>

	<div class="form-body">
		<!-- Variants are in a completely different branch of the DOM - form:has() handles this -->
		<div class="fields-container">
			<FieldVariants
				fields={contactForm.fields}
				key="method"
			>
				{#snippet fallback(props)}
					<p {...props} data-testid="fallback" transition:slide>Please select a contact method above.</p>
				{/snippet}
				{#snippet email(v)}
					<div {...v} data-testid="email-fields" transition:slide>
						<label>
							Email Address:
							<input {...v.fields.emailAddress.as("email")} data-testid="email-input" />
						</label>
					</div>
				{/snippet}
				{#snippet phone(v)}
					<div {...v} data-testid="phone-fields" transition:slide>
						<label>
							Phone Number:
							<input {...v.fields.phoneNumber.as("tel")} data-testid="phone-input" />
						</label>
					</div>
				{/snippet}
			</FieldVariants>
		</div>
	</div>

	{#if contactForm.result?.success}
		<div class="message" data-testid="success-message">
			{contactForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
