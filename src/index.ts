import Anthropic from "@anthropic-ai/sdk";
import { Database } from "bun:sqlite";

const client = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

async function main() {
  const db = new Database("./database.sqlite");
  const query =
    db.query(`SELECT r2.profile_joined_name,message.body FROM recipient RIGHT JOIN thread RIGHT JOIN message RIGHT JOIN recipient AS r2 WHERE lower(recipient.profile_joined_name) REGEXP ".*wol.*" AND recipient._id==thread.recipient_id AND thread._id==message.thread_id AND message.from_recipient_id==r2._id AND message.body!="";
`);
  query.get();
  
  // const message = await client.messages.create({
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: "Hello, Claude" }],
  //   model: "claude-3-opus-20240229",
  // });
  //
  // console.log(message.content);
}

main();
