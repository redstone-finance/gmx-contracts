const { SYMBOLS_WITH_PRECISION, getVaultPriceFeedContract } = require("./common");

// Usage: npx hardhat run scripts/keepers/get-prices-from-vault-price-feed.js

main();

async function main() {
  const contract = await getVaultPriceFeedContract();
  for (const { symbol, address } of SYMBOLS_WITH_PRECISION) {
    console.log(`\nGetting price for ${symbol} (${address})`);
    const price = await contract.getLatestPrimaryPrice(address);
    console.log({ price });
  }
}
