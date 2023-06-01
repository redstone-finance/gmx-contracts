const express = require("express");
const ethers = require("ethers");

const logger = require("./logger");
const { updatePriceBitsAndOptionallyExecute } = require("./utils");

const {
  FAST_PRICE_FEED_ADDRESS,
  POSITION_ROUTER_ADDRESS,
  KEEPER_DEPLOY_KEY,
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

    updatePriceBitsAndOptionallyExecute(
      tokens,
      fastPriceFeed,
      positionRouter,
      keeper
    );
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

    updatePriceBitsAndOptionallyExecute(
      tokens,
      fastPriceFeed,
      positionRouter,
      keeper
    );
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
