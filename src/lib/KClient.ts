import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  IntentsBitField,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

class KClient extends Client {
  eventHandles = new Collection<string, KEventHandle<keyof ClientEvents>>();
  commands = new Collection<string, KCommand>();

  constructor() {
    super({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
      ],
    });

    this.loadEvents();
    this.loadCommands();
  }

  loadEvents() {
    const eventFiles = readdirSync(join(__dirname, "../events")).filter(
      (file) => file.endsWith(".ts"),
    );

    for (const file of eventFiles) {
      const event: KEventHandle<keyof ClientEvents> = require(
        `../events/${file}`,
      ).default;

      if (event.once) {
        this.once(event.name, (...args) => event.execute(this, ...args));
      } else {
        this.on(event.name, (...args) => event.execute(this, ...args));
      }
    }
  }

  loadCommands() {
    const path = join(__dirname, "../commands");
    const categories = readdirSync(path);

    for (const category of categories) {
      const dirPath = join(path, category);
      const commands = readdirSync(dirPath);

      for (const command of commands) {
        const cmdPath = join(dirPath, command);
        const cmdData: KCommand = require(cmdPath).default;
        this.commands.set(cmdData.data.name, cmdData);
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

export type KCommand = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

  execute(
    client: KClient,
    interaction: ChatInputCommandInteraction,
  ): void | Promise<void>;

  autocomplete?(
    client: KClient,
    interaction: AutocompleteInteraction,
  ): void | Promise<void>;
};

export default KClient;
