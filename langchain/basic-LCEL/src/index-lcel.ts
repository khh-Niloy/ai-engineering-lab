import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";

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

  // Connect components
  const chain = prompt.pipe(model).pipe(parser);

  // Execute entire pipeline
  const result = await chain.invoke({
    topic: "RAG",
  });

  console.log(result);
}

main();

// Internally LangChain এমন করে:
// const a = await prompt.invoke(input);
// const b = await model.invoke(a);
// const c = await parser.invoke(b);
