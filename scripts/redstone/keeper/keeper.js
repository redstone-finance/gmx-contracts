const express = require("express");
const ethers = require("ethers");
const fetch = require('node-fetch');
require("dotenv").config();

const logger = require("./logger");
const { updatePriceBitsAndOptionallyExecute } = require("./utils");
const KEEPER_DEPLOY_KEY = process.env.KEEPER_DEPLOY_KEY;
const FAST_PRICE_FEED_ADDRESS = process.env.FAST_PRICE_FEED_ADDRESS;
const POSITION_ROUTER_ADDRESS = process.env.POSITION_ROUTER_ADDRESS;
const PING_ADDRESS = process.env.PING_ADDRESS;

const {
  ETH_ADDRESS,
  CANTO_ADDRESS,
  ATOM_ADDRESS,
  PROVIDER_URL,
} = require("./config");

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const keeper = new ethers.Wallet(KEEPER_DEPLOY_KEY, provider);

const fastPriceFeed = new ethers.Contract(
  FAST_PRICE_FEED_ADDRESS,
  require("../../../artifacts/contracts/oracle/FastPriceFeed.sol/FastPriceFeed.json").abi,
  provider
);
const positionRouter = new ethers.Contract(
  POSITION_ROUTER_ADDRESS,
  require("../../../artifacts/contracts/core/PositionRouter.sol/PositionRouter.json").abi,
  provider
);

const tokens = [
  {
    symbol: "ETH",
    precision: 1000,
    address: ETH_ADDRESS,
  },
  {
    symbol: "CANTO",
    precision: 1000,
    address: CANTO_ADDRESS,
  },
  {
    symbol: "ATOM",
    precision: 1000,
    address: ATOM_ADDRESS,
  },
];

function pingAddressHandler() {
  fetch(PING_ADDRESS)
    .then((response) => {
      if (response.ok) {
        logger.info("Ping successful");
      } else {
        logger.error("Ping failed");
      }
    })
    .catch((error) => {
      logger.error("Error occurred during ping:", error);
    });
}

setInterval(pingAddressHandler, 60 * 60 * 1000);

const app = express();
const port = 3000;

positionRouter.on(
  "CreateIncreasePosition",
  (
    account,
    path,
    indexToken,
    amountIn,
    minOut,
    sizeDelta,
    isLong,
    acceptablePrice,
    executionFee,
    index,
    queueIndex,
    blockNumber,
    blockTime,
    gasPrice
  ) => {
    logger.info(
      `CreateIncreasePosition: ${JSON.stringify({
        account,
        path,
        indexToken,
        amountIn,
        minOut,
        sizeDelta,
        isLong,
        acceptablePrice,
        executionFee,
        index,
        queueIndex,
        blockNumber,
        blockTime,
        gasPrice,
      })}`
    );

    try {
      updatePriceBitsAndOptionallyExecute(
        tokens,
        fastPriceFeed,
        positionRouter,
        keeper
      );
    } catch (e) {
      logger.error(e);
    }
  }
);

positionRouter.on(
  "CreateDecreasePosition",
  (
    account,
    path,
    indexToken,
    collateralDelta,
    sizeDelta,
    isLong,
    receiver,
    acceptablePrice,
    minOut,
    executionFee,
    index,
    queueIndex,
    blockNumber,
    blockTime
  ) => {
    logger.info(
      `CreateDecreasePosition: ${JSON.stringify({
        account,
        path,
        indexToken,
        collateralDelta,
        sizeDelta,
        isLong,
        receiver,
        acceptablePrice,
        minOut,
        executionFee,
        index,
        queueIndex,
        blockNumber,
        blockTime,
      })}`
    );

    try {
      updatePriceBitsAndOptionallyExecute(
        tokens,
        fastPriceFeed,
        positionRouter,
        keeper
      );
    } catch (e) {
      logger.error(e);
    }
  }
);

app.get("/heartbeat", (req, res) => {
  res.send({
    status: "OK",
    time: new Date().toISOString(),
  });
});

app.get("/", async (req, res) => {
  res.send("Server is running and listening to contract events!");
});

app.listen(port, async () => {
  logger.info(`Server is running on port ${port}.`);
});
