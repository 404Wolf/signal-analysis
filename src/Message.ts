import { Database } from "bun:sqlite";

interface inMessage {
    profile_joined_name: string;
    body: string;
}

export interface Message {
    name: string;
    body: string;
}

/**
 * Gets the messages for a recipient by name from the SQLite database.
 * @param name Recipient's name in the database.
 * @param fp The file path to the SQLite database.
 * @returns The messages for the recipient.
 */
export const getMessages = async (name: string, fp = "./output/database.sqlite") => {
    const db = new Database(fp);
    const query = db.query(
      `SELECT r2.profile_joined_name,message.body FROM recipient RIGHT JOIN thread RIGHT JOIN message RIGHT JOIN recipient AS r2 WHERE lower(recipient.profile_joined_name) LIKE "%${name}%" AND recipient._id==thread.recipient_id AND thread._id==message.thread_id AND message.from_recipient_id==r2._id AND message.body!="";`,
    );
    return (query.all() as inMessage[]).map((m: inMessage) => ({name: m.profile_joined_name, body: m.body } as Message));
};

export const rollMessages = async (messages: Message[], windowSize = 5) => {
    return messages.reduce((acc: Message[][], m) => {
        acc.slice(acc.length - windowSize + 1).forEach(a => a.push(m))
        acc.push([m])
        return acc
    }, Array(windowSize - 1).fill([]) as Message[][])
}

export const formatRoll = async (messages: Message[]) => {
    let names = messages.map(m => m.name).filter((v, i, s) => s.indexOf(v) === i)
    return messages.map(m => `${names.indexOf(m.name)}: ${m.body}`).join('; ')
}