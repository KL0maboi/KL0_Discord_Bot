import KClient from "./src/lib/KClient";
import { config } from "dotenv";
config();

const client = new KClient();

client.login(process.env.TOKEN);
