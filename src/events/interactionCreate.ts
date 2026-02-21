import { KEventHandle } from "../lib/KClient";

export default {
  name: "interactionCreate",
  async execute(client, interaction) {
    if (
      !(interaction.isChatInputCommand() || interaction.isContextMenuCommand())
    )
      return;
    try {
      client.commands
        .get(interaction.commandName)
        ?.execute(client, interaction);
    } catch (err) {
      console.log("error occured");
    }
  },
} as KEventHandle<"interactionCreate">;
