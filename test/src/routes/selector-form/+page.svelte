<script lang="ts">
	import { contactForm } from "./data.remote";
	import { UnionVariants } from "sveltekit-discriminated-fields";
</script>

<h1>Selector Prop Test</h1>
<p>This page tests the <code>selector</code> prop with a non-sibling layout.</p>

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
		<!-- Variants are in a completely different branch of the DOM -->
		<div class="fields-container">
			<UnionVariants
				fields={contactForm.fields}
				key="method"
				selector="#method-select"
			>
				{#snippet fallback()}
					<p data-testid="fallback">Please select a contact method above.</p>
				{/snippet}
				{#snippet email(fields)}
					<div data-testid="email-fields">
						<label>
							Email Address:
							<input {...fields.emailAddress.as("email")} data-testid="email-input" />
						</label>
					</div>
				{/snippet}
				{#snippet phone(fields)}
					<div data-testid="phone-fields">
						<label>
							Phone Number:
							<input {...fields.phoneNumber.as("tel")} data-testid="phone-input" />
						</label>
					</div>
				{/snippet}
			</UnionVariants>
		</div>
	</div>

	{#if contactForm.result?.success}
		<div class="message" data-testid="success-message">
			{contactForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
