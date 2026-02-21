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
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Context } from "node:vm";

class KClient extends Client {
  eventHandles = new Collection<string, KEventHandle<keyof ClientEvents>>();
  commands = new Collection<string, KCommand<keyof CommandType>>();

  constructor() {
    super({
      presence: {
        status: "invisible",
      },
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
    const eventFiles = readdirSync(join(__dirname, "../events"));

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
        const cmdData: KCommand<keyof CommandType> = require(cmdPath).default;

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

interface CommandType {
  chatInput: ChatInputCommandInteraction;
  contextMenu: ContextMenuCommandInteraction;
}

export type KCommand<Type extends keyof CommandType> = {
  data:
    | SlashCommandBuilder
    | ContextMenuCommandBuilder
    | [SlashCommandBuilder | ContextMenuCommandBuilder];

  execute(
    client: KClient,
    interaction: CommandType[Type],
  ): void | Promise<void>;

  autocomplete?(
    client: KClient,
    interaction: AutocompleteInteraction,
  ): void | Promise<void>;
};

export default KClient;
