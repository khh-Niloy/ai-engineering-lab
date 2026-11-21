const readline = require("readline");
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { systemPrompt } from "./helper/system.prompt";
import { TicketSchema } from "./helper/schema";
import { responseManager } from "./helper/response.management";
import { delay, isRetryPossible } from "./helper/utils";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const primaryModel = "gemini-2.5-flash";
const fallbackModel = "gemini-2.0-flash";
const geminiMaxRetries = 3;

const ai = async (prompt: string) => {
  // ==========================================
  let modelUsed = primaryModel;
  let usedFallback = false;
  const startTime = performance.now();
  const requestId = randomUUID();
  // ==========================================

  for (let attempt = 1; attempt <= geminiMaxRetries; attempt += 1) {
    try {
      let currentModel = primaryModel;
      if (attempt === geminiMaxRetries - 1) {
        currentModel = fallbackModel;
        modelUsed = fallbackModel;
        usedFallback = true;
      }

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
          maxOutputTokens: 120,
          systemInstruction: systemPrompt,
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

      // console.log(result);

      const finishReason = result.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw new Error("LLM_OUTPUT_LIMIT_EXCEEDED");
      }

      const usage = result.usageMetadata;

      responseManager.successResponse({
        requestId,
        modelUsed,
        startTime,
        usage,
        usedFallback,
        finishReason,
      });

      const data = JSON.parse(result.text);
      const validatedData = TicketSchema.parse(data);
      return validatedData;
    } catch (error) {
      responseManager.errorResponse({
        requestId,
        modelUsed,
        startTime,
        usedFallback,
        error,
      });
      if (!isRetryPossible(error) || attempt === geminiMaxRetries) {
        console.log("Retry not possible");
        break;
      }
      await delay(attempt);
    }
  }
};

rl.question("write a issue here: ", async (issue: string) => {
  const data = await ai(issue);
  console.log(data);
  rl.close();
});

//
// parts: [
//   { text: "Describe this image" },
//   {
//     inlineData: {
//       mimeType: "image/jpeg",
//       data: imageBase64
//     }
//   }
// ]
