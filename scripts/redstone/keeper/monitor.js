const express = require("express");
const ethers = require("ethers");
const fetch = require("node-fetch");

require("dotenv").config();

const logger = require("./logger");
const KEEPER_DEPLOY_KEY = process.env.KEEPER_DEPLOY_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const { PROVIDER_URL } = require("./config");

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const keeper = new ethers.Wallet(KEEPER_DEPLOY_KEY, provider);

const THRESHOLD = 50;
let notificationSent = false;

async function fetchBalance(address) {
  const url = new URL("https://testnet.tuber.build/api");
  const params = { module: "account", action: "balance", address: address };
  url.search = new URLSearchParams(params).toString();

  return fetch(url)
    .then((response) => response.json())
    .catch((err) => console.error(err));
}

async function sendMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const params = { chat_id: CHAT_ID, text: text };
  const z = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
}

async function monitorBalance() {
  fetchBalance(keeper.address).then((data) => {
    const balance = parseFloat(data.result) / 10 ** 18;

    if (balance >= THRESHOLD) {
      notificationSent = false;
    }

    if (balance < THRESHOLD && !notificationSent) {
      sendMessage(`Warning: Balance is ${balance}!`);
      notificationSent = true;
    }
  });
}

setInterval(monitorBalance, 60 * 60 * 5);

const app = express();
const port = 3001;

app.get("/heartbeat", (req, res) => {
  res.send({
    status: "OK",
    time: new Date().toISOString(),
  });
});

app.listen(port, async () => {
  logger.info(`Server is running on port ${port}.`);
});
