import { streamChatResponse } from "./src/ai/chat.ts";
async function run() {
  const stream = streamChatResponse([{role: "user", content: "think about this"}], "deepseek", "deepseek-reasoner");
  for await (const part of stream) {
    if (part.type === "reasoning") {
      console.log("REASONING PART:", part);
      break;
    }
  }
}
run();
