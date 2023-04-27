const { getFastPriceFeedContract, SYMBOLS_WITH_PRECISION } = require("./common");

// Usage: npx hardhat run scripts/keepers/get-prices-from-fast-price-feed.js

const REF_PRICE = 420; // it will add or deduct some amount of spread from this price (based on the MAXIMIZE param and spread basic points)
const MAXIMIZE = true; // this param sets if the price should be maximized or minimized by spread

main();

async function main() {
  const contract = await getFastPriceFeedContract();
  for (const { symbol, address } of SYMBOLS_WITH_PRECISION) {
    console.log(`\nGetting price for ${symbol} (${address})`);
    const price = (await contract.getPrice(address, REF_PRICE, MAXIMIZE)).toNumber();
    console.log({ price });
  }
}
