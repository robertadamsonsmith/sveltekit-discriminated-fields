<script lang="ts">
	import { priorityForm } from "./data.remote";
	import { discriminatedFields, UnionVariants } from "sveltekit-discriminated-fields";

	const priority = $derived(discriminatedFields("level", priorityForm.fields));

	// =============================================================================
	// Type Tests: .as("radio", value) is properly typed for discriminator fields
	// =============================================================================

	$effect(() => {
		// Valid values work
		priority.level.as("radio", "high");
		priority.level.as("radio", "medium");
		priority.level.as("radio", "low");

		// @ts-expect-error - invalid value rejected
		priority.level.as("radio", "invalid");

		// @ts-expect-error - typo rejected (case sensitive)
		priority.level.as("radio", "High");
	});
</script>

<h1>Radio Button Form</h1>

<form {...priorityForm}>
	<fieldset>
		<legend>Priority Level:</legend>
		<label>
			<input {...priority.level.as("radio", "high")} />
			High
		</label>
		<label>
			<input {...priority.level.as("radio", "medium")} />
			Medium
		</label>
		<label>
			<input {...priority.level.as("radio", "low")} />
			Low
		</label>
	</fieldset>

	<UnionVariants fields={priority} key="level">
		{#snippet fallback()}
			<p>Please select a priority level above.</p>
		{/snippet}

		{#snippet high(p)}
			<label>
				Deadline:
				<input {...p.deadline.as("text")} placeholder="Enter deadline" />
			</label>
		{/snippet}

		{#snippet medium(p)}
			<label>
				Notes (optional):
				<input {...p.notes.as("text")} placeholder="Any notes?" />
			</label>
		{/snippet}

		{#snippet low(_p)}
			<p>No additional information needed for low priority.</p>
		{/snippet}
	</UnionVariants>

	{#if priority.allIssues()?.length}
		<div class="message error">
			{#each priority.allIssues() as issue}
				<p>{issue.message}</p>
			{/each}
		</div>
	{/if}

	{#if priorityForm.result?.success}
		<div class="message">
			{priorityForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
