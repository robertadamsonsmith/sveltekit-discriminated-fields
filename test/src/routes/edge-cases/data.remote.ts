import { z } from "zod";
import { form } from "$app/server";

// Discriminated union schema for testing edge cases
const edgeCaseSchema = z.discriminatedUnion("variant", [
	z.object({
		variant: z.literal("alpha"),
		alphaField: z.string().min(1, "Alpha field is required"),
	}),
	z.object({
		variant: z.literal("beta"),
		betaField: z.string().min(1, "Beta field is required"),
	}),
	z.object({
		variant: z.literal("gamma"),
		gammaField: z.string().min(1, "Gamma field is required"),
	}),
], { errorMap: () => ({ message: "Please select a variant" }) });

export type EdgeCaseData = z.infer<typeof edgeCaseSchema>;

export const edgeCaseForm = form(edgeCaseSchema, async (data) => {
	let description: string;

	switch (data.variant) {
		case "alpha":
			description = `Alpha: ${data.alphaField}`;
			break;
		case "beta":
			description = `Beta: ${data.betaField}`;
			break;
		case "gamma":
			description = `Gamma: ${data.gammaField}`;
			break;
	}

	return { success: true, message: `Success: ${description}` };
});
