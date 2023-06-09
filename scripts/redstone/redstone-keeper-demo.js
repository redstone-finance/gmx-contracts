const {
  localhostProvider,
  deployAll,
  registerPriceFeedKeepers,
  USER_1,
  POSITION_ROUTER_EXECUTION_FEE,
  TOKEN_DECIMALS,
} = require("./setup-common");
const { setPriceBitsAndOptionallyExecute } = require("./keeper-common");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { sleep } = require("../shared/helpers");

const GMX_PRICE_PRECISION = 30;

async function main() {
  const {
    redstoneKeeper,
    positionRouter,
    router,
    fastPriceFeed,
    vault,
    weth,
    tokens,
  } = await deployAll();

  await registerPriceFeedKeepers(fastPriceFeed, [redstoneKeeper.address]);

  await openPosition(positionRouter, router, weth);

  await setPriceBitsAndOptionallyExecute(
    tokens.map((token) => token.symbol),
    redstoneKeeper,
    positionRouter
  );
  const pricesInFeed1 = await checkPricesInFeed(fastPriceFeed, tokens);
  console.log(`Prices in feed ${JSON.stringify(pricesInFeed1)}`);
  console.log(
    `GMX Position: ${JSON.stringify(await getPosition(vault, weth))}`
  );
  await network.provider.send("evm_mine"); // FIX ?
  await sleep(60_000); // wait for price noticeably change

  await setPriceBitsAndOptionallyExecute(
    tokens.map((token) => token.symbol),
    redstoneKeeper,
    positionRouter
  );
  const pricesInFeed2 = await checkPricesInFeed(fastPriceFeed, tokens);
  console.log(`Prices in feed ${JSON.stringify(pricesInFeed2)}`);

  console.log("Prices in feed changes");
  pricesInFeed1.forEach((priceInFeed1, index) =>
    console.log(
      `${priceInFeed1.token}: ${priceInFeed1.price} -> ${pricesInFeed2[index].price}`
    )
  );
}

async function openPosition(positionRouter, router, token) {
  console.log("Increasing position");

  await router.connect(USER_1).approvePlugin(positionRouter.address);
  await token
    .connect(USER_1)
    .approve(router.address, expandDecimals(1, TOKEN_DECIMALS));

  const tx = await positionRouter.connect(USER_1).createIncreasePosition(
    [token.address], // _path
    token.address, // _indexToken
    expandDecimals(1, TOKEN_DECIMALS), // _amountIn
    0, // _minOut
    toUsd(6000), // _sizeDelta
    true, // _isLong
    toUsd(10_000), // _acceptablePrice,
    POSITION_ROUTER_EXECUTION_FEE, // _executionFee
    ethers.constants.HashZero, // _referralCode
    ethers.constants.AddressZero, // _callbackTarget
    { value: POSITION_ROUTER_EXECUTION_FEE } // msg.value
  );
  await tx.wait();
}

async function checkPricesInFeed(fastPriceFeed, tokens) {
  return await Promise.all(
    tokens.map(async (token) => {
      return {
        token: token.symbol,
        price: ethers.utils.formatUnits(
          await fastPriceFeed.prices(token.address),
          GMX_PRICE_PRECISION
        ),
      };
    })
  );
}

async function getPosition(vault, token) {
  const position = await vault.getPosition(
    USER_1.address, // _account
    token.address, // _collateralToken
    token.address, // _indexToken
    true // _isLong
  );
  return {
    size: ethers.utils.formatUnits(position[0], GMX_PRICE_PRECISION),
    collateral: ethers.utils.formatUnits(position[1], GMX_PRICE_PRECISION),
    averagePrice: ethers.utils.formatUnits(position[2], GMX_PRICE_PRECISION),
    entryFundingRate: ethers.utils.formatUnits(
      position[3],
      GMX_PRICE_PRECISION
    ),
    reserveAmount: ethers.utils.formatUnits(position[4], GMX_PRICE_PRECISION),
    realisedPnl: ethers.utils.formatUnits(position[5], GMX_PRICE_PRECISION),
    hasProfit: position[6],
    lastIncreasedTime: ethers.utils.formatUnits(
      position[7],
      GMX_PRICE_PRECISION
    ),
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
