import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_, res) => {
  res.send("Clan Assisitant is live");
});

app.listen(port, () => {
  console.info("INFO: server listening to port", port);
});
