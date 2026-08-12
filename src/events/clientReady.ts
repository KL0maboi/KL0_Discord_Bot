import { KEventHandle } from "../lib/KClient";

const SECONDS_IN_ONE_HOUR = 60 * 60;

export default {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user?.username}!`);

    if (await client.checkIfEligibleToChangeNameGod()) client.changeNameGod();

    setInterval(async () => {
      if (await client.checkIfEligibleToChangeNameGod()) client.changeNameGod();
    }, SECONDS_IN_ONE_HOUR * 1000);

    if (process.env.DEVENV) return;
    const owner = await client.users.fetch("579605422521188363");

    if (!owner.dmChannel) await owner.createDM();
    owner.dmChannel?.send("Bot restarted..");
  },
} as KEventHandle<"clientReady">;
