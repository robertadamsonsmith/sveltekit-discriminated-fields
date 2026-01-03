import { z } from "zod";
import { form } from "$app/server";

// =============================================================================
// Schema 1: Basic discriminated union (same as zod-form)
// =============================================================================

const shapeSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("circle"),
		radius: z.coerce.number().min(1),
	}),
	z.object({
		kind: z.literal("rectangle"),
		width: z.coerce.number().min(1),
		height: z.coerce.number().min(1),
	}),
	z.object({
		kind: z.literal("point"),
		x: z.coerce.number(),
		y: z.coerce.number(),
	}),
]);

export type ShapeData = z.infer<typeof shapeSchema>;

export const shapeForm = form(shapeSchema, async (data) => {
	return { success: true, data };
});

// =============================================================================
// Schema 2: Different discriminator key ('type' instead of 'kind')
// =============================================================================

const paymentSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("card"),
		cardNumber: z.string().min(16),
		cvv: z.string().min(3),
	}),
	z.object({
		type: z.literal("bank"),
		accountNumber: z.string().min(8),
		sortCode: z.string().min(6),
	}),
	z.object({
		type: z.literal("cash"),
	}),
]);

export type PaymentData = z.infer<typeof paymentSchema>;

export const paymentForm = form(paymentSchema, async (data) => {
	return { success: true, data };
});

// =============================================================================
// Schema 3: Variant with no extra fields
// =============================================================================

const statusSchema = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("active"),
		lastSeen: z.string(),
	}),
	z.object({
		status: z.literal("inactive"),
		// No extra fields - just the discriminator
	}),
	z.object({
		status: z.literal("pending"),
		waitingSince: z.string(),
	}),
]);

export type StatusData = z.infer<typeof statusSchema>;

export const statusForm = form(statusSchema, async (data) => {
	return { success: true, data };
});

// =============================================================================
// Schema 4: Common fields across ALL variants (should be allowed)
// The 'description' field exists in every variant
// =============================================================================

const itemSchema = z.discriminatedUnion("category", [
	z.object({
		category: z.literal("book"),
		description: z.string(), // Common to all
		author: z.string(),
		isbn: z.string(),
	}),
	z.object({
		category: z.literal("electronics"),
		description: z.string(), // Common to all
		brand: z.string(),
		warranty: z.string(),
	}),
	z.object({
		category: z.literal("clothing"),
		description: z.string(), // Common to all
		size: z.string(),
		color: z.string(),
	}),
]);

export type ItemData = z.infer<typeof itemSchema>;

export const itemForm = form(itemSchema, async (data) => {
	return { success: true, data };
});

// =============================================================================
// Schema 5: Partially shared fields (should ERROR at compile time)
// The 'notes' field exists in some but not all variants
// =============================================================================

const badSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("a"),
		notes: z.string(), // Shared with 'b' but not 'c'
		onlyA: z.string(),
	}),
	z.object({
		type: z.literal("b"),
		notes: z.string(), // Shared with 'a' but not 'c'
		onlyB: z.string(),
	}),
	z.object({
		type: z.literal("c"),
		// No 'notes' field here!
		onlyC: z.string(),
	}),
]);

export type BadData = z.infer<typeof badSchema>;

export const badForm = form(badSchema, async (data) => {
	return { success: true, data };
});

// =============================================================================
// Schema 6: Same field name but DIFFERENT types across variants
// 'data' is string in one variant and number in another
// =============================================================================

const mixedTypeSchema = z.discriminatedUnion("format", [
	z.object({
		format: z.literal("text"),
		data: z.string(), // string type
	}),
	z.object({
		format: z.literal("numeric"),
		data: z.coerce.number(), // number type
	}),
]);

export type MixedTypeData = z.infer<typeof mixedTypeSchema>;

export const mixedTypeForm = form(mixedTypeSchema, async (data) => {
	return { success: true, data };
});
