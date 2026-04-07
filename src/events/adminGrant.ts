import { MessageFlags } from "discord.js";
import { KEventHandle } from "../lib/KClient";

const COOLDOWN_MS = 10 * 60 * 1000;

// --- ONLINE IDF STORAGE ---
const df = new Map<string, number>();
let totalDocs = 1;

const MIN_IDF = 0.3;
const MAX_IDF = 3.0;

// important word boost
const BOOST: Record<string, number> = {
  admin: 2,
};

// --- NORMALIZATION ---
function normalize(text: string) {
  return text
    .toLowerCase()
    .replaceAll(/\b\w*admn|admim|amin\w*\b/g, "admin")
    .replaceAll(/pls|plz/g, "please")
    .replaceAll(/\bdont\b/g, "do not")
    .replaceAll(/[^a-z\s]/g, "")
    .replaceAll("kudu", "give")
    .replaceAll("kudunga", "give")
    .replaceAll("thaa", "give")
    .replaceAll("venum", "need")
    .replaceAll("vendam", "no")
    .trim();
}

// --- TOKENIZE ---
function tokenize(text: string) {
  return normalize(text).split(/\s+/);
}

// --- UPDATE DF ---
function updateDF(tokens: string[]) {
  totalDocs++;

  const unique = new Set(tokens);

  for (const word of unique) {
    df.set(word, (df.get(word) || 0) + 1);
  }

  // decay
  if (totalDocs % 1000 === 0) {
    totalDocs = Math.floor(totalDocs / 2);

    for (const [word, count] of df) {
      df.set(word, Math.floor(count / 2));
    }
  }
}

// --- IDF ---
function getIDF(word: string) {
  const freq = df.get(word) || 0;

  let idf = Math.log(totalDocs / (1 + freq));

  if (idf < MIN_IDF) idf = MIN_IDF;
  if (idf > MAX_IDF) idf = MAX_IDF;

  if (BOOST[word]) idf *= BOOST[word];

  return idf;
}

// --- LEVENSHTEIN ---
function levenshtein(a: string, b: string) {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

// --- WORD SIM ---
function wordSim(a: string, b: string) {
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// --- MAX SIM ---
function maxSim(word: string, tokens: string[]) {
  let max = 0;

  for (const t of tokens) {
    const sim = wordSim(word, t);
    if (sim > max) max = sim;
  }

  return max;
}

// --- SIMILARITY ---
function similarity(a: string, b: string) {
  const t1 = tokenize(a);
  const t2 = tokenize(b);

  function dirSim(src: string[], tgt: string[]) {
    let num = 0;
    let denom = 0;

    for (const w of src) {
      const idf = getIDF(w);
      const sim = maxSim(w, tgt);

      num += sim * idf;
      denom += idf;
    }

    return denom === 0 ? 0 : num / denom;
  }

  return 0.5 * (dirSim(t1, t2) + dirSim(t2, t1));
}

// --- POSITIVE REFERENCES ---
const REFERENCES = [
  "gib admin",
  "giv admin",
  "give admin",
  "give me admin",
  "please give admin",
  "can i get admin",
  "i need admin access",
  "make me admin",
  "grant me admin",
  "admin role please",
  "gimme admin",
  "admin kudu",
  "admin venum",
  "admin kudunga",
  "admin tha da",
  "dei admin tha da pls",
  "enaku admin venum",
  "bro admin kudu",
  "admin venum bro",
  "admin role kudunga",
  "admin access venum",
  "pls admin kudu",
  "give admin da",
  "admin venum pls",
  "give me full access",
  "i want all permissions",
  "admin?",
  "admin pls?",
  "admin dedo bai",
  "admin dedho bai",
  "admin dedho",
  "admin de da",
];

// --- INVERSE REFERENCES ---
const INVERSE_REFERENCES = [
  // negation
  "do not give me admin",
  "dont give me admin",
  "no admin for me",
  "i dont want admin",
  "never give me admin",
  "admin not needed",
  "i dont need admin",
  "no admin pls",

  // giving others
  "give him admin",
  "give her admin",
  "give them admin",
  "give my friend admin",
  "give admin to him",
  "give admin to her",
  "give admin to them",

  // tamil / tanglish
  "enaku admin vendam",
  "avanukku admin kudu",
  "avanga admin venum",
  "friend ku admin kudu",
  "avanukku admin kudunga",
  "admin vendam bro",
  "admin tharatha da",
  "do not give admin to my friend",

  // hinglish
  "mujhe admin nahi chahiye",
  "admin nahi dena",
  "admin nahi dedo",
];

// --- INVERSE PENALTY ---
function inversePenalty(message: string) {
  let best = 0;

  for (const ref of INVERSE_REFERENCES) {
    const score = similarity(message, ref);
    if (score > best) best = score;
  }

  if (best > 0.9) {
    return best * 0.8;
  }

  return 0;
}

// --- DETECTOR ---
function isAdminRequest(message: string) {
  const text = normalize(message);

  let best = 0;

  for (const ref of REFERENCES) {
    const score = similarity(text, ref);
    if (score > best) best = score;
  }

  const penalty = inversePenalty(text);
  const finalScore = best - penalty;

  console.log({
    main: best,
    penalty,
    final: finalScore,
  });

  return finalScore > 0.7;
}

// --- EVENT ---
export default {
  name: "messageCreate",
  async execute(client, msg) {
    if (process.env.DEVENV) return;
    if (!msg.content || msg.author.bot) return;

    const userId = msg.author.id;
    const now = Date.now();

    const tokens = tokenize(msg.content);
    updateDF(tokens);

    {
      const channel = client.channels.cache.get("1491092674931986493");
      channel?.isSendable() &&
        channel.send({
          content: JSON.stringify(df),
        });
    }

    const lastRequested = client.lastAdminRequestedAt.get(userId) || 0;
    if (lastRequested && now - lastRequested < COOLDOWN_MS) return;

    const member = await msg.guild?.members.fetch(userId);
    const role = msg.guild?.roles.cache.get("1417132029857890386");
    if (!role) return;
    if (!member) return;
    if (member.roles.cache.has("1417132029857890386")) return;

    if (!isAdminRequest(msg.content)) return;

    // asign admin reole
    await member.roles.add(role);

    msg.reply({
      content:
        "i have given you admin, i cannot give again for next 10 mins so be wary",
    });

    client.lastAdminRequestedAt.set(userId, now);

    console.log(`[ADMIN REQUEST DETECTED] ${msg.author.tag}: ${msg.content}`);
  },
} as KEventHandle<"messageCreate">;
