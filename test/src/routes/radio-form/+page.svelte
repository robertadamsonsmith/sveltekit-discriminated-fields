<script lang="ts">
	import { priorityForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	const priority = $derived(discriminated("level", priorityForm.fields));

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

	<FieldVariants fields={priority} key="level">
		{#snippet fallback(props)}
			<p {...props}>Please select a priority level above.</p>
		{/snippet}

		{#snippet high(v)}
			<label {...v}>
				Deadline:
				<input {...v.fields.deadline.as("text")} placeholder="Enter deadline" />
			</label>
		{/snippet}

		{#snippet medium(v)}
			<label {...v}>
				Notes (optional):
				<input {...v.fields.notes.as("text")} placeholder="Any notes?" />
			</label>
		{/snippet}

		{#snippet low(v)}
			<p {...v}>No additional information needed for low priority.</p>
		{/snippet}
	</FieldVariants>

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
