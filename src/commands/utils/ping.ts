import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { KCommand } from "../../lib/KClient";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("basic ping command"),
  execute(client, interaction) {
    interaction.reply({
      content: "pong",
      flags: [MessageFlags.Ephemeral],
    });
  },
} as KCommand;
