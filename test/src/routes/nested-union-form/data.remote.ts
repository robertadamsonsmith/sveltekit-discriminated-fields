import { z } from "zod";
import { form } from "$app/server";

// A discriminated union nested inside another discriminated union
// Outer: notification type (alert vs message)
// Inner (within alert): severity (warning vs error)
const notificationSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("alert"),
		// Inner discriminated union
		severity: z.discriminatedUnion("level", [
			z.object({ level: z.literal("warning"), dismissible: z.coerce.boolean() }),
			z.object({ level: z.literal("error"), errorCode: z.string().min(1, "Error code is required") }),
		]),
	}),
	z.object({
		type: z.literal("message"),
		content: z.string().min(1, "Content is required"),
	}),
]);

export const notificationForm = form(notificationSchema, async (data) => {
	if (data.type === "message") {
		return { success: true, message: `Message: "${data.content}"` };
	}
	if (data.severity.level === "warning") {
		return {
			success: true,
			message: `Alert (warning): dismissible=${data.severity.dismissible}`,
		};
	}
	return {
		success: true,
		message: `Alert (error): code=${data.severity.errorCode}`,
	};
});
