const {deployContract} = require("../shared/helpers");
const {expandDecimals} = require("../../test/shared/utilities");

const POSITION_ROUTER_EXECUTION_FEE = 4000

const localhostProvider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
// Hardhat Account #0
const UPDATER_1 = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").connect(localhostProvider)
// Hardhat Account #1
const UPDATER_2 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d").connect(localhostProvider)
// Hardhat Account #2
const USER_1 = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a").connect(localhostProvider)
// Hardhat Account #19
const TOKEN_MANAGER = new ethers.Wallet("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")


async function deployAll() {
  const {fastPriceFeed} = await setupFastPriceFeed()
  const {weth, atom} = await deployAndMintTokens()
  const {positionRouter, router} = await setupPositionRouter(fastPriceFeed, weth)
  return {positionRouter: positionRouter, router: router, fastPriceFeed: fastPriceFeed, weth: weth, atom: atom}
}

async function setupFastPriceFeed() {
  const fastPriceEvents = await deployContract("FastPriceEvents", [])
  const fastPriceFeed = await deployContract("FastPriceFeed", [
    5 * 60, // _priceDuration
    120 * 60, // _maxPriceUpdateDelay
    2, // _minBlockInterval
    250, // _maxDeviationBasisPoints
    fastPriceEvents.address, // _fastPriceEvents
    TOKEN_MANAGER.address // _tokenManager
  ])
  await fastPriceFeed.initialize(2, [], [UPDATER_1.address, UPDATER_2.address])
  await fastPriceFeed.setMaxTimeDeviation(1000)
  return {fastPriceFeed: fastPriceFeed}
}

async function deployAndMintTokens() {
  const weth = await deployContract("Token", [])
  await weth.mint(USER_1.address, expandDecimals(10, 18))
  const atom = await deployContract("Token", [])
  return {weth: weth, atom: atom}
}

async function addFastPriceFeedUpdaters(fastPriceFeed, updatersAddresses) {
  for (const updater of updatersAddresses) {
    await fastPriceFeed.setUpdater(updater, true)
  }
}

async function setupPositionRouter(fastPriceFeed, weth) {
  const vault = await deployContract("Vault", [])
  //TODO: initialise vault
  //TODO: add tokens to vault
  //TODO: add sth to vault to be able to start position
  const usdg = await deployContract("USDG", [vault.address])
  const router = await deployContract("Router", [vault.address, usdg.address, weth.address])
  const shortsTracker = await deployContract("ShortsTracker", [vault.address])
  const positionUtils = await deployContract("PositionUtils", [])
  const positionRouter = await deployContract("PositionRouter", [
      vault.address, // _vault
      router.address, // _router
      weth.address, // _weth
      shortsTracker.address, // _shortsTracker
      50, // _depositFee
      POSITION_ROUTER_EXECUTION_FEE // _minExecutionFee
    ],
    "PositionRouter",
    {
      libraries: {
        PositionUtils: positionUtils.address
      }
    }
  )
  await positionRouter.setPositionKeeper(fastPriceFeed.address, true)
  await router.addPlugin(positionRouter.address)
  return {positionRouter: positionRouter, router: router}
}

module.exports = {
  deployAll,
  addFastPriceFeedUpdaters,
  UPDATER_1,
  UPDATER_2,
  USER_1,
  POSITION_ROUTER_EXECUTION_FEE
}
