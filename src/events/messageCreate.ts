import { ChannelType, TextChannel } from "discord.js";
import { KEventHandle } from "../lib/KClient";

export default {
  name: "messageCreate",
  async execute(client, msg) {
    if (msg.guildId !== process.env.GUILD_ID) return;

    const guild = await client.guilds.fetch(process.env.GUILD_ID!);
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

    if (logChannel.isSendable())
      logChannel.send({
        content: `${msg.author.tag}: ${msg.content}`,
        embeds: msg.embeds,
        files: msg.attachments.map((a) => a.url),
        components: msg.components,
      });
  },
} as KEventHandle<"messageCreate">;
