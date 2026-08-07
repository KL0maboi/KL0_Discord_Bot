import {
  Collection,
  ContextMenuCommandBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import KClient from "./src/lib/KClient";
import { config } from "dotenv";
config();

const TOKEN = process.env.TOKEN || "";
const CLIENT_ID = process.env.CLIENT_ID || "";

const client = new KClient();

(async () => {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    const body = new Collection<
      string,
      SlashCommandBuilder | ContextMenuCommandBuilder
    >();

    for (let i of client.commands.values()) {
      const data = i.data;

      if (Array.isArray(data)) {
        for (const d of data) {
          body.set(d.name, d);
        }
      } else {
        body.set(data.name, data);
      }
    }

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID!),
      {
        body: [...body.values()],
      },
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
