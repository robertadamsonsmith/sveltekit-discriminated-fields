import { z } from "zod";
import { form } from "$app/server";

const contactSchema = z.discriminatedUnion("method", [
	z.object({
		method: z.literal("email"),
		emailAddress: z.string().email(),
	}),
	z.object({
		method: z.literal("phone"),
		phoneNumber: z.string().min(10),
	}),
]);

export type ContactData = z.infer<typeof contactSchema>;

export const contactForm = form(contactSchema, async (data) => {
	switch (data.method) {
		case "email":
			return { success: true, message: `Contact via email: ${data.emailAddress}` };
		case "phone":
			return { success: true, message: `Contact via phone: ${data.phoneNumber}` };
	}
});
