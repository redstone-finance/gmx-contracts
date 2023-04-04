const { SYMBOLS_WITH_PRECISION, getFastPriceFeedContract, generatePriceBits } = require("./common");

// Usage: npx hardhat run scripts/keepers/set-prices-with-bits.js

const GAS_LIMIT = 100000;

main();

async function main() {
  const contract = await getFastPriceFeedContract();
  const timestamp = Math.floor(Date.now() / 1000);
  const priceBits = await generatePriceBits(SYMBOLS_WITH_PRECISION);

  const tx = await contract.setPricesWithBits(
    priceBits,
    timestamp, {
      gasLimit: GAS_LIMIT,
    }
  );

  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx mined: ${tx.hash}`);
}
