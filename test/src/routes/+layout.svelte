<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">Home</a>
	<a href="/zod-form">Zod Form</a>
	<a href="/valibot-form">Valibot Form</a>
	<a href="/radio-form">Radio Form</a>
	<a href="/programmatic-form">Programmatic</a>
	<a href="/selector-form">Selector</a>
	<a href="/selector-radio-form">Selector Radio</a>
	<a href="/edge-cases">Edge Cases</a>
	<a href="/type-tests">Type Tests</a>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f0f0f0;
		flex-wrap: wrap;
	}
	main {
		padding: 1rem;
	}

	/* Global form styles */
	:global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
	}
	:global(label) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	:global(fieldset) {
		display: flex;
		gap: 1rem;
		border: 1px solid #ccc;
		padding: 1rem;
	}
	:global(fieldset label) {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	/* Messages */
	:global(.message) {
		padding: 1rem;
		border-radius: 4px;
		background: #e0ffe0;
		border: 1px solid #0a0;
	}
	:global(.message.error) {
		background: #ffe0e0;
		border-color: #a00;
	}
	:global(.field-error) {
		color: #a00;
		font-size: 0.875rem;
	}

	/* Invalid field styling */
	:global([aria-invalid="true"]) {
		border: 2px solid #a00;
		outline-color: #a00;
	}

	/* Button groups */
	:global(.buttons) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Selector form sections */
	:global(.form-header) {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
	}
	:global(.form-header h2) {
		margin: 0 0 1rem 0;
	}
	:global(.form-body) {
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	/* Programmatic controls section */
	:global(.programmatic-controls) {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #ccc;
	}
</style>
