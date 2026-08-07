import {
  ApplicationIntegrationType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { KCommand } from "../../lib/KClient";
import { GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unmuteall")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setDescription("Unmute all users in the voice channel"),
  execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== interaction.guild?.ownerId)
      return interaction.reply({
        flags: [MessageFlags.Ephemeral],
        content: "Forbidden access",
      });

    const channel = member.voice.channel;
    // unmute everyone in the channel
    if (channel) {
      channel.members.forEach((member) => {
        if (client.deadUsers.has(member.id)) return;
        member.voice.setMute(false).catch((error) => {
          console.error("Error unmuting user:", error);
        });
      });
    }

    interaction.reply({
      content: "Unmuted all users in the voice channel",
    });
  },
} as KCommand<"chatInput">;
