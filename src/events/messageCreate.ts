import {
  ChannelType,
  EmbedBuilder,
  Message,
  MessageFlags,
  OmitPartialGroupDMChannel,
  TextChannel,
} from "discord.js";
import KClient, { KEventHandle } from "../lib/KClient";
import { pipeline } from "@xenova/transformers";

export default {
  name: "messageCreate",
  async execute(client, msg) {
    // if (msg.author.id == "758136114199920660") msg.delete();

    handleAdminRequest(client, msg);

    if (process.env.DEVENV) return;
    if (msg.guildId !== process.env.GUILD_ID) return;

    const logGuild = await client.guilds.fetch(process.env.LOG_GUILD_ID!);

    logGuild.channels.fetch();

    const logChannels = logGuild.channels.cache;

    let logChannel = logChannels.find(
      (c) => c.name == (msg.channel as TextChannel).name,
    );

    if (!logChannel) {
      logChannel = await logGuild.channels.create({
        name: (msg.channel as TextChannel).name,
        type:
          msg.channel instanceof TextChannel
            ? ChannelType.GuildText
            : ChannelType.GuildVoice,
      });
    }

    if (logChannel.isSendable()) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: msg.author.tag,
          iconURL: msg.author.displayAvatarURL(),
        })
        .setDescription(msg.content || " ");

      logChannel.send({
        embeds: [embed, ...msg.embeds.map((e) => EmbedBuilder.from(e))],
        files: msg.attachments.map((a) => a.url),
        components: msg.components,
      });
    }
  },
} as KEventHandle<"messageCreate">;

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

async function handleAdminRequest(
  client: KClient,
  msg: OmitPartialGroupDMChannel<Message<boolean>>,
) {
  if (
    client.lastAdminRequestedAt.has(msg.author.id) &&
    client.lastAdminRequestedAt.get(msg.author.id)! - 600000 < Date.now()
  )
    return;

  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
  );

  const examples = [
    // English
    "i want admin",
    "i need admin",
    "can i get admin",
    "give me admin",
    "please give admin",
    "i would like admin",
    "may i have admin role",
    "can you give me admin",
    "pls give admin",
    "admin pls",
    "i deserve admin",
    "make me admin",
    "can you make me admin",
    "i should be admin",
    "i want admin access",
    "give admin role",
    "assign me admin",
    "grant me admin",
    "admin role please",
    "i need admin permissions",
    "can i be admin",
    "let me be admin",
    "make me an admin",
    "give me admin privileges",
    "please assign admin role",
    "can you upgrade me to admin",

    // Casual / Slang English
    "bro give admin",
    "admin bro pls",
    "admin da pls",
    "give admin bro",
    "pls admin bro",
    "yo give admin",
    "admin pls bro 😭",
    "bro i want admin",
    "make me admin bro",
    "admin pls 😭",
    "give me perms bro",
    "bro give perms",
    "need admin bro",
    "pls give perms",
    "admin plssss",
    "admin plz",
    "admin plsssss",
    "gimme admin",
    "gimme admin bro",
    "admin now pls",
    "admin fast bro",
    "quick admin pls",

    // Tamil (Romanized)
    "admin kudu",
    "admin kudra",
    "admin kudu bro",
    "admin kudu pls",
    "admin venum",
    "enaku admin venum",
    "admin kudu da",
    "admin kudu macha",
    "admin kudu pa",
    "admin kudunga",
    "admin tharunga",
    "admin venum bro",
    "admin venum da",
    "admin venum pls",
    "admin kudu please",
    "admin konjam kudunga",
    "admin tharalama",
    "admin kudunga bro pls",
    "admin venum machi",
    "admin kudu machi",
    "admin kudunga sir",
    "admin kudunga anna",

    // Tamil + English mix
    "admin kudu bro pls",
    "bro admin kudu",
    "admin venum bro pls",
    "give admin da",
    "admin kudu please bro",
    "bro admin venum",
    "pls admin kudu",
    "admin kudu bro 😭",
    "admin venum pls bro",
    "give admin macha",
    "admin kudunga bro",
    "admin venum da pls",
    "admin kudu anna pls",
    "admin kudra bro",
    "admin kudunga pls",
  ];

  const exampleEmbeddings: number[][] = [];
  for (const text of examples) {
    const output: any = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    exampleEmbeddings.push(output.data);
  }

  async function detect(text: string) {
    const output: any = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    const query = output.data;

    let maxScore = -1;

    for (const emb of exampleEmbeddings) {
      const score = cosineSimilarity(query, emb);
      if (score > maxScore) maxScore = score;
    }

    return maxScore;
  }

  // test
  const score = await detect(msg.content);
  console.log(score);

  if (score > 0.9) {
    // check if user has that role
    const guild = await client.guilds.fetch(process.env.GUILD_ID!);
    const member = await guild.members.fetch(msg.author.id);
    if (member.roles.cache.has("1417132029857890386"))
      return msg.reply({
        content: "You already have the admin role idiot",
      });
    else {
      await member.roles.add("1417132029857890386");
      client.lastAdminRequestedAt.set(msg.author.id, Date.now());
      return msg.reply({
        content:
          "Admin role has been given to you. (i cant give again for next 10 mins)",
      });
    }
  }
}
