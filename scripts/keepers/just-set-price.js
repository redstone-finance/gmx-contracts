const SYMBOLS_WITH_PRECISION = [
  {symbol: "CANTO", precision: 1000},
  {symbol: "ETH", precision: 1000},
  {symbol: "ATOM", precision: 1000},
  {symbol: "USDC", precision: 1000},
  {symbol: "USDT", precision: 1000},
];

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
