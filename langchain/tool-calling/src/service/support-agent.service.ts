import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createOrderTools } from "../tools/order.tool";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

export async function runSupportAgent(customerId: string, userMessage: string) {
  // Create tools for this authenticated customer
  const tools = createOrderTools(customerId);
  //   console.log("=======");
  //   console.log("tools", tools);
  //   console.log("=======");

  // Make tools available to Gemini
  const modelWithTools = model.bindTools(tools);
  //   console.log("=======");
  //   console.log("modelWithTools", modelWithTools);
  //   console.log("=======");

  // Map tool names to actual executable tools
  const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));
  //   console.log("=======");
  //   console.log("toolsByName", toolsByName);
  //   console.log("=======");

  const prompt: BaseMessage[] = [
    new SystemMessage(`
      You are a helpful ecommerce customer support assistant.

      You can answer questions about customer orders
      using the available tools.

      Rules:
      - Use tools when order information is required.
      - Never invent order information.
      - Only discuss data returned by the tools.
      - Explain the result clearly to the customer.
    `),

    new HumanMessage(userMessage),
  ];

  for (let step = 0; step < 5; step++) {
    // Ask Gemini what to do next
    const aiMessage = await modelWithTools.invoke(prompt);
    // console.log("=======");
    // console.log("aiMessage", aiMessage);
    // console.log("=======");

    // Save AI response in conversation history
    prompt.push(aiMessage);
    // console.log("=======");
    // console.log("prompt", prompt);
    // console.log("=======");

    // If no tool call, AI has produced final response
    if (!aiMessage.tool_calls?.length) {
      return aiMessage.content;
    }

    for (const toolCall of aiMessage.tool_calls) {
      const selectedTool = toolsByName[toolCall.name];
      //   console.log("=======");
      //   console.log("selectedTool", selectedTool);
      //   console.log("=======");

      if (!selectedTool) {
        throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      if (!toolCall.id) {
        throw new Error("Tool call ID is missing");
      }

      // Execute the actual TypeScript function
      const toolResult = await selectedTool.invoke(toolCall.args);
      //   console.log("=======");
      //   console.log("toolResult", toolResult);
      //   console.log("=======");

      // Send tool result back to conversation
      prompt.push(
        new ToolMessage({
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id,
        }),
      );
      //   console.log("=======");
      //   console.log("prompt", prompt);
      //   console.log("=======");
    }

    // Loop continues:
    // Gemini receives tool results and decides what to do next.
  }

  throw new Error("Maximum tool calling steps exceeded");
}

// AUDIT
// =======
// tools [
//   DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'get_order_status',
//       description: 'Get the delivery status and tracking number of a specific customer order.',
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'get_order_status',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: 'Get the delivery status and tracking number of a specific customer order.',
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   },
//   DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'get_order_items',
//       description: 'Get the products, quantities and total amount of a specific order.',
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'get_order_items',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: 'Get the products, quantities and total amount of a specific order.',
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   },
//   DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'list_my_orders',
//       description: "List the logged-in customer's most recent orders.",
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'list_my_orders',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: "List the logged-in customer's most recent orders.",
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   }
// ]
// =======
// =======
// modelWithTools RunnableBinding {
//   lc_serializable: true,
//   lc_kwargs: {
//     bound: ChatGoogleGenerativeAI {
//       lc_serializable: true,
//       lc_kwargs: [Object],
//       lc_runnable: true,
//       name: undefined,
//       verbose: false,
//       callbacks: undefined,
//       tags: [],
//       metadata: [Object],
//       caller: [AsyncCaller],
//       cache: undefined,
//       _encoding: undefined,
//       lc_namespace: [Array],
//       disableStreaming: false,
//       outputVersion: 'v0',
//       model: 'gemini-2.5-flash',
//       temperature: 0,
//       maxOutputTokens: undefined,
//       topP: undefined,
//       topK: undefined,
//       stopSequences: [],
//       safetySettings: undefined,
//       apiKey: '',
//       baseUrl: undefined,
//       streaming: false,
//       json: undefined,
//       streamUsage: true,
//       convertSystemMessageToHumanContent: undefined,
//       thinkingConfig: undefined,
//       client: [GenerativeModel]
//     },
//     config: { tools: [Array] },
//     kwargs: {}
//   },
//   lc_runnable: true,
//   name: undefined,
//   lc_namespace: [ 'langchain_core', 'runnables' ],
//   bound: ChatGoogleGenerativeAI {
//     lc_serializable: true,
//     lc_kwargs: {
//       callbacks: undefined,
//       model: 'gemini-2.5-flash',
//       apiKey: '',
//       temperature: 0
//     },
//     lc_runnable: true,
//     name: undefined,
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     caller: AsyncCaller {
//       maxConcurrency: Infinity,
//       maxRetries: 6,
//       onFailedAttempt: [Function: defaultFailedAttemptHandler],
//       queue: [PQueue]
//     },
//     cache: undefined,
//     _encoding: undefined,
//     lc_namespace: [ 'langchain', 'chat_models', 'google_genai' ],
//     disableStreaming: false,
//     outputVersion: 'v0',
//     model: 'gemini-2.5-flash',
//     temperature: 0,
//     maxOutputTokens: undefined,
//     topP: undefined,
//     topK: undefined,
//     stopSequences: [],
//     safetySettings: undefined,
//     apiKey: '',
//     baseUrl: undefined,
//     streaming: false,
//     json: undefined,
//     streamUsage: true,
//     convertSystemMessageToHumanContent: undefined,
//     thinkingConfig: undefined,
//     client: GenerativeModel {
//       apiKey: '',
//       _requestOptions: [Object],
//       model: 'models/gemini-2.5-flash',
//       generationConfig: [Object],
//       safetySettings: [],
//       tools: undefined,
//       toolConfig: undefined,
//       systemInstruction: undefined,
//       cachedContent: undefined
//     }
//   },
//   config: { tools: [ [Object] ] },
//   kwargs: {},
//   configFactories: undefined
// }
// =======
// =======
// toolsByName {
//   get_order_status: DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'get_order_status',
//       description: 'Get the delivery status and tracking number of a specific customer order.',
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'get_order_status',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: 'Get the delivery status and tracking number of a specific customer order.',
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   },
//   get_order_items: DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'get_order_items',
//       description: 'Get the products, quantities and total amount of a specific order.',
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'get_order_items',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: 'Get the products, quantities and total amount of a specific order.',
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   },
//   list_my_orders: DynamicStructuredTool {
//     lc_serializable: false,
//     lc_kwargs: {
//       name: 'list_my_orders',
//       description: "List the logged-in customer's most recent orders.",
//       schema: [ZodObject],
//       func: [AsyncFunction: func]
//     },
//     lc_runnable: true,
//     name: 'list_my_orders',
//     verbose: false,
//     callbacks: undefined,
//     tags: [],
//     metadata: { versions: [Object] },
//     extras: undefined,
//     returnDirect: false,
//     verboseParsingErrors: false,
//     responseFormat: 'content',
//     defaultConfig: undefined,
//     description: "List the logged-in customer's most recent orders.",
//     func: [AsyncFunction: func],
//     schema: ZodObject { def: [Object], type: 'object' }
//   }
// }
// =======
// =======
// aiMessage AIMessage {
//   "content": [
//     {
//       "type": "functionCall",
//       "functionCall": {
//         "name": "get_order_status",
//         "args": "[Object]"
//       }
//     }
//   ],
//   "additional_kwargs": {
//     "finishReason": "STOP",
//     "index": 0,
//     "finishMessage": "Model generated function call(s).",
//     "__gemini_function_call_thought_signatures__": {
//       "fbfeabdb-a319-4840-8911-1b1ec15093bb": "CqgCAWkUfRP3DQK7b3h984q6gf0+V6lDWf34C9qC9ciBPGJ4gB1ky3hzrHwfi40LmFdZuoGcimyQ8rrgfc7weAWcmxgtheYiBQ301xhsBcD72fg0ev8LgsybvKPf7/btt6RvS10yTAWvRYukOMY6HwWk/iKHmTYTzJC1zy7rNFGMY1fCIO9EoutlkjJrFC6kMV5GqizegzzviYkpaRbY3ObEC74QVHwpPmA9X4AMCbYiFnoKnNCFtAd05+Oz36+mHQQ5eWjuumL94p99HlEgSxYnlxxsZf/lsO4H/64BHo+nHNpO+Y1f9nmvpWltklkkxe3pTqnwbsH8JpoqMEvppq7rdQVw04+BRS/WWi2oQ2KTWWcMwdFHUk0y2ymV0GQ8ExATPJCl04tdJjw="
//     }
//   },
//   "response_metadata": {
//     "tokenUsage": {
//       "promptTokens": 260,
//       "completionTokens": 41,
//       "totalTokens": 384
//     },
//     "finishReason": "STOP",
//     "index": 0,
//     "finishMessage": "Model generated function call(s)."
//   },
//   "tool_calls": [
//     {
//       "type": "tool_call",
//       "id": "fbfeabdb-a319-4840-8911-1b1ec15093bb",
//       "name": "get_order_status",
//       "args": {
//         "orderId": "673a12345678901234567890"
//       }
//     }
//   ],
//   "invalid_tool_calls": [],
//   "usage_metadata": {
//     "input_tokens": 260,
//     "output_tokens": 41,
//     "total_tokens": 384
//   }
// }
// =======
// =======
// prompt [
//   SystemMessage {
//     "content": "\n      You are a helpful ecommerce customer support assistant.\n\n      You can answer questions about customer orders\n      using the available tools.\n\n      Rules:\n      - Use tools when order information is required.\n      - Never invent order information.\n      - Only discuss data returned by the tools.\n      - Explain the result clearly to the customer.\n    ",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   HumanMessage {
//     "content": "What is the status of my order 673a12345678901234567890?",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   AIMessage {
//     "content": [
//       {
//         "type": "functionCall",
//         "functionCall": {
//           "name": "get_order_status",
//           "args": "[Object]"
//         }
//       }
//     ],
//     "additional_kwargs": {
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s).",
//       "__gemini_function_call_thought_signatures__": {
//         "fbfeabdb-a319-4840-8911-1b1ec15093bb": "CqgCAWkUfRP3DQK7b3h984q6gf0+V6lDWf34C9qC9ciBPGJ4gB1ky3hzrHwfi40LmFdZuoGcimyQ8rrgfc7weAWcmxgtheYiBQ301xhsBcD72fg0ev8LgsybvKPf7/btt6RvS10yTAWvRYukOMY6HwWk/iKHmTYTzJC1zy7rNFGMY1fCIO9EoutlkjJrFC6kMV5GqizegzzviYkpaRbY3ObEC74QVHwpPmA9X4AMCbYiFnoKnNCFtAd05+Oz36+mHQQ5eWjuumL94p99HlEgSxYnlxxsZf/lsO4H/64BHo+nHNpO+Y1f9nmvpWltklkkxe3pTqnwbsH8JpoqMEvppq7rdQVw04+BRS/WWi2oQ2KTWWcMwdFHUk0y2ymV0GQ8ExATPJCl04tdJjw="
//       }
//     },
//     "response_metadata": {
//       "tokenUsage": {
//         "promptTokens": 260,
//         "completionTokens": 41,
//         "totalTokens": 384
//       },
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s)."
//     },
//     "tool_calls": [
//       {
//         "type": "tool_call",
//         "id": "fbfeabdb-a319-4840-8911-1b1ec15093bb",
//         "name": "get_order_status",
//         "args": {
//           "orderId": "673a12345678901234567890"
//         }
//       }
//     ],
//     "invalid_tool_calls": [],
//     "usage_metadata": {
//       "input_tokens": 260,
//       "output_tokens": 41,
//       "total_tokens": 384
//     }
//   }
// ]
// =======
// =======
// selectedTool DynamicStructuredTool {
//   lc_serializable: false,
//   lc_kwargs: {
//     name: 'get_order_status',
//     description: 'Get the delivery status and tracking number of a specific customer order.',
//     schema: ZodObject { def: [Object], type: 'object' },
//     func: [AsyncFunction: func]
//   },
//   lc_runnable: true,
//   name: 'get_order_status',
//   verbose: false,
//   callbacks: undefined,
//   tags: [],
//   metadata: { versions: { '@langchain/core': '1.4.1' } },
//   extras: undefined,
//   returnDirect: false,
//   verboseParsingErrors: false,
//   responseFormat: 'content',
//   defaultConfig: undefined,
//   description: 'Get the delivery status and tracking number of a specific customer order.',
//   func: [AsyncFunction: func],
//   schema: ZodObject {
//     def: { type: 'object', shape: [Object] },
//     type: 'object'
//   }
// }
// =======
// =======
// toolResult {
//   status: 'SHIPPED',
//   trackingNumber: 'TRK-12345',
//   lastUpdated: 2026-11-14T05:33:39.238Z
// }
// =======
// =======
// prompt [
//   SystemMessage {
//     "content": "\n      You are a helpful ecommerce customer support assistant.\n\n      You can answer questions about customer orders\n      using the available tools.\n\n      Rules:\n      - Use tools when order information is required.\n      - Never invent order information.\n      - Only discuss data returned by the tools.\n      - Explain the result clearly to the customer.\n    ",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   HumanMessage {
//     "content": "What is the status of my order 673a12345678901234567890?",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   AIMessage {
//     "content": [
//       {
//         "type": "functionCall",
//         "functionCall": {
//           "name": "get_order_status",
//           "args": "[Object]"
//         }
//       }
//     ],
//     "additional_kwargs": {
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s).",
//       "__gemini_function_call_thought_signatures__": {
//         "fbfeabdb-a319-4840-8911-1b1ec15093bb": "CqgCAWkUfRP3DQK7b3h984q6gf0+V6lDWf34C9qC9ciBPGJ4gB1ky3hzrHwfi40LmFdZuoGcimyQ8rrgfc7weAWcmxgtheYiBQ301xhsBcD72fg0ev8LgsybvKPf7/btt6RvS10yTAWvRYukOMY6HwWk/iKHmTYTzJC1zy7rNFGMY1fCIO9EoutlkjJrFC6kMV5GqizegzzviYkpaRbY3ObEC74QVHwpPmA9X4AMCbYiFnoKnNCFtAd05+Oz36+mHQQ5eWjuumL94p99HlEgSxYnlxxsZf/lsO4H/64BHo+nHNpO+Y1f9nmvpWltklkkxe3pTqnwbsH8JpoqMEvppq7rdQVw04+BRS/WWi2oQ2KTWWcMwdFHUk0y2ymV0GQ8ExATPJCl04tdJjw="
//       }
//     },
//     "response_metadata": {
//       "tokenUsage": {
//         "promptTokens": 260,
//         "completionTokens": 41,
//         "totalTokens": 384
//       },
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s)."
//     },
//     "tool_calls": [
//       {
//         "type": "tool_call",
//         "id": "fbfeabdb-a319-4840-8911-1b1ec15093bb",
//         "name": "get_order_status",
//         "args": {
//           "orderId": "673a12345678901234567890"
//         }
//       }
//     ],
//     "invalid_tool_calls": [],
//     "usage_metadata": {
//       "input_tokens": 260,
//       "output_tokens": 41,
//       "total_tokens": 384
//     }
//   },
//   ToolMessage {
//     "content": "{\"status\":\"SHIPPED\",\"trackingNumber\":\"TRK-12345\",\"lastUpdated\":\"2026-11-14T05:33:39.238Z\"}",
//     "additional_kwargs": {},
//     "response_metadata": {},
//     "tool_call_id": "fbfeabdb-a319-4840-8911-1b1ec15093bb"
//   }
// ]
// =======
// =======
// aiMessage AIMessage {
//   "content": "Your order with ID 673a12345678901234567890 has been SHIPPED. The tracking number is TRK-12345, and it was last updated on 2026-11-14T05:33:39.238Z.",
//   "additional_kwargs": {
//     "finishReason": "STOP",
//     "index": 0,
//     "__gemini_function_call_thought_signatures__": {}
//   },
//   "response_metadata": {
//     "tokenUsage": {
//       "promptTokens": 365,
//       "completionTokens": 80,
//       "totalTokens": 445
//     },
//     "finishReason": "STOP",
//     "index": 0
//   },
//   "tool_calls": [],
//   "invalid_tool_calls": [],
//   "usage_metadata": {
//     "input_tokens": 365,
//     "output_tokens": 80,
//     "total_tokens": 445
//   }
// }
// =======
// =======
// prompt [
//   SystemMessage {
//     "content": "\n      You are a helpful ecommerce customer support assistant.\n\n      You can answer questions about customer orders\n      using the available tools.\n\n      Rules:\n      - Use tools when order information is required.\n      - Never invent order information.\n      - Only discuss data returned by the tools.\n      - Explain the result clearly to the customer.\n    ",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   HumanMessage {
//     "content": "What is the status of my order 673a12345678901234567890?",
//     "additional_kwargs": {},
//     "response_metadata": {}
//   },
//   AIMessage {
//     "content": [
//       {
//         "type": "functionCall",
//         "functionCall": {
//           "name": "get_order_status",
//           "args": "[Object]"
//         }
//       }
//     ],
//     "additional_kwargs": {
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s).",
//       "__gemini_function_call_thought_signatures__": {
//         "fbfeabdb-a319-4840-8911-1b1ec15093bb": "CqgCAWkUfRP3DQK7b3h984q6gf0+V6lDWf34C9qC9ciBPGJ4gB1ky3hzrHwfi40LmFdZuoGcimyQ8rrgfc7weAWcmxgtheYiBQ301xhsBcD72fg0ev8LgsybvKPf7/btt6RvS10yTAWvRYukOMY6HwWk/iKHmTYTzJC1zy7rNFGMY1fCIO9EoutlkjJrFC6kMV5GqizegzzviYkpaRbY3ObEC74QVHwpPmA9X4AMCbYiFnoKnNCFtAd05+Oz36+mHQQ5eWjuumL94p99HlEgSxYnlxxsZf/lsO4H/64BHo+nHNpO+Y1f9nmvpWltklkkxe3pTqnwbsH8JpoqMEvppq7rdQVw04+BRS/WWi2oQ2KTWWcMwdFHUk0y2ymV0GQ8ExATPJCl04tdJjw="
//       }
//     },
//     "response_metadata": {
//       "tokenUsage": {
//         "promptTokens": 260,
//         "completionTokens": 41,
//         "totalTokens": 384
//       },
//       "finishReason": "STOP",
//       "index": 0,
//       "finishMessage": "Model generated function call(s)."
//     },
//     "tool_calls": [
//       {
//         "type": "tool_call",
//         "id": "fbfeabdb-a319-4840-8911-1b1ec15093bb",
//         "name": "get_order_status",
//         "args": {
//           "orderId": "673a12345678901234567890"
//         }
//       }
//     ],
//     "invalid_tool_calls": [],
//     "usage_metadata": {
//       "input_tokens": 260,
//       "output_tokens": 41,
//       "total_tokens": 384
//     }
//   },
//   ToolMessage {
//     "content": "{\"status\":\"SHIPPED\",\"trackingNumber\":\"TRK-12345\",\"lastUpdated\":\"2026-11-14T05:33:39.238Z\"}",
//     "additional_kwargs": {},
//     "response_metadata": {},
//     "tool_call_id": "fbfeabdb-a319-4840-8911-1b1ec15093bb"
//   },
//   AIMessage {
//     "content": "Your order with ID 673a12345678901234567890 has been SHIPPED. The tracking number is TRK-12345, and it was last updated on 2026-11-14T05:33:39.238Z.",
//     "additional_kwargs": {
//       "finishReason": "STOP",
//       "index": 0,
//       "__gemini_function_call_thought_signatures__": {}
//     },
//     "response_metadata": {
//       "tokenUsage": {
//         "promptTokens": 365,
//         "completionTokens": 80,
//         "totalTokens": 445
//       },
//       "finishReason": "STOP",
//       "index": 0
//     },
//     "tool_calls": [],
//     "invalid_tool_calls": [],
//     "usage_metadata": {
//       "input_tokens": 365,
//       "output_tokens": 80,
//       "total_tokens": 445
//     }
//   }
// ]
// =======
