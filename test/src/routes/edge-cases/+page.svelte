<script lang="ts">
	import { edgeCaseForm } from "./data.remote";
	import { discriminatedFields, UnionVariants } from "sveltekit-discriminated-fields";

	const edge = $derived(discriminatedFields("variant", edgeCaseForm.fields));
</script>

<h1>Edge Cases</h1>

<p><strong>Note:</strong> This page tests edge cases for E2E testing and behaves unexpectedly when used manually. All three sections share the same form field, so changing one select affects all of them. Only the "Validation Errors" section is a submittable form.</p>

<!-- =============================================================================
     Test 1: partial={true} - missing gamma snippet should render nothing
     ============================================================================= -->

<h2>Partial Variants (gamma missing)</h2>
<section data-testid="partial-test">
	<select {...edge.variant.as("select")} data-testid="partial-select" id="partial-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<UnionVariants fields={edge} key="variant" partial={true} selector="#partial-select">
		{#snippet fallback()}
			<p data-testid="partial-fallback">Select a variant</p>
		{/snippet}

		{#snippet alpha(f)}
			<div data-testid="partial-alpha">
				<input {...f.alphaField.as("text")} placeholder="alpha field" />
			</div>
		{/snippet}

		{#snippet beta(f)}
			<div data-testid="partial-beta">
				<input {...f.betaField.as("text")} placeholder="beta field" />
			</div>
		{/snippet}

		<!-- gamma snippet intentionally missing - should render nothing when selected -->
	</UnionVariants>
</section>

<!-- =============================================================================
     Test 2: No fallback snippet - should show nothing when unselected
     ============================================================================= -->

<h2>No Fallback</h2>
<section data-testid="no-fallback-test">
	<select {...edge.variant.as("select")} data-testid="no-fallback-select" id="no-fallback-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<UnionVariants fields={edge} key="variant" selector="#no-fallback-select">
		{#snippet alpha(f)}
			<div data-testid="no-fallback-alpha">
				<input {...f.alphaField.as("text")} placeholder="alpha field" />
			</div>
		{/snippet}

		{#snippet beta(f)}
			<div data-testid="no-fallback-beta">
				<input {...f.betaField.as("text")} placeholder="beta field" />
			</div>
		{/snippet}

		{#snippet gamma(f)}
			<div data-testid="no-fallback-gamma">
				<input {...f.gammaField.as("text")} placeholder="gamma field" />
			</div>
		{/snippet}
	</UnionVariants>
</section>

<!-- =============================================================================
     Test 3: Validation errors displayed within UnionVariants
     ============================================================================= -->

<h2>Validation Errors</h2>
<form {...edgeCaseForm} data-testid="validation-form">
	<select {...edge.variant.as("select")} data-testid="validation-select" id="validation-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<UnionVariants fields={edge} key="variant" selector="#validation-select">
		{#snippet fallback()}
			<p data-testid="validation-fallback">Select a variant</p>
		{/snippet}

		{#snippet alpha(f)}
			{@const alphaIssues = f.alphaField.issues()}
			<div data-testid="validation-alpha">
				<input {...f.alphaField.as("text")} placeholder="alpha field" data-testid="alpha-input" />
				{#if alphaIssues?.length}
					<span class="error" data-testid="alpha-error">{alphaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}

		{#snippet beta(f)}
			{@const betaIssues = f.betaField.issues()}
			<div data-testid="validation-beta">
				<input {...f.betaField.as("text")} placeholder="beta field" data-testid="beta-input" />
				{#if betaIssues?.length}
					<span class="error" data-testid="beta-error">{betaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}

		{#snippet gamma(f)}
			{@const gammaIssues = f.gammaField.issues()}
			<div data-testid="validation-gamma">
				<input {...f.gammaField.as("text")} placeholder="gamma field" data-testid="gamma-input" />
				{#if gammaIssues?.length}
					<span class="error" data-testid="gamma-error">{gammaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}
	</UnionVariants>

	{#if edgeCaseForm.result?.success}
		<div class="message" data-testid="success-message">
			{edgeCaseForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
