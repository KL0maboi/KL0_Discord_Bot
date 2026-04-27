import { MessageFlagsBitField } from "discord.js";
import { KEventHandle } from "../lib/KClient";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  name: "messageCreate",
  async execute(client, msg) {
    if (msg.author.bot || !msg.content) return;

    const content = msg.content.toLowerCase();

    const res = (await client.mistral.beta.conversations.start({
      agentId: process.env.AGENT_ID!,
      agentVersion: 2,
      inputs: [{ role: "user", content }],
    })) as any;

    const result = JSON.parse(res.outputs[0].content).isAsking as boolean;

    if (!result) return;

    const userId = msg.author.id;
    const now = Date.now();

    const lastRequested = client.lastAdminRequestedAt.get(userId) || 0;
    if (lastRequested && now - lastRequested < COOLDOWN_MS)
      return msg.reply({
        content: `you are in cooldown, please wait ${Math.floor((lastRequested + COOLDOWN_MS - now) / 1000)}s before asking again`,
        // @ts-ignore
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

    const member = await msg.guild?.members.fetch(userId);
    const role = msg.guild?.roles.cache.get("1417132029857890386");
    if (!role)
      return msg.reply("someone has apparently deleted the admin role...");
    if (!member) return msg.reply("you dont exist apparently...");
    if (member.roles.cache.has("1417132029857890386"))
      return msg.reply("you already have the admin role faggot");

    await member.roles.add(role);

    msg.reply({
      content:
        "i have given you admin, i cannot give again for next 10 mins so be wary",
    });

    client.lastAdminRequestedAt.set(userId, now);

    console.log(`[ADMIN REQUEST DETECTED] ${msg.author.tag}: ${msg.content}`);
  },
} as KEventHandle<"messageCreate">;
