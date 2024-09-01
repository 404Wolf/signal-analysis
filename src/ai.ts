/* the agi */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { formatRoll, rollMessages, type Message } from "./Message";

export interface ProjectIdea {
  name: string;
  TLDR: string;
}

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
export const isAProject = async function (body: string): Promise<boolean> {
  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You are a machine who determines whether people are talking about projects are not. You ONLY SAY "YES" or "NO".',
      },
      {
        role: "user",
        content: `Are we talking about a project? "YES" OR "NO" ${body}`,
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
export const tldrOfProject = async (body: string): Promise<string> => {
  const chatCompletion = await anthropicClient.messages.create({
    max_tokens: 20,
    model: "claude-3-opus-20240229",
    messages: [
      {
        role: "user",
        content: `SHORT TLDR for "we should make a home manager standalone utility". ONLY REFERENCE THE PROJECT IDEA ITSELF. BE SUPER PITHY. TLDR. NO ADJECTIVES.`,
      },
      { role: "assistant", content: "Home manager standalone utility" },
      { role: "user", content: `TLDR for ${body}` },
    ],
  });

  return (chatCompletion.content[0] as any).text;
};

export const whoseProjectIdea = async (message: string) => {
  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          'You are a machine who determines whose idea a project is. You ONLY say the name of the person. So say like, "JOE SHMOE"',
      },
      {
        role: "user",
        content: "JOE SHMOE: We should do hyprland but in rust",
      },
      {
        role: "assistant",
        content: "JOE SHMOE",
      },
      {
        role: "user",
        content: `Whose idea is this project? ${message}`,
      },
    ],
    model: "gpt-4o-mini",
  });

  return chatCompletion.choices[0].message.content!;
};

// takes a list of tldr strings, and returns a list of indeces of those that are unique
export const getUniqueProjects = async (tldrs: string[]) => {
  let cleanedUpString = tldrs.map(
    (tldr: string, index: number) => `${index}: ${tldr}`,
  );
  const chatCompletion = await openAiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a machine who determines which project idea is unique. GIVE A COMMA SEPERATED LIST OF UNIQUE NEWLINE SEPERATED PROJECTS.",
      },
      {
        role: "user",
        content: `Which project idea is unique? ${cleanedUpString.join("\n")}`,
      },
    ],
    model: "gpt-4o-mini",
  });
  return chatCompletion.choices[0].message
    .content!.split(",")
    .map((option) => option.match(/\d+/)![0]!);
};

export const processRoll = async (messages: Message[]) => {
  messages = messages.slice(-50);
  const processedRoll = await rollMessages(messages);
  const formattedRoll = await Promise.all(
    processedRoll.map((r) => formatRoll(r, false)),
  );
  const formattedRollNamed = await Promise.all(
    processedRoll.map((r) => formatRoll(r, true)),
  );
  const isProject = await Promise.all(
    formattedRoll.map(
      async (
        a,
        i,
      ): Promise<{ unnamed: string; named: string; isProject: boolean }> => ({
        unnamed: a,
        named: formattedRollNamed[i],
        isProject: await isAProject(a),
      }),
    ),
  );

  const projectIdeas = await Promise.all(
    isProject
      .filter((r) => r.isProject)
      .map(
        async (r): Promise<ProjectIdea> => ({
          TLDR: await tldrOfProject(r.unnamed),
          name: await whoseProjectIdea(r.named),
        }),
      ),
  );

  return projectIdeas;
};
