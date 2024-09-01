import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { getMessages, rollMessages } from "./Message";

yargs(hideBin(process.argv))
  .command(
    "list-messages [name]",
    "List messages by recipient name",
    (yargs) => {
      return yargs.positional("name", {
        description: "Recipient name to filter messages by",
        type: "string",
      });
    },
    async (argv) => {
      const { name } = argv;
      console.log(`Listing messages for recipient "${name}"`);
      if (name === undefined) {
        console.error("Recipient name is required");
        process.exit(1);
      }
      const ret = (await getMessages(name))
        .map((el) => `${el.name}: ${el.body}`)
        .reduce((acc, curr) => acc + `${curr}\n`, "");
      console.log(ret);
    },
  )
  .command(
    "list-messages-roll [name]",
    "List messages by recipient name",
    (yargs) => {
      return yargs.positional("name", {
        description: "Recipient name to filter messages by",
        type: "string",
      });
    },
    async (argv) => {
      const { name } = argv;
      console.log(`Listing messages for recipient "${name}"`);
      if (name === undefined) {
        console.error("Recipient name is required");
        process.exit(1);
      }
      const ret = await rollMessages(await getMessages(name))
      console.log(ret);
      console.log(ret.length);
    },
  )
  .parse();
