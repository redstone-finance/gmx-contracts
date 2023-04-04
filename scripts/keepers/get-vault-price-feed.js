const { getFastPriceFeedContract } = require("./common");

// Usage: npx hardhat run scripts/keepers/get-vault-price-feed.js

main();

async function main() {
  const fastPriceFeed = await getFastPriceFeedContract();
  const vaultPriceFeedAddress = await fastPriceFeed.vaultPriceFeed();
  console.log({ vaultPriceFeedAddress });
}
