import { z } from "zod";
import { form } from "$app/server";

// Discriminated union schema for shapes
const shapeSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("circle"),
		radius: z
			.number({ message: "Radius is required" })
			.min(1, "Radius must be at least 1"),
	}),
	z.object({
		kind: z.literal("rectangle"),
		width: z
			.number({ message: "Width is required" })
			.min(1, "Width must be at least 1"),
		height: z
			.number({ message: "Height is required" })
			.min(1, "Height must be at least 1"),
	}),
	z.object({
		kind: z.literal("point"),
		x: z.number({ message: "X coordinate is required" }),
		y: z.number({ message: "Y coordinate is required" }),
	}),
], { errorMap: () => ({ message: "Please select a shape type" }) });

export type ShapeData = z.infer<typeof shapeSchema>;

export const shapeForm = form(shapeSchema, async (data) => {
	// Return success with the submitted data
	let description: string;

	switch (data.kind) {
		case "circle":
			description = `Circle with radius ${data.radius}`;
			break;
		case "rectangle":
			description = `Rectangle ${data.width}x${data.height}`;
			break;
		case "point":
			description = `Point at (${data.x}, ${data.y})`;
			break;
	}

	return { success: true, message: `Success: ${description}` };
});
