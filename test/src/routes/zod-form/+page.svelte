<script lang="ts">
	import { shapeForm } from "./data.remote";
	import { discriminatedFields, UnionVariants } from "sveltekit-discriminated-fields";

	const shape = $derived(discriminatedFields("kind", shapeForm.fields));
</script>

<h1>Zod Discriminated Union Form</h1>

<form {...shapeForm}>
	<label>
		Shape type:
		<select {...shape.kind.as("select")}>
			<option value="">Select a shape...</option>
			<option value="circle">Circle</option>
			<option value="rectangle">Rectangle</option>
			<option value="point">Point</option>
		</select>
	</label>

	<UnionVariants fields={shape} key="kind">
		{#snippet fallback()}
			<p>Please select a shape type above.</p>
		{/snippet}

		{#snippet circle(s)}
			<label>
				Radius:
				<input {...s.radius.as("number")} />
			</label>
		{/snippet}

		{#snippet rectangle(s)}
			<label>
				Width:
				<input {...s.width.as("number")} />
			</label>
			<label>
				Height:
				<input {...s.height.as("number")} />
			</label>
		{/snippet}

		{#snippet point(s)}
			<label>
				X:
				<input {...s.x.as("number")} />
			</label>
			<label>
				Y:
				<input {...s.y.as("number")} />
			</label>
		{/snippet}
	</UnionVariants>

	{#if shape.allIssues()?.length}
		<div class="message error">
			{#each shape.allIssues() as issue}
				<p>{issue.message}</p>
			{/each}
		</div>
	{/if}

	{#if shapeForm.result?.success}
		<div class="message">
			{shapeForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
