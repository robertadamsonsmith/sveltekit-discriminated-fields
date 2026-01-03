import { z } from "zod";
import { form } from "$app/server";

// Simple schema to test radio button visibility
const prioritySchema = z.discriminatedUnion("level", [
	z.object({
		level: z.literal("high"),
		deadline: z.string().min(1, "Deadline is required for high priority"),
	}),
	z.object({
		level: z.literal("medium"),
		notes: z.string().optional(),
	}),
	z.object({
		level: z.literal("low"),
	}),
]);

export type PriorityData = z.infer<typeof prioritySchema>;

export const priorityForm = form(prioritySchema, async (data) => {
	let description: string;

	switch (data.level) {
		case "high":
			description = `High priority with deadline: ${data.deadline}`;
			break;
		case "medium":
			description = `Medium priority${data.notes ? ` (${data.notes})` : ""}`;
			break;
		case "low":
			description = "Low priority";
			break;
	}

	return { success: true, message: `Success: ${description}` };
});
