// make a command that will set a user to be dead (which will make them unable to talk in the game chat) in the amongus game

import {
  ApplicationIntegrationType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { KCommand } from "../../lib/KClient";
import { GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("resetdead")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setDescription("Reset all dead users in the Among Us game"),

  execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== interaction.guild?.ownerId)
      return interaction.reply({
        flags: [MessageFlags.Ephemeral],
        content: "Forbidden access",
      });

    client.deadUsers.clear();

    interaction.reply({
      content: "Reset all dead users in the Among Us game",
    });
  },
} as KCommand<"chatInput">;
