<script lang="ts">
	import { notificationForm } from "./data.remote";
	import { UnionVariants } from "sveltekit-discriminated-fields";
</script>

<h1>Nested Union Form</h1>
<p>
	This page tests a discriminated union nested inside another discriminated union. The outer union
	is "alert" vs "message", and alerts have an inner union for "warning" vs "error" severity.
</p>

<form {...notificationForm}>
	<div>
		<label>
			Notification Type:
			<select {...notificationForm.fields.type.as("select")}>
				<option value="">Select type...</option>
				<option value="alert">Alert</option>
				<option value="message">Message</option>
			</select>
		</label>
	</div>

	<UnionVariants fields={notificationForm.fields} key="type">
		{#snippet fallback()}
			<p data-testid="outer-fallback">Please select a notification type.</p>
		{/snippet}

		{#snippet alert(outerFields)}
			<div data-testid="alert-section">
				<h3>Alert Configuration</h3>
				<label>
					Severity:
					<select {...outerFields.severity.level.as("select")}>
						<option value="">Select severity...</option>
						<option value="warning">Warning</option>
						<option value="error">Error</option>
					</select>
				</label>

				<!-- Inner UnionVariants for the nested discriminated union -->
				<UnionVariants fields={outerFields.severity} key="level">
					{#snippet fallback()}
						<p data-testid="inner-fallback">Please select a severity level.</p>
					{/snippet}

					{#snippet warning(innerFields)}
						<div data-testid="warning-fields">
							<label>
								<input {...innerFields.dismissible.as("checkbox")} />
								Dismissible
							</label>
						</div>
					{/snippet}

					{#snippet error(innerFields)}
						<div data-testid="error-fields">
							<label>
								Error Code:
								<input {...innerFields.errorCode.as("text")} placeholder="E.g. ERR_001" />
							</label>
						</div>
					{/snippet}
				</UnionVariants>
			</div>
		{/snippet}

		{#snippet message(fields)}
			<div data-testid="message-section">
				<label>
					Content:
					<input {...fields.content.as("text")} placeholder="Enter message..." />
				</label>
			</div>
		{/snippet}
	</UnionVariants>

	<button type="submit">Send Notification</button>
</form>

{#if notificationForm.result?.success}
	<div data-testid="success">
		{notificationForm.result.message}
	</div>
{/if}
