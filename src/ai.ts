/* the agi */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { Message } from "./Message";

const openAiClient = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const anthropicClient = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

/**
 * @param {Message} message
 * @returns {Promise<boolean>}
 */
export const isAProject = async function (
  messages: Message[],
): Promise<boolean> {
  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You are a machine who determines whether people are talking about projects are not. You ONLY SAY "YES" or "NO".',
      },
      {
        role: "user",
        content: `Are we talking about a project? "YES" OR "NO" ${messages.map((message) => message.body).join("\n")}`,
      },
    ],
    model: "gpt-4o-mini",
  });

  return (
    chatCompletion.choices[0].message.content
      ?.toLowerCase()
      .trim()
      .includes("yes") || false
  );
};

/**
 * Give a TLDR of a given project message.
 * @param {Message} message
 * @returns {Promise<string>}
 */
export const tldrOfProject = async (messages: Message[]): Promise<string> => {
  const chatCompletion = await anthropicClient.messages.create({
    max_tokens: 20,
    model: "claude-3-opus-20240229",
    messages: [
      {
        role: "user",
        content: `SHORT TLDR for "we should make a home manager standalone utility". ONLY REFERENCE THE PROJECT IDEA ITSELF. BE SUPER PITHY. TLDR. NO ADJECTIVES.`,
      },
      { role: "assistant", content: "Home manager standalone utility" },
      {
        role: "user",
        content: `TLDR for ${messages.map((message) => message.body).join("\n")}. NO ADJECTIVES!`,
      },
    ],
  });

  return (chatCompletion.content[0] as any).text;
};

export const whoseProjectIdea = async (projectIdea: Message[]) => {
  let formattedProjectConversation = projectIdea
    .map(
      (projectIdea) => `${projectIdea.name.toUpperCase()}: ${projectIdea.body}`,
    )
    .join("\n");

  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You are a machine who determines whose idea a project is. You ONLY say the name of the person. So say like, "JOHN SMITH"',
      },
      {
        role: "user",
        content: `Whose idea is this project? ${formattedProjectConversation}`,
      },
    ],
    model: "gpt-4o-mini",
  });

  return chatCompletion.choices[0].message.content;
};
