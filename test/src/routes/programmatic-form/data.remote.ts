import { z } from "zod";
import { form } from "$app/server";

// Schema with validation to test error display
const notificationSchema = z.discriminatedUnion("channel", [
	z.object({
		channel: z.literal("email"),
		email: z.string().email("Invalid email address"),
	}),
	z.object({
		channel: z.literal("sms"),
		phone: z.string().min(10, "Phone must be at least 10 digits"),
	}),
	z.object({
		channel: z.literal("push"),
		deviceId: z.string().min(1, "Device ID is required"),
	}),
]);

export type NotificationData = z.infer<typeof notificationSchema>;

export const notificationForm = form(notificationSchema, async (data) => {
	switch (data.channel) {
		case "email":
			return { success: true, message: `Email sent to ${data.email}` };
		case "sms":
			return { success: true, message: `SMS sent to ${data.phone}` };
		case "push":
			return { success: true, message: `Push sent to device ${data.deviceId}` };
	}
});
