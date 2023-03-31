const POSITION_ROUTER_ADDRESS = "0x0"; // TODO: update
const MAX_INCREASE_POSITIONS = 1;
const MAX_DECREASE_POSITIONS = 2;
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

  // TODO: implement dynamic fetching of the correct values
  const endIndexForIncreasePositions = 1;
  const endIndexForDecreasePositions = 1;

  const tx = await contract.connect(updater0).setPricesWithBitsAndExecute(
    POSITION_ROUTER_ADDRESS,
    priceBits, // _priceBits
    timestamp, // _timestamp
    endIndexForIncreasePositions, // _endIndexForIncreasePositions
    endIndexForDecreasePositions, // _endIndexForDecreasePositions
    MAX_INCREASE_POSITIONS, // _maxIncreasePositions
    MAX_DECREASE_POSITIONS // _maxDecreasePositions
  );

  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx mined: ${tx.hash}`);
}

