<script lang="ts">
	import { partialForm, noFallbackForm, edgeCaseForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	const partial = $derived(discriminated("variant", partialForm.fields));
	const noFallback = $derived(discriminated("variant", noFallbackForm.fields));
	const edge = $derived(discriminated("variant", edgeCaseForm.fields));
</script>

<h1>Edge Cases</h1>

<p><strong>Note:</strong> Each section uses a separate form to ensure proper isolation.</p>

<!-- =============================================================================
     Test 1: partial={true} - missing gamma snippet should render nothing
     ============================================================================= -->

<h2>Partial Variants (gamma missing)</h2>
<form {...partialForm} data-testid="partial-test">
	<select {...partial.variant.as("select")} data-testid="partial-select" id="partial-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<FieldVariants fields={partial} key="variant" partial={true}>
		{#snippet fallback(props)}
			<p {...props} data-testid="partial-fallback">Select a variant</p>
		{/snippet}

		{#snippet alpha(v)}
			<div {...v} data-testid="partial-alpha">
				<input {...v.fields.alphaField.as("text")} placeholder="alpha field" />
			</div>
		{/snippet}

		{#snippet beta(v)}
			<div {...v} data-testid="partial-beta">
				<input {...v.fields.betaField.as("text")} placeholder="beta field" />
			</div>
		{/snippet}

		<!-- gamma snippet intentionally missing - should render nothing when selected -->
	</FieldVariants>
</form>

<!-- =============================================================================
     Test 2: No fallback snippet - should show nothing when unselected
     ============================================================================= -->

<h2>No Fallback</h2>
<form {...noFallbackForm} data-testid="no-fallback-test">
	<select {...noFallback.variant.as("select")} data-testid="no-fallback-select" id="no-fallback-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<FieldVariants fields={noFallback} key="variant">
		{#snippet alpha(v)}
			<div {...v} data-testid="no-fallback-alpha">
				<input {...v.fields.alphaField.as("text")} placeholder="alpha field" />
			</div>
		{/snippet}

		{#snippet beta(v)}
			<div {...v} data-testid="no-fallback-beta">
				<input {...v.fields.betaField.as("text")} placeholder="beta field" />
			</div>
		{/snippet}

		{#snippet gamma(v)}
			<div {...v} data-testid="no-fallback-gamma">
				<input {...v.fields.gammaField.as("text")} placeholder="gamma field" />
			</div>
		{/snippet}
	</FieldVariants>
</form>

<!-- =============================================================================
     Test 3: Validation errors displayed within FieldVariants
     ============================================================================= -->

<h2>Validation Errors</h2>
<form {...edgeCaseForm} data-testid="validation-form">
	<select {...edge.variant.as("select")} data-testid="validation-select" id="validation-select">
		<option value="">Select...</option>
		<option value="alpha">Alpha</option>
		<option value="beta">Beta</option>
		<option value="gamma">Gamma</option>
	</select>

	<FieldVariants fields={edge} key="variant">
		{#snippet fallback(props)}
			<p {...props} data-testid="validation-fallback">Select a variant</p>
		{/snippet}

		{#snippet alpha(v)}
			{@const alphaIssues = v.fields.alphaField.issues()}
			<div {...v} data-testid="validation-alpha">
				<input {...v.fields.alphaField.as("text")} placeholder="alpha field" data-testid="alpha-input" />
				{#if alphaIssues?.length}
					<span class="error" data-testid="alpha-error">{alphaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}

		{#snippet beta(v)}
			{@const betaIssues = v.fields.betaField.issues()}
			<div {...v} data-testid="validation-beta">
				<input {...v.fields.betaField.as("text")} placeholder="beta field" data-testid="beta-input" />
				{#if betaIssues?.length}
					<span class="error" data-testid="beta-error">{betaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}

		{#snippet gamma(v)}
			{@const gammaIssues = v.fields.gammaField.issues()}
			<div {...v} data-testid="validation-gamma">
				<input {...v.fields.gammaField.as("text")} placeholder="gamma field" data-testid="gamma-input" />
				{#if gammaIssues?.length}
					<span class="error" data-testid="gamma-error">{gammaIssues[0].message}</span>
				{/if}
			</div>
		{/snippet}
	</FieldVariants>

	{#if edgeCaseForm.result?.success}
		<div class="message" data-testid="success-message">
			{edgeCaseForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
