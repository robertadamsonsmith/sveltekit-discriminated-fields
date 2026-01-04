<script lang="ts">
	import { notificationForm } from "./data.remote";
	import { discriminated } from "sveltekit-discriminated-fields";

	const notification = $derived(discriminated("channel", notificationForm.fields));

	// Test: programmatic set() for each variant
	function setEmail() {
		notification.set({ channel: "email", email: "test@example.com" });
	}

	function setSms() {
		notification.set({ channel: "sms", phone: "1234567890" });
	}

	function setPush() {
		notification.set({ channel: "push", deviceId: "device-123" });
	}

	// Test: set with invalid data (will show validation errors)
	// Use "invalid@x" - passes browser's type="email" validation but fails Zod's stricter check
	function setInvalidEmail() {
		notification.set({ channel: "email", email: "invalid@x" });
	}

	function setInvalidPhone() {
		notification.set({ channel: "sms", phone: "123" });
	}
</script>

<h1>Programmatic Form Tests</h1>

<form {...notificationForm}>
	<!-- Test: .as("radio", value) runtime behavior -->
	<fieldset>
		<legend>Notification Channel:</legend>
		<label>
			<input {...notification.channel.as("radio", "email")} />
			Email
		</label>
		<label>
			<input {...notification.channel.as("radio", "sms")} />
			SMS
		</label>
		<label>
			<input {...notification.channel.as("radio", "push")} />
			Push
		</label>
	</fieldset>

	<!-- Test: channelValue accessor -->
	<p data-testid="channel-value">
		Current channel: <strong>{notification.channelValue ?? "none"}</strong>
	</p>

	<!-- Test: using discriminated without FieldVariants -->
	{#if notification.channelValue === "email"}
		<div data-testid="email-fields">
			<label>
				Email Address:
				<input {...notification.email.as("email")} data-testid="email-input" />
			</label>
			{#if notification.email.issues()?.length}
				<div class="field-error" data-testid="email-error">
					{notification.email.issues()?.[0]?.message}
				</div>
			{/if}
		</div>
	{:else if notification.channelValue === "sms"}
		<div data-testid="sms-fields">
			<label>
				Phone Number:
				<input {...notification.phone.as("tel")} data-testid="phone-input" />
			</label>
			{#if notification.phone.issues()?.length}
				<div class="field-error" data-testid="phone-error">
					{notification.phone.issues()?.[0]?.message}
				</div>
			{/if}
		</div>
	{:else if notification.channelValue === "push"}
		<div data-testid="push-fields">
			<label>
				Device ID:
				<input {...notification.deviceId.as("text")} data-testid="device-input" />
			</label>
			{#if notification.deviceId.issues()?.length}
				<div class="field-error" data-testid="device-error">
					{notification.deviceId.issues()?.[0]?.message}
				</div>
			{/if}
		</div>
	{:else}
		<p data-testid="no-channel">Please select a notification channel.</p>
	{/if}

	<!-- Test: allIssues() for form-level errors -->
	{#if notification.allIssues()?.length}
		<div class="message error" data-testid="all-issues">
			{#each notification.allIssues() ?? [] as issue}
				<p>{issue.message}</p>
			{/each}
		</div>
	{/if}

	{#if notificationForm.result?.success}
		<div class="message" data-testid="success-message">
			{notificationForm.result.message}
		</div>
	{/if}

	<div class="buttons">
		<button type="submit">Submit</button>
	</div>
</form>

<!-- Test: programmatic set() buttons -->
<div class="programmatic-controls">
	<h2>Programmatic Controls</h2>
	<div class="buttons">
		<button type="button" onclick={setEmail} data-testid="set-email">
			Set Email (valid)
		</button>
		<button type="button" onclick={setSms} data-testid="set-sms">
			Set SMS (valid)
		</button>
		<button type="button" onclick={setPush} data-testid="set-push">
			Set Push (valid)
		</button>
	</div>
	<div class="buttons">
		<button type="button" onclick={setInvalidEmail} data-testid="set-invalid-email">
			Set Invalid Email
		</button>
		<button type="button" onclick={setInvalidPhone} data-testid="set-invalid-phone">
			Set Invalid Phone
		</button>
	</div>
</div>
