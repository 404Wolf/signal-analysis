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
export const isAProject = async function (message: Message): Promise<boolean> {
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
export const tldrOfProject = async (message: Message): Promise<string> => {
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

  return (chatCompletion.content[0] as any).text;
};

const possibleProjectId = {
  name: "Wolf Mermelstein",
  body: "we should make pypi OS",
};

const itIsAProject = await isAProject(possibleProjectId);

if (itIsAProject) {
  const tldr = await tldrOfProject(possibleProjectId);
  console.log(tldr);
}

export const whoseProjectIdea = async (projectIdea: Message[]) => {
  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You figure out whose idea is whose. You are told\n"NAME=JOHN SMITH" and\n"PROJECT=WE SHOULD MAKE A HOME MANAGER STANDALONE UTILITY".\nYou ONLY SAY the NAME of the person whose idea it is.',
      },
      {
        role: "user",
        content:
          "NAME='WOLF MERMELSTEIN';PROJECT='We should do hyprland but in rust",
      },
      {
        role: "assistant",
        content: "Wolf Mermelstein",
      },
      {
        role: "user",
        content: `Whose idea is this? NAME OR PROJECT\nNAME='${possibleProjectId.name.toUpperCase()}';PROJECT='${possibleProjectId.body}'`,
      },
    ],
    model: "gpt-4o-mini",
  });

  return chatCompletion.choices[0].message.content;
};

