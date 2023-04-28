const {updatePriceBitsAndOptionallyExecute} = require("./keeper-common");
const {UPDATER_1} = require("./setup-common");
const {contractAt} = require("../shared/helpers");

/* To fill e.g. by output of deploy-all */
const PROVIDER_URL = "http://localhost:8545"
const UPDATER_PRIVATE_KEY = UPDATER_1.privateKey
const TOKENS = [
  {symbol: "ETH", precision: 100_000, address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"},
  {symbol: "ATOM", precision: 100_000, address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"}]
const FAST_PRICE_FEED_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const POSITION_ROUTER_CONTRACT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"
const POSITION_UTILS_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL)
const updater = new ethers.Wallet(UPDATER_PRIVATE_KEY).connect(provider)

async function main() {
  const fastPriceFeed = await contractAt("FastPriceFeed", FAST_PRICE_FEED_CONTRACT_ADDRESS)
  const positionRouter = await contractAt("PositionRouter", POSITION_ROUTER_CONTRACT_ADDRESS, updater, {
    libraries: {
      PositionUtils: POSITION_UTILS_ADDRESS
    }
  })

  await updatePriceBitsAndOptionallyExecute(TOKENS, fastPriceFeed, positionRouter, updater)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
