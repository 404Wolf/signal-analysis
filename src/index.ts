import Anthropic from "@anthropic-ai/sdk";
import { Database } from "bun:sqlite";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

const client = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

/**
 * Gets the messages for a recipient by name from the SQLite database.
 * @param name Recipient's name in the database.
 * @param fp The file path to the SQLite database.
 * @returns The messages for the recipient.
 */
const getMessages = async (name: string, fp = "./output/database.sqlite") => {
  const db = new Database(fp);
  const query =
    db.query(`SELECT r2.profile_joined_name,message.body FROM recipient RIGHT JOIN thread RIGHT JOIN message RIGHT JOIN recipient AS r2 WHERE lower(recipient.profile_joined_name) LIKE "%${name}%" AND recipient._id==thread.recipient_id AND thread._id==message.thread_id AND message.from_recipient_id==r2._id AND message.body!="";`);
  return query.all();
}

const argv = yargs(hideBin(process.argv))
  .command('list-messages [name]', "List messages by recipient name", (yargs) => {
    return yargs.positional("name", {
      description: "Recipient name to filter messages by",
      type: "string",
    })
  }, async (argv) => {
    const { name } = argv;
    console.log(`Listing messages for recipient "${name}"`);
    if (name === undefined) {
      console.error("Recipient name is required");
      process.exit(1);
    }
    (await getMessages(name)).forEach((el: any) => console.log(`${el.profile_joined_name}: ${el.body}`));
  })
  .parse();
