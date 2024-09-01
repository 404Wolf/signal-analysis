/* the agi */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { Message } from "./Message";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

/**
 * @param {Message} message
 * @returns {Promise<string>}
 */
export const isAProject = async (message: Message) => {
  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You are a machine who determines whether people are talking about projects are not. You ONLY SAY "YES" or "NO".',
      },
      {
        role: "user",
        content: `Are we talking about a project? "YES" OR "NO" ${message.body}`,
      },
    ],
    model: "gpt-4o-mini",
  });

  return chatCompletion.choices[0].message.content
    ?.toLowerCase()
    .trim()
    .includes("yes");
};

