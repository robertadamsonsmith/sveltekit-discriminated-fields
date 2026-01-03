import { test, expect } from "@playwright/test";

// =============================================================================
// Zod Form Tests
// =============================================================================

test.describe("Zod discriminated union form", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/zod-form");
	});

	test("shows fallback when no shape selected", async ({ page }) => {
		await expect(page.locator('[data-union-kind="fallback"]')).toBeVisible();
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="point"]')).toBeHidden();
	});

	test("shows circle fields when circle selected", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "circle");

		await expect(page.locator('[data-union-kind="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="circle"]')).toBeVisible();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="point"]')).toBeHidden();
	});

	test("shows rectangle fields when rectangle selected", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "rectangle");

		await expect(page.locator('[data-union-kind="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeVisible();
		await expect(page.locator('[data-union-kind="point"]')).toBeHidden();
	});

	test("shows point fields when point selected", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "point");

		await expect(page.locator('[data-union-kind="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="point"]')).toBeVisible();
	});

	test("submits circle form successfully", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "circle");
		await page.fill('input[name="n:radius"]', "10");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Circle with radius 10");
	});

	test("submits rectangle form successfully", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "rectangle");
		await page.fill('input[name="n:width"]', "20");
		await page.fill('input[name="n:height"]', "30");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Rectangle 20x30");
	});

	test("submits point form successfully", async ({ page }) => {
		await page.selectOption('select[name="kind"]', "point");
		await page.fill('input[name="n:x"]', "5");
		await page.fill('input[name="n:y"]', "10");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Point at (5, 10)");
	});

	test("switches between variants correctly", async ({ page }) => {
		// Start with circle
		await page.selectOption('select[name="kind"]', "circle");
		await expect(page.locator('[data-union-kind="circle"]')).toBeVisible();

		// Switch to rectangle
		await page.selectOption('select[name="kind"]', "rectangle");
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeVisible();

		// Switch to point
		await page.selectOption('select[name="kind"]', "point");
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="point"]')).toBeVisible();
	});
});

// =============================================================================
// Valibot Form Tests
// =============================================================================

test.describe("Valibot discriminated union form", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/valibot-form");
	});

	test("shows fallback when no payment method selected", async ({ page }) => {
		await expect(page.locator('[data-union-method="fallback"]')).toBeVisible();
		await expect(page.locator('[data-union-method="card"]')).toBeHidden();
		await expect(page.locator('[data-union-method="bank"]')).toBeHidden();
		await expect(page.locator('[data-union-method="cash"]')).toBeHidden();
	});

	test("shows card fields when card selected", async ({ page }) => {
		await page.selectOption('select[name="method"]', "card");

		await expect(page.locator('[data-union-method="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-method="card"]')).toBeVisible();
		await expect(page.locator('[data-union-method="bank"]')).toBeHidden();
		await expect(page.locator('[data-union-method="cash"]')).toBeHidden();
	});

	test("shows bank fields when bank selected", async ({ page }) => {
		await page.selectOption('select[name="method"]', "bank");

		await expect(page.locator('[data-union-method="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-method="card"]')).toBeHidden();
		await expect(page.locator('[data-union-method="bank"]')).toBeVisible();
		await expect(page.locator('[data-union-method="cash"]')).toBeHidden();
	});

	test("shows cash fields when cash selected", async ({ page }) => {
		await page.selectOption('select[name="method"]', "cash");

		await expect(page.locator('[data-union-method="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-method="card"]')).toBeHidden();
		await expect(page.locator('[data-union-method="bank"]')).toBeHidden();
		await expect(page.locator('[data-union-method="cash"]')).toBeVisible();
	});

	test("submits card form successfully", async ({ page }) => {
		await page.selectOption('select[name="method"]', "card");
		await page.fill('input[name="cardNumber"]', "1234567890123456");
		await page.fill('input[name="cvv"]', "123");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Card ending in 3456");
	});

	test("submits bank form successfully", async ({ page }) => {
		await page.selectOption('select[name="method"]', "bank");
		await page.fill('input[name="accountNumber"]', "12345678");
		await page.fill('input[name="sortCode"]', "123456");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Bank account 12345678");
	});

	test("submits cash form successfully", async ({ page }) => {
		await page.selectOption('select[name="method"]', "cash");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Cash payment");
	});
});

// =============================================================================
// Radio Button Form Tests
// =============================================================================

test.describe("Radio button form", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/radio-form");
	});

	test("shows fallback when no radio selected", async ({ page }) => {
		await expect(page.locator('[data-union-level="fallback"]')).toBeVisible();
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
		await expect(page.locator('[data-union-level="low"]')).toBeHidden();
	});

	test("shows high fields when high radio selected", async ({ page }) => {
		await page.click('input[name="level"][value="high"]');

		await expect(page.locator('[data-union-level="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-level="high"]')).toBeVisible();
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
		await expect(page.locator('[data-union-level="low"]')).toBeHidden();
	});

	test("shows medium fields when medium radio selected", async ({ page }) => {
		await page.click('input[name="level"][value="medium"]');

		await expect(page.locator('[data-union-level="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeVisible();
		await expect(page.locator('[data-union-level="low"]')).toBeHidden();
	});

	test("shows low fields when low radio selected", async ({ page }) => {
		await page.click('input[name="level"][value="low"]');

		await expect(page.locator('[data-union-level="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
		await expect(page.locator('[data-union-level="low"]')).toBeVisible();
	});

	test("switches between variants on radio click", async ({ page }) => {
		// Start with high
		await page.click('input[name="level"][value="high"]');
		await expect(page.locator('[data-union-level="high"]')).toBeVisible();

		// Switch to medium
		await page.click('input[name="level"][value="medium"]');
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeVisible();

		// Switch to low
		await page.click('input[name="level"][value="low"]');
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
		await expect(page.locator('[data-union-level="low"]')).toBeVisible();
	});

	test("submits high priority form successfully", async ({ page }) => {
		await page.click('input[name="level"][value="high"]');
		await page.fill('input[name="deadline"]', "2024-01-15");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: High priority with deadline: 2024-01-15");
	});

	test("submits medium priority form successfully", async ({ page }) => {
		await page.click('input[name="level"][value="medium"]');
		await page.fill('input[name="notes"]', "Review needed");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Medium priority (Review needed)");
	});

	test("submits low priority form successfully", async ({ page }) => {
		await page.click('input[name="level"][value="low"]');
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Low priority");
	});
});

// =============================================================================
// No-JS Tests (Progressive Enhancement)
//
// These tests verify that CSS-only visibility works without JavaScript.
// The :has() selector handles showing/hiding variants based on form state.
// =============================================================================

test.describe("Progressive enhancement (no JavaScript)", () => {
	test.use({ javaScriptEnabled: false });

	// Select element tests
	test("select: fallback visible when nothing selected", async ({ page }) => {
		await page.goto("/zod-form");

		await expect(page.locator('[data-union-kind="fallback"]')).toBeVisible();
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="point"]')).toBeHidden();
	});

	test("select: shows correct variant when option selected", async ({ page }) => {
		await page.goto("/zod-form");

		await page.selectOption('select[name="kind"]', "circle");

		await expect(page.locator('[data-union-kind="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="circle"]')).toBeVisible();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeHidden();
	});

	test("select: switches variants without JS", async ({ page }) => {
		await page.goto("/zod-form");

		// Select circle
		await page.selectOption('select[name="kind"]', "circle");
		await expect(page.locator('[data-union-kind="circle"]')).toBeVisible();

		// Switch to rectangle
		await page.selectOption('select[name="kind"]', "rectangle");
		await expect(page.locator('[data-union-kind="circle"]')).toBeHidden();
		await expect(page.locator('[data-union-kind="rectangle"]')).toBeVisible();
	});

	test("select: form submission works without JS", async ({ page }) => {
		await page.goto("/zod-form");

		await page.selectOption('select[name="kind"]', "circle");
		await page.fill('input[name="n:radius"]', "5");
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Circle with radius 5");
	});

	// Radio button tests
	test("radio: fallback visible when nothing checked", async ({ page }) => {
		await page.goto("/radio-form");

		await expect(page.locator('[data-union-level="fallback"]')).toBeVisible();
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
		await expect(page.locator('[data-union-level="low"]')).toBeHidden();
	});

	test("radio: shows correct variant when radio checked", async ({ page }) => {
		await page.goto("/radio-form");

		await page.click('input[name="level"][value="high"]');

		await expect(page.locator('[data-union-level="fallback"]')).toBeHidden();
		await expect(page.locator('[data-union-level="high"]')).toBeVisible();
		await expect(page.locator('[data-union-level="medium"]')).toBeHidden();
	});

	test("radio: switches variants without JS", async ({ page }) => {
		await page.goto("/radio-form");

		// Check high
		await page.click('input[name="level"][value="high"]');
		await expect(page.locator('[data-union-level="high"]')).toBeVisible();

		// Switch to medium
		await page.click('input[name="level"][value="medium"]');
		await expect(page.locator('[data-union-level="high"]')).toBeHidden();
		await expect(page.locator('[data-union-level="medium"]')).toBeVisible();
	});

	test("radio: form submission works without JS", async ({ page }) => {
		await page.goto("/radio-form");

		await page.click('input[name="level"][value="low"]');
		await page.click('button[type="submit"]');

		await expect(page.locator(".message")).toContainText("Success: Low priority");
	});

	// Valibot form (additional select test)
	test("valibot select: visibility and submission work without JS", async ({ page }) => {
		await page.goto("/valibot-form");

		// Fallback visible initially
		await expect(page.locator('[data-union-method="fallback"]')).toBeVisible();

		// Select and submit
		await page.selectOption('select[name="method"]', "cash");
		await expect(page.locator('[data-union-method="cash"]')).toBeVisible();

		await page.click('button[type="submit"]');
		await expect(page.locator(".message")).toContainText("Success: Cash payment");
	});
});

// =============================================================================
// Programmatic Form Tests (discriminatedFields features)
//
// Tests for: set(), ${key}Value, asRadio(), issues(), using without UnionVariants
// =============================================================================

test.describe("Programmatic form controls", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/programmatic-form");
		// Wait for network idle to ensure full hydration
		await page.waitForLoadState("networkidle");
	});

	// asRadio() runtime behavior
	test("asRadio() creates working radio buttons", async ({ page }) => {
		// Initially no channel selected
		await expect(page.getByTestId("channel-value")).toContainText("none");
		await expect(page.getByTestId("no-channel")).toBeVisible();

		// Click email radio
		await page.click('input[name="channel"][value="email"]');
		await expect(page.getByTestId("channel-value")).toContainText("email");
		await expect(page.getByTestId("email-fields")).toBeVisible();

		// Switch to SMS
		await page.click('input[name="channel"][value="sms"]');
		await expect(page.getByTestId("channel-value")).toContainText("sms");
		await expect(page.getByTestId("sms-fields")).toBeVisible();
		await expect(page.getByTestId("email-fields")).toBeHidden();
	});

	// channelValue accessor
	test("channelValue accessor reflects current selection", async ({ page }) => {
		await expect(page.getByTestId("channel-value")).toContainText("none");

		await page.click('input[name="channel"][value="push"]');
		await expect(page.getByTestId("channel-value")).toContainText("push");

		await page.click('input[name="channel"][value="email"]');
		await expect(page.getByTestId("channel-value")).toContainText("email");
	});

	// Programmatic set() with valid data
	test("set() programmatically fills form with valid data", async ({ page }) => {
		// Click set email button
		await page.getByTestId("set-email").click();

		// Should switch to email and fill the field
		await expect(page.getByTestId("channel-value")).toContainText("email", { timeout: 5000 });
		await expect(page.getByTestId("email-input")).toHaveValue("test@example.com");

		// Submit should succeed
		await page.click('button[type="submit"]');
		await expect(page.getByTestId("success-message")).toContainText("Email sent to test@example.com");
	});

	test("set() works for different variants", async ({ page }) => {
		// Set SMS
		await page.getByTestId("set-sms").click();
		await expect(page.getByTestId("channel-value")).toContainText("sms");
		await expect(page.getByTestId("phone-input")).toHaveValue("1234567890");

		// Set Push
		await page.getByTestId("set-push").click();
		await expect(page.getByTestId("channel-value")).toContainText("push");
		await expect(page.getByTestId("device-input")).toHaveValue("device-123");
	});

	// Validation errors display
	test("shows validation errors for invalid email", async ({ page }) => {
		await page.getByTestId("set-invalid-email").click();
		// Wait for email fields to appear before submitting
		await expect(page.getByTestId("email-fields")).toBeVisible();
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("email-error")).toContainText("Invalid email address");
	});

	test("shows validation errors for invalid phone", async ({ page }) => {
		await page.getByTestId("set-invalid-phone").click();
		// Wait for sms fields to appear before submitting
		await expect(page.getByTestId("sms-fields")).toBeVisible();
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("phone-error")).toContainText("Phone must be at least 10 digits");
	});

	// Using discriminatedFields without UnionVariants
	test("works without UnionVariants component", async ({ page }) => {
		// The programmatic-form page uses manual if/else instead of UnionVariants
		// Verify visibility switching still works

		await page.click('input[name="channel"][value="email"]');
		await expect(page.getByTestId("email-fields")).toBeVisible();
		await expect(page.getByTestId("sms-fields")).toBeHidden();
		await expect(page.getByTestId("push-fields")).toBeHidden();

		await page.click('input[name="channel"][value="sms"]');
		await expect(page.getByTestId("email-fields")).toBeHidden();
		await expect(page.getByTestId("sms-fields")).toBeVisible();
		await expect(page.getByTestId("push-fields")).toBeHidden();
	});

	// Form submission
	test("submits email notification successfully", async ({ page }) => {
		await page.click('input[name="channel"][value="email"]');
		await page.fill('[data-testid="email-input"]', "user@example.com");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Email sent to user@example.com");
	});

	test("submits SMS notification successfully", async ({ page }) => {
		await page.click('input[name="channel"][value="sms"]');
		await page.fill('[data-testid="phone-input"]', "9876543210");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("SMS sent to 9876543210");
	});

	test("submits push notification successfully", async ({ page }) => {
		await page.click('input[name="channel"][value="push"]');
		await page.fill('[data-testid="device-input"]', "my-device");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Push sent to device my-device");
	});
});

// =============================================================================
// Selector prop tests - non-sibling DOM layouts
//
// Tests for: selector prop allowing UnionVariants to work when discriminator
// and variants are not siblings in the DOM
// =============================================================================

test.describe("Selector prop (non-sibling layout)", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/selector-form");
		await page.waitForLoadState("networkidle");
	});

	test("shows fallback when no method selected", async ({ page }) => {
		await expect(page.getByTestId("fallback")).toBeVisible();
		await expect(page.getByTestId("email-fields")).toBeHidden();
		await expect(page.getByTestId("phone-fields")).toBeHidden();
	});

	test("shows email fields when email selected", async ({ page }) => {
		await page.selectOption('[data-testid="method-select"]', "email");

		await expect(page.getByTestId("email-fields")).toBeVisible();
		await expect(page.getByTestId("phone-fields")).toBeHidden();
		await expect(page.getByTestId("fallback")).toBeHidden();
	});

	test("shows phone fields when phone selected", async ({ page }) => {
		await page.selectOption('[data-testid="method-select"]', "phone");

		await expect(page.getByTestId("phone-fields")).toBeVisible();
		await expect(page.getByTestId("email-fields")).toBeHidden();
		await expect(page.getByTestId("fallback")).toBeHidden();
	});

	test("switches between variants", async ({ page }) => {
		await page.selectOption('[data-testid="method-select"]', "email");
		await expect(page.getByTestId("email-fields")).toBeVisible();

		await page.selectOption('[data-testid="method-select"]', "phone");
		await expect(page.getByTestId("phone-fields")).toBeVisible();
		await expect(page.getByTestId("email-fields")).toBeHidden();
	});

	test("submits email form successfully", async ({ page }) => {
		await page.selectOption('[data-testid="method-select"]', "email");
		await page.fill('[data-testid="email-input"]', "test@example.com");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Contact via email: test@example.com");
	});

	test("submits phone form successfully", async ({ page }) => {
		await page.selectOption('[data-testid="method-select"]', "phone");
		await page.fill('[data-testid="phone-input"]', "1234567890");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Contact via phone: 1234567890");
	});

	test("works without JavaScript (progressive enhancement)", async ({ browser }) => {
		// Create a new context with JavaScript disabled
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();

		await page.goto("/selector-form");

		// Initially shows fallback
		await expect(page.getByTestId("fallback")).toBeVisible();

		// Select email - should show email fields via CSS
		await page.selectOption('[data-testid="method-select"]', "email");
		await expect(page.getByTestId("email-fields")).toBeVisible();
		await expect(page.getByTestId("fallback")).toBeHidden();

		await context.close();
	});
});

// =============================================================================
// Selector prop with radio buttons
// =============================================================================

test.describe("Selector prop with radio buttons", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/selector-radio-form");
		await page.waitForLoadState("networkidle");
	});

	test("shows fallback when no speed selected", async ({ page }) => {
		await expect(page.getByTestId("fallback")).toBeVisible();
		await expect(page.getByTestId("standard-fields")).toBeHidden();
		await expect(page.getByTestId("express-fields")).toBeHidden();
	});

	test("shows standard fields when standard selected", async ({ page }) => {
		await page.click('input[name="speed"][value="standard"]');

		await expect(page.getByTestId("standard-fields")).toBeVisible();
		await expect(page.getByTestId("express-fields")).toBeHidden();
		await expect(page.getByTestId("fallback")).toBeHidden();
	});

	test("shows express fields when express selected", async ({ page }) => {
		await page.click('input[name="speed"][value="express"]');

		await expect(page.getByTestId("express-fields")).toBeVisible();
		await expect(page.getByTestId("standard-fields")).toBeHidden();
		await expect(page.getByTestId("fallback")).toBeHidden();
	});

	test("switches between variants", async ({ page }) => {
		await page.click('input[name="speed"][value="standard"]');
		await expect(page.getByTestId("standard-fields")).toBeVisible();

		await page.click('input[name="speed"][value="express"]');
		await expect(page.getByTestId("express-fields")).toBeVisible();
		await expect(page.getByTestId("standard-fields")).toBeHidden();
	});

	test("submits standard form successfully", async ({ page }) => {
		await page.click('input[name="speed"][value="standard"]');
		await page.fill('[data-testid="days-input"]', "5-7");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Standard shipping: 5-7 days");
	});

	test("submits express form successfully", async ({ page }) => {
		await page.click('input[name="speed"][value="express"]');
		await page.fill('[data-testid="tracking-input"]', "EXP123456");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success-message")).toContainText("Express shipping with tracking: EXP123456");
	});

	test("works without JavaScript (progressive enhancement)", async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();

		await page.goto("/selector-radio-form");

		// Initially shows fallback
		await expect(page.getByTestId("fallback")).toBeVisible();

		// Click standard radio - should show standard fields via CSS
		await page.click('input[name="speed"][value="standard"]');
		await expect(page.getByTestId("standard-fields")).toBeVisible();
		await expect(page.getByTestId("fallback")).toBeHidden();

		await context.close();
	});
});

// =============================================================================
// Edge Cases
// =============================================================================

test.describe("Edge cases", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/edge-cases");
		await page.waitForLoadState("networkidle");
	});

	// -------------------------------------------------------------------------
	// partial={true} behavior
	// -------------------------------------------------------------------------

	test("partial={true} shows fallback when nothing selected", async ({ page }) => {
		await expect(page.getByTestId("partial-fallback")).toBeVisible();
		await expect(page.getByTestId("partial-alpha")).toBeHidden();
		await expect(page.getByTestId("partial-beta")).toBeHidden();
	});

	test("partial={true} shows alpha snippet when alpha selected", async ({ page }) => {
		await page.getByTestId("partial-select").selectOption("alpha");

		await expect(page.getByTestId("partial-fallback")).toBeHidden();
		await expect(page.getByTestId("partial-alpha")).toBeVisible();
		await expect(page.getByTestId("partial-beta")).toBeHidden();
	});

	test("partial={true} shows beta snippet when beta selected", async ({ page }) => {
		await page.getByTestId("partial-select").selectOption("beta");

		await expect(page.getByTestId("partial-fallback")).toBeHidden();
		await expect(page.getByTestId("partial-alpha")).toBeHidden();
		await expect(page.getByTestId("partial-beta")).toBeVisible();
	});

	test("partial={true} shows fallback when missing snippet selected", async ({ page }) => {
		await page.getByTestId("partial-select").selectOption("gamma");

		// Fallback should still be visible (no snippet for gamma, so fallback is the catch-all)
		await expect(page.getByTestId("partial-fallback")).toBeVisible();
		// Alpha and beta should be hidden
		await expect(page.getByTestId("partial-alpha")).toBeHidden();
		await expect(page.getByTestId("partial-beta")).toBeHidden();
		// No gamma element should exist (snippet was not provided)
		await expect(page.locator('[data-testid="partial-gamma"]')).toHaveCount(0);
	});

	// -------------------------------------------------------------------------
	// No fallback snippet
	// -------------------------------------------------------------------------

	test("no fallback: shows nothing when nothing selected", async ({ page }) => {
		// No fallback element should exist
		await expect(page.locator('[data-testid="no-fallback-fallback"]')).toHaveCount(0);
		// Variant snippets should be hidden
		await expect(page.getByTestId("no-fallback-alpha")).toBeHidden();
		await expect(page.getByTestId("no-fallback-beta")).toBeHidden();
		await expect(page.getByTestId("no-fallback-gamma")).toBeHidden();
	});

	test("no fallback: shows alpha when alpha selected", async ({ page }) => {
		await page.getByTestId("no-fallback-select").selectOption("alpha");

		await expect(page.getByTestId("no-fallback-alpha")).toBeVisible();
		await expect(page.getByTestId("no-fallback-beta")).toBeHidden();
		await expect(page.getByTestId("no-fallback-gamma")).toBeHidden();
	});

	test("no fallback: shows gamma when gamma selected", async ({ page }) => {
		await page.getByTestId("no-fallback-select").selectOption("gamma");

		await expect(page.getByTestId("no-fallback-alpha")).toBeHidden();
		await expect(page.getByTestId("no-fallback-beta")).toBeHidden();
		await expect(page.getByTestId("no-fallback-gamma")).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// Validation errors with UnionVariants
	// -------------------------------------------------------------------------

	test("validation errors: shows error for empty required field", async ({ page }) => {
		// Select alpha variant
		await page.getByTestId("validation-select").selectOption("alpha");
		await expect(page.getByTestId("validation-alpha")).toBeVisible();

		// Submit without filling in the required field
		await page.click('button[type="submit"]');

		// Should show validation error
		await expect(page.getByTestId("alpha-error")).toBeVisible();
		await expect(page.getByTestId("alpha-error")).toContainText("Alpha field is required");
	});

	test("validation errors: clears error after valid submission", async ({ page }) => {
		// Select alpha variant
		await page.getByTestId("validation-select").selectOption("alpha");

		// Submit without filling in the required field to get error
		await page.click('button[type="submit"]');
		await expect(page.getByTestId("alpha-error")).toBeVisible();

		// Fill in the field and submit again
		await page.getByTestId("alpha-input").fill("test value");
		await page.click('button[type="submit"]');

		// Should show success message
		await expect(page.getByTestId("success-message")).toBeVisible();
		await expect(page.getByTestId("success-message")).toContainText("Success: Alpha: test value");
	});

	test("validation errors: shows error in correct variant snippet", async ({ page }) => {
		// Select beta variant
		await page.getByTestId("validation-select").selectOption("beta");
		await expect(page.getByTestId("validation-beta")).toBeVisible();

		// Submit without filling in the required field
		await page.click('button[type="submit"]');

		// Should show validation error in beta snippet
		await expect(page.getByTestId("beta-error")).toBeVisible();
		await expect(page.getByTestId("beta-error")).toContainText("Beta field is required");

		// Alpha error should not exist (different variant)
		await expect(page.locator('[data-testid="alpha-error"]')).toHaveCount(0);
	});
});

// =============================================================================
// Nested discriminatedUnion and common fields tests
// =============================================================================

test.describe("Nested discriminated union", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/nested-form");
		await page.waitForLoadState("networkidle");
	});

	test("shows fallback when no shipping method selected", async ({ page }) => {
		await expect(page.getByTestId("shipping-fallback")).toBeVisible();
		await expect(page.getByTestId("pickup-fields")).toBeHidden();
		await expect(page.getByTestId("delivery-fields")).toBeHidden();
	});

	test("shows pickup fields when pickup selected", async ({ page }) => {
		await page.click('[data-testid="shipping-pickup"]');

		await expect(page.getByTestId("pickup-fields")).toBeVisible();
		await expect(page.getByTestId("delivery-fields")).toBeHidden();
		await expect(page.getByTestId("shipping-fallback")).toBeHidden();
	});

	test("shows delivery fields when delivery selected", async ({ page }) => {
		await page.click('[data-testid="shipping-delivery"]');

		await expect(page.getByTestId("delivery-fields")).toBeVisible();
		await expect(page.getByTestId("pickup-fields")).toBeHidden();
		await expect(page.getByTestId("shipping-fallback")).toBeHidden();
	});

	test("top-level fields are always visible", async ({ page }) => {
		// Top-level fields should be visible regardless of shipping selection
		await expect(page.getByTestId("order-id")).toBeVisible();
		await expect(page.getByTestId("customer-name")).toBeVisible();

		// Select pickup - top-level fields still visible
		await page.click('[data-testid="shipping-pickup"]');
		await expect(page.getByTestId("order-id")).toBeVisible();
		await expect(page.getByTestId("customer-name")).toBeVisible();
	});

	test("submits pickup order successfully", async ({ page }) => {
		await page.fill('[data-testid="order-id"]', "ORD-123");
		await page.fill('[data-testid="customer-name"]', "John Doe");
		await page.click('[data-testid="shipping-pickup"]');
		await page.fill('[data-testid="store-location"]', "Downtown Store");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("order-success")).toContainText("Order ORD-123 for John Doe: Pickup at Downtown Store");
	});

	test("submits delivery order successfully", async ({ page }) => {
		await page.fill('[data-testid="order-id"]', "ORD-456");
		await page.fill('[data-testid="customer-name"]', "Jane Smith");
		await page.click('[data-testid="shipping-delivery"]');
		await page.fill('[data-testid="delivery-address"]', "123 Main St");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("order-success")).toContainText("Order ORD-456 for Jane Smith: Deliver to 123 Main St");
	});
});

test.describe("Common fields outside UnionVariants", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/nested-form");
		await page.waitForLoadState("networkidle");
	});

	test("common fields are always visible", async ({ page }) => {
		// Common fields visible before selection
		await expect(page.getByTestId("product-name")).toBeVisible();
		await expect(page.getByTestId("product-price")).toBeVisible();

		// Still visible after selecting a variant
		await page.selectOption('[data-testid="product-type"]', "physical");
		await expect(page.getByTestId("product-name")).toBeVisible();
		await expect(page.getByTestId("product-price")).toBeVisible();
	});

	test("shows fallback when no product type selected", async ({ page }) => {
		await expect(page.getByTestId("product-fallback")).toBeVisible();
		await expect(page.getByTestId("physical-fields")).toBeHidden();
		await expect(page.getByTestId("digital-fields")).toBeHidden();
		await expect(page.getByTestId("subscription-fields")).toBeHidden();
	});

	test("shows physical fields when physical selected", async ({ page }) => {
		await page.selectOption('[data-testid="product-type"]', "physical");

		await expect(page.getByTestId("physical-fields")).toBeVisible();
		await expect(page.getByTestId("digital-fields")).toBeHidden();
		await expect(page.getByTestId("subscription-fields")).toBeHidden();
	});

	test("shows digital fields when digital selected", async ({ page }) => {
		await page.selectOption('[data-testid="product-type"]', "digital");

		await expect(page.getByTestId("digital-fields")).toBeVisible();
		await expect(page.getByTestId("physical-fields")).toBeHidden();
		await expect(page.getByTestId("subscription-fields")).toBeHidden();
	});

	test("shows subscription fields when subscription selected", async ({ page }) => {
		await page.selectOption('[data-testid="product-type"]', "subscription");

		await expect(page.getByTestId("subscription-fields")).toBeVisible();
		await expect(page.getByTestId("physical-fields")).toBeHidden();
		await expect(page.getByTestId("digital-fields")).toBeHidden();
	});

	test("submits physical product successfully", async ({ page }) => {
		await page.fill('[data-testid="product-name"]', "Widget");
		await page.fill('[data-testid="product-price"]', "30");
		await page.selectOption('[data-testid="product-type"]', "physical");
		await page.fill('[data-testid="product-weight"]', "3");
		await page.fill('[data-testid="product-dimensions"]', "10x5x3");
		await page.getByTestId("common-fields-form").locator('button[type="submit"]').click();
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("product-success")).toContainText("Physical: Widget ($30) - 3kg, 10x5x3");
	});

	test("submits digital product successfully", async ({ page }) => {
		await page.fill('[data-testid="product-name"]', "E-Book");
		await page.fill('[data-testid="product-price"]', "10");
		await page.selectOption('[data-testid="product-type"]', "digital");
		await page.fill('[data-testid="download-url"]', "https://example.com/ebook.pdf");
		await page.fill('[data-testid="file-size"]', "15MB");
		await page.getByTestId("common-fields-form").locator('button[type="submit"]').click();
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("product-success")).toContainText("Digital: E-Book ($10) - 15MB download");
	});

	test("submits subscription product successfully", async ({ page }) => {
		await page.fill('[data-testid="product-name"]', "Pro Plan");
		await page.fill('[data-testid="product-price"]', "20");
		await page.selectOption('[data-testid="product-type"]', "subscription");
		await page.selectOption('[data-testid="billing-cycle"]', "monthly");
		await page.fill('[data-testid="trial-days"]', "14");
		await page.getByTestId("common-fields-form").locator('button[type="submit"]').click();
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("product-success")).toContainText("Subscription: Pro Plan ($20/monthly) - 14 day trial");
	});
});

// =============================================================================
// Nested discriminated union (union inside union) tests
// =============================================================================

test.describe("Discriminated union inside discriminated union", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/nested-union-form");
	});

	test("shows outer fallback when no type selected", async ({ page }) => {
		await expect(page.getByTestId("outer-fallback")).toBeVisible();
		await expect(page.getByTestId("alert-section")).not.toBeVisible();
		await expect(page.getByTestId("message-section")).not.toBeVisible();
	});

	test("shows message fields when message selected", async ({ page }) => {
		await page.selectOption('select[name="type"]', "message");

		await expect(page.getByTestId("outer-fallback")).not.toBeVisible();
		await expect(page.getByTestId("message-section")).toBeVisible();
		await expect(page.getByTestId("alert-section")).not.toBeVisible();
	});

	test("shows alert section with inner fallback when alert selected", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");

		await expect(page.getByTestId("outer-fallback")).not.toBeVisible();
		await expect(page.getByTestId("alert-section")).toBeVisible();
		await expect(page.getByTestId("inner-fallback")).toBeVisible();
		await expect(page.getByTestId("warning-fields")).not.toBeVisible();
		await expect(page.getByTestId("error-fields")).not.toBeVisible();
	});

	test("shows warning fields when alert + warning selected", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");
		await page.selectOption('select[name="severity.level"]', "warning");

		await expect(page.getByTestId("alert-section")).toBeVisible();
		await expect(page.getByTestId("inner-fallback")).not.toBeVisible();
		await expect(page.getByTestId("warning-fields")).toBeVisible();
		await expect(page.getByTestId("error-fields")).not.toBeVisible();
	});

	test("shows error fields when alert + error selected", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");
		await page.selectOption('select[name="severity.level"]', "error");

		await expect(page.getByTestId("alert-section")).toBeVisible();
		await expect(page.getByTestId("inner-fallback")).not.toBeVisible();
		await expect(page.getByTestId("warning-fields")).not.toBeVisible();
		await expect(page.getByTestId("error-fields")).toBeVisible();
	});

	test("switches between inner variants", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");
		await page.selectOption('select[name="severity.level"]', "warning");
		await expect(page.getByTestId("warning-fields")).toBeVisible();

		await page.selectOption('select[name="severity.level"]', "error");
		await expect(page.getByTestId("warning-fields")).not.toBeVisible();
		await expect(page.getByTestId("error-fields")).toBeVisible();
	});

	test("submits message notification successfully", async ({ page }) => {
		await page.selectOption('select[name="type"]', "message");
		await page.fill('input[name="content"]', "Hello world");
		await page.click('button[type="submit"]');

		// Wait for success element to appear (with longer timeout for form processing)
		await expect(page.getByTestId("success")).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId("success")).toContainText('Message: "Hello world"');
	});

	test("submits alert warning notification successfully", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");
		await page.selectOption('select[name="severity.level"]', "warning");
		// SvelteKit prefixes boolean checkbox fields with "b:"
		await page.check('input[name="b:severity.dismissible"]');
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success")).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId("success")).toContainText("Alert (warning): dismissible=true");
	});

	test("submits alert error notification successfully", async ({ page }) => {
		await page.selectOption('select[name="type"]', "alert");
		await page.selectOption('select[name="severity.level"]', "error");
		await page.fill('input[name="severity.errorCode"]', "ERR_500");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("success")).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId("success")).toContainText("Alert (error): code=ERR_500");
	});
});
