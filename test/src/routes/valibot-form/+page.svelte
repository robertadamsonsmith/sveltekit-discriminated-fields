<script lang="ts">
	import { paymentForm } from "./data.remote";
	import { discriminated, FieldVariants } from "sveltekit-discriminated-fields";

	const payment = $derived(discriminated(paymentForm.fields, "method"));
</script>

<h1>Valibot Discriminated Union Form</h1>

<form {...paymentForm}>
	<label>
		Payment method:
		<select {...payment.fields.method.as("select")}>
			<option value="">Select a payment method...</option>
			<option value="card">Credit Card</option>
			<option value="bank">Bank Transfer</option>
			<option value="cash">Cash</option>
		</select>
	</label>

	<FieldVariants fields={paymentForm.fields} key="method">
		{#snippet fallback(props)}
			<p {...props}>Please select a payment method above.</p>
		{/snippet}

		{#snippet card(payment)}
			<div {...payment}>
				<label>
					Card Number:
					<input {...payment.fields.cardNumber.as("text")} placeholder="1234567890123456" />
				</label>
				<label>
					CVV:
					<input {...payment.fields.cvv.as("text")} placeholder="123" />
				</label>
			</div>
		{/snippet}

		{#snippet bank(payment)}
			<div {...payment}>
				<label>
					Account Number:
					<input {...payment.fields.accountNumber.as("text")} placeholder="12345678" />
				</label>
				<label>
					Sort Code:
					<input {...payment.fields.sortCode.as("text")} placeholder="123456" />
				</label>
			</div>
		{/snippet}

		{#snippet cash(payment)}
			<p {...payment}>No additional information needed for cash payment.</p>
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
