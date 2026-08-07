import {
  ApplicationIntegrationType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { KCommand } from "../../lib/KClient";
import { GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setalive")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setDescription("Set a user to be alive in the Among Us game")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to set to be alive")
        .setRequired(true),
    ),

  execute(client, interaction) {
    const member = interaction.member as GuildMember;
    if (member.id !== interaction.guild?.ownerId)
      return interaction.reply({
        flags: [MessageFlags.Ephemeral],
        content: "Forbidden access",
      });

    const user = interaction.options.getUser("user", true);
    client.deadUsers.delete(user.id);

    interaction.reply({
      content: "Set user to be alive in the Among Us game",
    });
  },
} as KCommand<"chatInput">;
