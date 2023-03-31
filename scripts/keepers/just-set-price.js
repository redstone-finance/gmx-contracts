const { SYMBOLS_WITH_PRECISION } = require("./common");

async function main() {
  const contract = await getFastPriceFeedContract();
  const timestamp = Math.floor(Date.now() / 1000);
  const priceBits = await generatePriceBits(SYMBOLS_WITH_PRECISION);

  const tx = await contract.setPricesWithBits(
    priceBits, // _priceBits
    timestamp // _timestamp
  );

  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx mined: ${tx.hash}`);
}
