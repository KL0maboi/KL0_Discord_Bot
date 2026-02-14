import { REST, Routes } from "discord.js";
import KClient from "./src/lib/KClient";
import { config } from "dotenv";
config();

const TOKEN = process.env.TOKEN;

const client = new KClient();
client.login(TOKEN);

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN || "");

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(client.user?.id || ""), {
      body: client.commands.mapValues((v) => v.data.toJSON()),
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  client.destroy();
});
