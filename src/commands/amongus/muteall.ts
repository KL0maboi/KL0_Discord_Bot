import {
  ApplicationIntegrationType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { KCommand } from "../../lib/KClient";
import { GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("muteall")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setDescription("Mute all users in the voice channel"),
  execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== interaction.guild?.ownerId)
      return interaction.reply({
        flags: [MessageFlags.Ephemeral],
        content: "Forbidden access",
      });

    const channel = member.voice.channel;
    if (channel) {
      channel.members.forEach((member) => {
        member.voice.setMute(true).catch((error) => {
          console.error("Error muting user:", error);
        });
      });
    }

    interaction.reply({
      content: "Muted all users in the voice channel",
    });
  },
} as KCommand<"chatInput">;
