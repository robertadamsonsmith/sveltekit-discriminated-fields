<script lang="ts">
	import { shapeForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	const shape = $derived(discriminated("kind", shapeForm.fields));
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

	<FieldVariants fields={shape} key="kind">
		{#snippet fallback(props)}
			<p {...props}>Please select a shape type above.</p>
		{/snippet}

		{#snippet circle(v)}
			<label {...v}>
				Radius:
				<input {...v.fields.radius.as("number")} />
			</label>
		{/snippet}

		{#snippet rectangle(v)}
			<div {...v}>
				<label>
					Width:
					<input {...v.fields.width.as("number")} />
				</label>
				<label>
					Height:
					<input {...v.fields.height.as("number")} />
				</label>
			</div>
		{/snippet}

		{#snippet point(v)}
			<div {...v}>
				<label>
					X:
					<input {...v.fields.x.as("number")} />
				</label>
				<label>
					Y:
					<input {...v.fields.y.as("number")} />
				</label>
			</div>
		{/snippet}
	</FieldVariants>

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
