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
  },
} as KEventHandle<"clientReady">;
