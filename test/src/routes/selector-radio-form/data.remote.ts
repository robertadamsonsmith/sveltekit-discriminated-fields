import { z } from "zod";
import { form } from "$app/server";

const shippingSchema = z.discriminatedUnion("speed", [
	z.object({
		speed: z.literal("standard"),
		estimatedDays: z.string(),
	}),
	z.object({
		speed: z.literal("express"),
		trackingId: z.string(),
	}),
]);

export type ShippingData = z.infer<typeof shippingSchema>;

export const shippingForm = form(shippingSchema, async (data) => {
	switch (data.speed) {
		case "standard":
			return { success: true, message: `Standard shipping: ${data.estimatedDays} days` };
		case "express":
			return { success: true, message: `Express shipping with tracking: ${data.trackingId}` };
	}
});
