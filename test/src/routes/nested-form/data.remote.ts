import { z } from "zod";
import { form } from "$app/server";

// =============================================================================
// Schema 1: Nested discriminatedUnion (union is child of top-level object)
// =============================================================================

const orderSchema = z.object({
	// Top-level fields (not part of the discriminated union)
	orderId: z.string().min(1, "Order ID is required"),
	customerName: z.string().min(1, "Customer name is required"),

	// Nested discriminated union for shipping method
	shipping: z.discriminatedUnion("method", [
		z.object({
			method: z.literal("pickup"),
			storeLocation: z.string().min(1, "Store location is required"),
		}),
		z.object({
			method: z.literal("delivery"),
			address: z.string().min(1, "Address is required"),
			instructions: z.string().optional(),
		}),
	]),
});

export type OrderData = z.infer<typeof orderSchema>;

export const orderForm = form(orderSchema, async (data) => {
	if (data.shipping.method === "pickup") {
		return {
			success: true,
			message: `Order ${data.orderId} for ${data.customerName}: Pickup at ${data.shipping.storeLocation}`,
		};
	}
	return {
		success: true,
		message: `Order ${data.orderId} for ${data.customerName}: Deliver to ${data.shipping.address}`,
	};
});

// =============================================================================
// Schema 2: Top-level discriminatedUnion with common fields
// =============================================================================

const productSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("physical"),
		name: z.string().min(1, "Name is required"), // Common
		price: z.coerce.number().min(0, "Price must be positive"), // Common
		weight: z.coerce.number().min(0, "Weight must be positive"),
		dimensions: z.string().min(1, "Dimensions are required"),
	}),
	z.object({
		type: z.literal("digital"),
		name: z.string().min(1, "Name is required"), // Common
		price: z.coerce.number().min(0, "Price must be positive"), // Common
		downloadUrl: z.string().url("Must be a valid URL"),
		fileSize: z.string().min(1, "File size is required"),
	}),
	z.object({
		type: z.literal("subscription"),
		name: z.string().min(1, "Name is required"), // Common
		price: z.coerce.number().min(0, "Price must be positive"), // Common (per month)
		billingCycle: z.enum(["monthly", "yearly"]),
		trialDays: z.coerce.number().min(0),
	}),
]);

export type ProductData = z.infer<typeof productSchema>;

export const productForm = form(productSchema, async (data) => {
	switch (data.type) {
		case "physical":
			return {
				success: true,
				message: `Physical: ${data.name} ($${data.price}) - ${data.weight}kg, ${data.dimensions}`,
			};
		case "digital":
			return {
				success: true,
				message: `Digital: ${data.name} ($${data.price}) - ${data.fileSize} download`,
			};
		case "subscription":
			return {
				success: true,
				message: `Subscription: ${data.name} ($${data.price}/${data.billingCycle}) - ${data.trialDays} day trial`,
			};
	}
});
