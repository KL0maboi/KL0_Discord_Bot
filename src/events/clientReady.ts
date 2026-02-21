import { KEventHandle } from "../lib/KClient";

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user?.username}!`);
  },
} as KEventHandle<"clientReady">;
