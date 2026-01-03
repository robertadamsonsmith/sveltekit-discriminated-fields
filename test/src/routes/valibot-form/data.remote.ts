import * as v from "valibot";
import { form } from "$app/server";

// Discriminated union schema for payment methods
const paymentSchema = v.variant(
	"method",
	[
		v.object({
			method: v.literal("card"),
			cardNumber: v.pipe(
				v.string("Card number is required"),
				v.minLength(16, "Card number must be 16 digits")
			),
			cvv: v.pipe(
				v.string("CVV is required"),
				v.minLength(3, "CVV must be 3 digits")
			),
		}),
		v.object({
			method: v.literal("bank"),
			accountNumber: v.pipe(
				v.string("Account number is required"),
				v.minLength(8, "Account number must be at least 8 characters")
			),
			sortCode: v.pipe(
				v.string("Sort code is required"),
				v.minLength(6, "Sort code must be 6 digits")
			),
		}),
		v.object({
			method: v.literal("cash"),
		}),
	],
	"Please select a payment method"
);

export type PaymentData = v.InferOutput<typeof paymentSchema>;

export const paymentForm = form(paymentSchema, async (data) => {
	// Return success with the submitted data
	let description: string;

	switch (data.method) {
		case "card":
			description = `Card ending in ${data.cardNumber.slice(-4)}`;
			break;
		case "bank":
			description = `Bank account ${data.accountNumber}`;
			break;
		case "cash":
			description = "Cash payment";
			break;
	}

	return { success: true, message: `Success: ${description}` };
});
