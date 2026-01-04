<script lang="ts">
	import { notificationForm } from "./data.remote";
	import { FieldVariants } from "sveltekit-discriminated-fields";
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

	<FieldVariants fields={notificationForm.fields} key="type">
		{#snippet fallback(props)}
			<p {...props} data-testid="outer-fallback">Please select a notification type.</p>
		{/snippet}

		{#snippet alert(v)}
			<div {...v} data-testid="alert-section">
				<h3>Alert Configuration</h3>
				<label>
					Severity:
					<select {...v.fields.severity.level.as("select")}>
						<option value="">Select severity...</option>
						<option value="warning">Warning</option>
						<option value="error">Error</option>
					</select>
				</label>

				<!-- Inner FieldVariants for the nested discriminated union -->
				<FieldVariants fields={v.fields.severity} key="level">
					{#snippet fallback(innerProps)}
						<p {...innerProps} data-testid="inner-fallback">Please select a severity level.</p>
					{/snippet}

					{#snippet warning(inner)}
						<div {...inner} data-testid="warning-fields">
							<label>
								<input {...inner.fields.dismissible.as("checkbox")} />
								Dismissible
							</label>
						</div>
					{/snippet}

					{#snippet error(inner)}
						<div {...inner} data-testid="error-fields">
							<label>
								Error Code:
								<input {...inner.fields.errorCode.as("text")} placeholder="E.g. ERR_001" />
							</label>
						</div>
					{/snippet}
				</FieldVariants>
			</div>
		{/snippet}

		{#snippet message(v)}
			<div {...v} data-testid="message-section">
				<label>
					Content:
					<input {...v.fields.content.as("text")} placeholder="Enter message..." />
				</label>
			</div>
		{/snippet}
	</FieldVariants>

	<button type="submit">Send Notification</button>
</form>

{#if notificationForm.result?.success}
	<div data-testid="success">
		{notificationForm.result.message}
	</div>
{/if}
