const {updatePriceBitsAndOptionallyExecute} = require("./keeper-common");
const {UPDATER_1} = require("./setup-common");
const {contractAt} = require("../shared/helpers");

const PROVIDER_URL = "http://localhost:8545"
const UPDATER_PRIVATE_KEY = UPDATER_1.privateKey

const WETH_CONTRACT_ADDRESS = process.env.WETH_CONTRACT_ADDRESS
const ATOM_CONTRACT_ADDRESS = process.env.ATOM_CONTRACT_ADDRESS
const TOKENS = [
  {symbol: "ETH", precision: 100_000, address: WETH_CONTRACT_ADDRESS},
  {symbol: "ATOM", precision: 100_000, address: ATOM_CONTRACT_ADDRESS}]
const FAST_PRICE_FEED_CONTRACT_ADDRESS = process.env.FAST_PRICE_FEED_CONTRACT_ADDRESS
const POSITION_ROUTER_CONTRACT_ADDRESS = process.env.POSITION_ROUTER_CONTRACT_ADDRESS
const POSITION_UTILS_ADDRESS = process.env.POSITION_UTILS_ADDRESS

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
