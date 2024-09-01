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
export const isAProject = async function (message: Message) {
  const chatCompletion = await openAiClient.chat.completions.create({
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

/**
 * Give a TLDR of a given project message.
 * @param {Message} message
 * @returns {Promise<string>}
 */
export const tldrOfProject = async (message: Message) => {
  const chatCompletion = await anthropicClient.messages.create({
    max_tokens: 20,
    model: "claude-3-opus-20240229",
    messages: [
      {
        role: "user",
        content: `TLDR for "we should make a home manager standalone utility"`,
      },
      { role: "assistant", content: "Home manager standalone utility" },
      { role: "user", content: `TLDR for ${message.body}` },
    ],
  });

  return chatCompletion.content;
};

const possibleProjectId = {
  profile_joined_name: "Wolf Mermelstein",
  body: "we should make pypi OS",
};

const itIsAProject = await isAProject(possibleProjectId);

if (itIsAProject) {
  const tldr = await tldrOfProject(possibleProjectId);
  console.log(tldr);
}

