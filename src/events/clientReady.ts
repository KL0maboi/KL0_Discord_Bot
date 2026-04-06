import { KEventHandle } from "../lib/KClient";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user?.username}!`);

    if (process.env.DEVENV) return;
    const owner = await client.users.fetch("579605422521188363");

    if (!owner.dmChannel) await owner.createDM();
    owner.dmChannel?.send("Bot restarted..");
  },
} as KEventHandle<"clientReady">;
