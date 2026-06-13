import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@/lib/env";

export const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
});

export const model = google("gemini-3-flash-preview");
