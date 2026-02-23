import { MessageFlagsBitField } from "discord.js";
import { KEventHandle } from "../lib/KClient";

export default {
  name: "interactionCreate",
  async execute(client, interaction) {
    if (
      interaction.isChatInputCommand() ||
      interaction.isContextMenuCommand()
    ) {
      const command = client.commands.get(interaction.commandName);

      if (!command)
        return interaction.reply({
          content:
            "The command seems to be missing from the source directory...",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });

      if (command.dev && !(interaction.user.id in ["579605422521188363"])) {
        return interaction.reply({
          content:
            "This command is currently in development and cannot be used by non-devuser.",
          flags: [MessageFlagsBitField.Flags.Ephemeral],
        });
      }

      try {
        command.execute(client, interaction);
      } catch (err) {
        console.warn(err);
      }
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command || !command.autocomplete) return interaction.respond([]);

      try {
        command.autocomplete(client, interaction);
      } catch (err) {
        console.warn(err);
      }
    }
  },
} as KEventHandle<"interactionCreate">;
