/* the agi */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { formatRoll, rollMessages, type Message } from "./Message";

export interface ProjectIdea {
    name: string;
    TLDR: string;
    temp: string;
}

interface PossibleProject {
    unnamed: string;
    named: string;
    isProject: boolean;
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
        content: `Are we talking about our own project idea that is well defined? "YES" OR "NO" 0: Hey we should rewrite Hyprland in Rust; 1: Thats a cool idea!; 0: Yeah I agree`,
      },
      {
        role: "assistant",
        content: "YES",
      },
      {
        role: "user",
        content: `Are we talking about our own project idea that is well defined? "YES" OR "NO" 0: i'l be here till 330 probably if you free up; 1: I can help you work on that; 1: https://github.com/Maroka-chan/VPN-Confinement; 0: Cool`,
      },
      {
        role: "assistant",
        content: "NO",
      },
      {
        role: "user",
        content: `Are we talking about our own project idea that is well defined? "YES" OR "NO" ${body}`,
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
  const chatCompletion = await openAiClient.chat.completions.create({
    max_tokens: 20,
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `SHORT TLDR for "we should make a home manager standalone utility". ONLY REFERENCE THE PROJECT IDEA ITSELF. BE SUPER PITHY. TLDR. NO ADJECTIVES.`,
      },
      { role: "assistant", content: "Home manager standalone utility" },
      { role: "user", content: `TLDR for ${body}` },
    ],
  });

  return chatCompletion.choices[0].message.content!;
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
            "You are a machine who determines which project idea is unique. GIVE A COMMA SEPERATED LIST OF THE INDICES OF UNIQUE NEWLINE SEPERATED PROJECTS.",
        },
        {
          role: "user",
          content: `Which project ideas are unique? ${cleanedUpString.join("\n")}`,
        },
      ],
      model: "gpt-4o-mini",
    });
    return chatCompletion.choices[0].message
      .content!.split(",")
      .map((option) => option.match(/\d*/)![0]!)
      .map(i => parseInt(i))
      .filter(i => !isNaN(i));
  };

export const processRoll = async (messages: Message[], rollSize: number) => {
    messages = messages.slice(0, 1000)
    const processedRoll = await rollMessages(messages, rollSize);
    const formattedRoll = await Promise.all(processedRoll.map(r => formatRoll(r, false)));
    const formattedRollNamed = await Promise.all(processedRoll.map(r => formatRoll(r, true)));
    const isProject = (await Promise.all(formattedRoll
            .map(async (a, i) => ({unnamed: a, named: formattedRollNamed[i], isProject: await isAProject(a)}))
    ))

    const projectIdeas = (await Promise.all(isProject
            .reduce((acc, r) => {
                if (r.isProject) acc[acc.length - 1].push(r)
                else if (acc[acc.length - 1].length !== 0) acc.push([])
                return acc
            }, [[]] as PossibleProject[][])
            .map(async groupProjects => 
                await Promise.all(groupProjects.map(async (possibleDupProj) => 
                    ({
                        TLDR: await tldrOfProject(possibleDupProj.unnamed),
                        name: await whoseProjectIdea(possibleDupProj.named),
                        temp: possibleDupProj.named
                    })
                ))
            )
            .map(async chunks => await Promise.all(
                (await getUniqueProjects(
                    (await chunks)
                    .map(r => r.TLDR)))
                    .map(async i => (await chunks)[i])
                )
            )
    )).flat();

  return projectIdeas;
};
