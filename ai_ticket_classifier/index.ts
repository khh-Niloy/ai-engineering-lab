const readline = require("readline");
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const TicketSchema = z.object({
  category: z.enum([
    "PAYMENT",
    "ACCOUNT",
    "TECHNICAL",
    "SHIPPING",
    "REFUND",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reason: z.string(),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ai = async (prompt: string) => {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const primaryModel = "gemini-2.5-flash";
  const fallbackModel = "gemini-2.0-flash";
  const geminiMaxRetries = 3;

  for (let attempt = 1; attempt <= geminiMaxRetries; attempt += 1) {
    try {
      let currentModel = primaryModel;
      if (attempt === 2) currentModel = fallbackModel;

      const result = await client.models.generateContent({
        model: currentModel,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            required: ["category", "priority", "reason"],
            properties: {
              category: { type: "string" },
              priority: { type: "string" },
              reason: { type: "string" },
            },
          },
          systemInstruction: `
    You are a customer support ticket classifier.

    Classify each ticket into exactly one category:
    - PAYMENT
    - ACCOUNT
    - TECHNICAL
    - SHIPPING
    - REFUND
    - OTHER

    Assign priority:
    - LOW
    - MEDIUM
    - HIGH

    Do not invent information.
    Return only valid JSON.
  `,
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });
      if (!result.text) {
        throw new Error("Gemini returned an empty analysis.");
      }

      const data = JSON.parse(result.text);
      const validatedData = TicketSchema.parse(data);
      return validatedData;
    } catch (error) {
      console.log(error);
      if (!isRetryPossible(error) || attempt === geminiMaxRetries) {
        console.log("Retry not possible");
        break;
      }
      await delay(attempt);
    }
  }
};

const isRetryPossible = (error: unknown): boolean => {
  const err = error as { status?: unknown; name?: unknown };
  const statusCode = err.status as number;
  return (
    statusCode === 429 ||
    (statusCode >= 500 && statusCode <= 599) ||
    err?.name === "AbortError" ||
    err?.name === "TimeoutError" ||
    err?.name === "ZodError" ||
    err?.name === "SyntaxError"
  );
};

const delay = async (attempt: number) => {
  const delayMs = 250 * 2 ** attempt + Math.floor(Math.random() * 100);
  console.log(`Waiting ${delayMs}ms before retry...`);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
};

rl.question("write a issue here: ", async (issue: string) => {
  const data = await ai(issue);
  console.log(data);
  rl.close();
});
