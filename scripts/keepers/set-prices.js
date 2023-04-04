const { SYMBOLS_WITH_PRECISION, getFastPriceFeedContract } = require("./common");
const redstone = require("redstone-api");
const { BigNumber } = require("ethers");

// Usage: npx hardhat run scripts/keepers/set-prices.js

const PRICE_DECIMALS = 8;
const REDSTONE_PRECISION = 4;
const GAS_LIMIT = 100000;

main();

async function main() {
  const contract = await getFastPriceFeedContract();
  const timestamp = Math.floor(Date.now() / 1000);

  const symbols = SYMBOLS_WITH_PRECISION.map(({ symbol }) => symbol);
  const tokenAddresses = SYMBOLS_WITH_PRECISION.map(({ address }) => address);
  const pricesFromApi = await redstone.query().symbols(symbols).latest().exec({
    provider: "redstone"
  });

  const pricesBigNumbers = [];
  for (const symbol of symbols) {
    const price = pricesFromApi[symbol];
    const priceWithPrecision = Math.round(price.value * (10 ** REDSTONE_PRECISION));
    const bigNumberMultiplier = BigNumber.from(10).pow(PRICE_DECIMALS - REDSTONE_PRECISION);
    const priceBigNumber = BigNumber.from(priceWithPrecision).mul(bigNumberMultiplier);
    pricesBigNumbers.push(priceBigNumber);
  }

  console.log({ tokenAddresses, pricesBigNumbers });

  const tx = await contract.setPrices(
    // tokenAddresses,
    // pricesBigNumbers,
    [tokenAddresses[0]],
    [pricesBigNumbers[0]],
    timestamp, {
      gasLimit: GAS_LIMIT,
    }
  );

  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx mined: ${tx.hash}`);
}
