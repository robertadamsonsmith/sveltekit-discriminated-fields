<script lang="ts">
	import { paymentForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	const payment = $derived(discriminated("method", paymentForm.fields));
</script>

<h1>Valibot Discriminated Union Form</h1>

<form {...paymentForm}>
	<label>
		Payment method:
		<select {...payment.method.as("select")}>
			<option value="">Select a payment method...</option>
			<option value="card">Credit Card</option>
			<option value="bank">Bank Transfer</option>
			<option value="cash">Cash</option>
		</select>
	</label>

	<FieldVariants fields={payment} key="method">
		{#snippet fallback(props)}
			<p {...props}>Please select a payment method above.</p>
		{/snippet}

		{#snippet card(v)}
			<div {...v}>
				<label>
					Card Number:
					<input {...v.fields.cardNumber.as("text")} placeholder="1234567890123456" />
				</label>
				<label>
					CVV:
					<input {...v.fields.cvv.as("text")} placeholder="123" />
				</label>
			</div>
		{/snippet}

		{#snippet bank(v)}
			<div {...v}>
				<label>
					Account Number:
					<input {...v.fields.accountNumber.as("text")} placeholder="12345678" />
				</label>
				<label>
					Sort Code:
					<input {...v.fields.sortCode.as("text")} placeholder="123456" />
				</label>
			</div>
		{/snippet}

		{#snippet cash(v)}
			<p {...v}>No additional information needed for cash payment.</p>
		{/snippet}
	</FieldVariants>

	{#if payment.allIssues()?.length}
		<div class="message error">
			{#each payment.allIssues() as issue}
				<p>{issue.message}</p>
			{/each}
		</div>
	{/if}

	{#if paymentForm.result?.success}
		<div class="message">
			{paymentForm.result.message}
		</div>
	{/if}

	<button type="submit">Submit</button>
</form>
