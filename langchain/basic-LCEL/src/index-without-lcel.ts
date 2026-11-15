import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function main() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    ["human", "Explain {topic}"],
  ]);
  // return ChatPromptTemplate object

  const parser = new StringOutputParser();
  // Without parser: You get an AIMessage object.
  // With parser: You get the actual text as a string.

  // A. Prompt execute
  const messages = await prompt.invoke({
    topic: "RAG",
  });

  // B. Model execute
  const aiResponse = await model.invoke(messages);

  // C. Parser execute
  const result = await parser.invoke(aiResponse);

  console.log("result", result);
}

main();
