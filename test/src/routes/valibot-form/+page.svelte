<script lang="ts">
	import { paymentForm } from "./data.remote";
	import { discriminatedFields, UnionVariants } from "sveltekit-discriminated-fields";

	const payment = $derived(discriminatedFields("method", paymentForm.fields));
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

	<UnionVariants fields={payment} key="method">
		{#snippet fallback()}
			<p>Please select a payment method above.</p>
		{/snippet}

		{#snippet card(p)}
			<label>
				Card Number:
				<input {...p.cardNumber.as("text")} placeholder="1234567890123456" />
			</label>
			<label>
				CVV:
				<input {...p.cvv.as("text")} placeholder="123" />
			</label>
		{/snippet}

		{#snippet bank(p)}
			<label>
				Account Number:
				<input {...p.accountNumber.as("text")} placeholder="12345678" />
			</label>
			<label>
				Sort Code:
				<input {...p.sortCode.as("text")} placeholder="123456" />
			</label>
		{/snippet}

		{#snippet cash(_p)}
			<p>No additional information needed for cash payment.</p>
		{/snippet}
	</UnionVariants>

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
