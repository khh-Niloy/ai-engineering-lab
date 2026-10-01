const readline = require("readline");
import { GoogleGenAI } from "@google/genai";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ai = async (prompt: string) => {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const model = "gemini-2.5-flash";

  const result = await client.models.generateContent({
    model,
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

  return data;
};

rl.question("write a issue here: ", async (issue: string) => {
  const data = await ai(issue);
  console.log(data);
  rl.close();
});
