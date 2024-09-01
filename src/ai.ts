/* the agi */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env["ANTHROPIC_API_KEY"],
});

const msg = await client.messages.create({
  model: "claude-3-5-sonnet-20240620",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
});

console.log(msg);