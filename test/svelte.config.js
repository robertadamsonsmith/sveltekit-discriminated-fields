import adapter from "@sveltejs/adapter-auto";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		experimental: {
			remoteFunctions: true,
		},
		alias: {
			// Force vite types to resolve from this project's node_modules
			// Prevents conflict with linked library's vite installation
			vite: path.resolve(__dirname, "node_modules/vite"),
		},
	},
};

export default config;
