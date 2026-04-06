import { KEventHandle } from "../lib/KClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

// --- cooldown ---
const COOLDOWN_MS = 10 * 60 * 1000;

async function detectAdminLLM(text: string): Promise<number> {
  const prompt = `
You are a classifier.

Task: Determine if the message is asking for admin role in a discord server.

Return either 0 or 1 ONLY where 1 means the message is asking for admin role and 0 means it is not.

this user is speaking casually and may use slang. Here are some examples of messages and their scores:
they may also use some other language (mainly tamil) in english letters, so be mindful of that as well. But if the message is not asking for admin role, even if it contains the word "admin", it should be scored 0.

Examples of them asking admin:
please give me admin
admin pls
pls admin
admin me
give me admin
admin kudu please
admin kudu da
amdmin kudra
admin please daddy
daddy please admin
admin venum
admin tha

it is also possible for user to ask indirectly so be mindful.

note u only need to detect if the user is asking for admin role himself no need to check if he is asking for someone else.

Message: "${text}"
Answer:
`;

  const result = await model.generateContent(prompt);
  const score = +result.response.text();

  return score;
}

export default {
  name: "messageCreate",
  async execute(client, msg) {
    if (!msg.content || msg.author.bot) return;

    const userId = msg.author.id;
    const now = Date.now();

    const last = client.lastAdminRequestedAt.get(userId);
    if (last && now - last < COOLDOWN_MS) return;

    const score = await detectAdminLLM(msg.content);

    if (score) {
      // check if user has the admin role
      const member = await msg.guild?.members.fetch(userId);
      const adminRole = msg.guild?.roles.cache.find(
        (r) => r.id == "1417132029857890386",
      );

      if (member?.roles.cache.has(adminRole!.id)) {
        msg.reply("You already have the admin role faggot");
        return;
      } else {
        msg.reply("i gave u admin, i cant give it to u again for next 10 mins");
        member?.roles.add(adminRole!);
        client.lastAdminRequestedAt.set(userId, now);
      }

      // msg.reply("⚠️ Please do not request admin roles.");
    }
  },
} as KEventHandle<"messageCreate">;
