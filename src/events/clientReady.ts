import { ActivityType } from "discord.js";
import { KEventHandle } from "../lib/KClient";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user?.username}!`);

    client.user?.setPresence({
      activities: [
        {
          name: "KClient is on",
          type: ActivityType.Custom,
        },
      ],
    });

    const guild = await (await client.guilds.fetch())
      .find((guild) => guild.id === "1413421252751654984")
      ?.fetch();

    const data = client.commands.mapValues((v) => v.data.toJSON()).toJSON();

    guild?.commands.set(data);
  },
} as KEventHandle<"clientReady">;
