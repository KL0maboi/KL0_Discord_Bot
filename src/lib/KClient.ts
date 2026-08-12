import { Mistral } from "@mistralai/mistralai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  IntentsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync } from "node:fs";

type persistantDataJson = {
  lastSwappedNameGod: number;
};

const SECONDS_IN_3_DAYS = 60 * 60 * 24 * 3;
const NAME_GOD_ROLE_ID = "1481230600831635476";

const ELIGIBLE_NAME_GOD_USERS = [
  "945680371826180207", // Sushil
  "1327085011375231030", // PDF
  "1520977009529065635", // ME
  "828274444345802772", // BAJJI
  "1113295984961802291", // COW
  "1036955547989192734", // BI
  "1016326746028642355", // DON
  "867813038010400808", // PAKODA
  "786111664633675817", // MASTER
  "1036176085206970418", // SOTTA
  "880410152304521226", // VANDHI
];

class KClient extends Client {
  deadUsers = new Set<string>();
  eventHandles = new Collection<string, KEventHandle<keyof ClientEvents>>();
  commands = new Collection<string, KCommand<keyof KCommandDataType>>();
  lastAdminRequestedAt: Collection<string, number> = new Collection();
  mistral = new Mistral({
    apiKey: process.env.API_KEY,
  });
  data: persistantDataJson = JSON.parse(
    readFileSync(join(__dirname, "../data/data.json")).toString(),
  );

  constructor() {
    super({
      presence: {
        // status: "invisible",
      },
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
      ],
    });

    this.loadEvents();
    this.loadCommands();
  }

  async checkIfNameGodExists() {
    const guild = await (await this.guilds.fetch())
      .get(process.env.GUILD_ID || "")
      ?.fetch();

    const members = await guild?.members.fetch({
      user: ELIGIBLE_NAME_GOD_USERS,
    });

    if (!members)
      return console.log("Line 57, KClient.ts:\n`members` is undefined/null");

    return members.some((member) => member.roles.cache.has(NAME_GOD_ROLE_ID));
  }

  async checkIfEligibleToChangeNameGod() {
    if (!(await this.checkIfNameGodExists())) return true;

    const lastSwapped = this.data.lastSwappedNameGod;
    const now = Math.floor(Date.now() / 1000);

    return now - lastSwapped > SECONDS_IN_3_DAYS;
  }

  async changeNameGod() {
    const SELECTED_USER_ID =
      ELIGIBLE_NAME_GOD_USERS[
        Math.floor((Math.random() - 0.0001) * ELIGIBLE_NAME_GOD_USERS.length)
      ];

    const guild = await (await this.guilds.fetch())
      .get(process.env.GUILD_ID || "")
      ?.fetch()!;

    await guild.members.fetch({ user: ELIGIBLE_NAME_GOD_USERS });
    const members = guild.members.cache;
    const removeRoleUsers = members
      .filter((m) => m.roles.cache.has(NAME_GOD_ROLE_ID))
      .values();

    for (let member of removeRoleUsers) {
      await member.roles.remove(NAME_GOD_ROLE_ID);
    }

    const selectedMember = members?.get(SELECTED_USER_ID);

    if (!selectedMember)
      return console.log("selected member doesnt exist for namegodchange");

    selectedMember.roles.add(NAME_GOD_ROLE_ID);

    console.log("name god has been changed to", selectedMember.user.username);

    this.notifyNameGodChange(selectedMember.user.username || "");

    this.data.lastSwappedNameGod = Date.now();
    writeFileSync(
      join(__dirname, "../data/data.json"),
      JSON.stringify(this.data),
    );
  }

  async notifyNameGodChange(name: string) {
    const CHANNEL_ID = "1413421767715721256";

    const guild = this.guilds.cache.get(process.env.GUILD_ID || "");

    if (!guild) return;

    await guild.channels.fetch(CHANNEL_ID);

    const channel = guild.channels.cache.get(CHANNEL_ID);

    if (channel?.isSendable())
      channel.send(`NAME GOD HAS BEEN CHANGED TO ${name}`);
  }

  async loadEvents() {
    const eventFiles = readdirSync(join(__dirname, "../events"));

    for (const file of eventFiles) {
      const event: KEventHandle<keyof ClientEvents> = (
        await import(`../events/${file}`)
      ).default;

      if (event.once) {
        this.once(event.name, (...args) => event.execute(this, ...args));
      } else {
        this.on(event.name, (...args) => event.execute(this, ...args));
      }
    }
  }

  async loadCommands() {
    const path = join(__dirname, "../commands");
    const categories = readdirSync(path);

    for (const category of categories) {
      const dirPath = join(path, category);
      const commands = readdirSync(dirPath);

      for (const command of commands) {
        const cmdPath = join(dirPath, command);
        const cmdData: KCommand<keyof KCommandType> = (await import(cmdPath))
          .default;

        const data = cmdData.data;

        if (Array.isArray(data)) {
          for (const d of data) {
            this.commands.set(d.name, cmdData);
          }
        } else {
          this.commands.set(data.name, cmdData);
        }
      }
    }
  }
}

export type KEventHandle<Event extends keyof ClientEvents> = {
  name: Event;
  once?: boolean;
  execute: (
    client: KClient,
    ...args: ClientEvents[Event]
  ) => Promise<void> | void;
};

interface KCommandType {
  chatInput: ChatInputCommandInteraction;
  contextMenu: ContextMenuCommandInteraction;
  both: ChatInputCommandInteraction | ContextMenuCommandInteraction;
}

interface KCommandDataType {
  chatInput: SlashCommandBuilder;
  contextMenu: ContextMenuCommandBuilder;
  both: [SlashCommandBuilder, ContextMenuCommandBuilder];
}

export type KCommand<Type extends keyof KCommandType> = {
  data: KCommandDataType[Type];

  execute(
    client: KClient,
    interaction: KCommandType[Type],
  ): void | Promise<void>;

  autocomplete?(
    client: KClient,
    interaction: AutocompleteInteraction,
  ): void | Promise<void>;

  dev: boolean;
};

export default KClient;
