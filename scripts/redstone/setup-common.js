const {deployContract} = require("../shared/helpers");
const {expandDecimals} = require("../../test/shared/utilities");
const {toUsd} = require("../../test/shared/units");
const {toChainlinkPrice} = require("../../test/shared/chainlink");
const {fetchPrices} = require("./keeper-common");

const POSITION_ROUTER_EXECUTION_FEE = 4000
const TOKEN_DECIMALS = 18

const localhostProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")

// Hardhat Account #0
const DEPLOYER = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").connect(localhostProvider)
// Hardhat Account #3
const USER_1 = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6").connect(localhostProvider)
// Hardhat Account #19
const TOKEN_MANAGER = new ethers.Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e").connect(localhostProvider)


async function deployAll() {
  const {fastPriceFeed} = await setupFastPriceFeed()
  const redstoneKeeper = await deployContract("RedstoneKeeper", [fastPriceFeed.address])
  const {weth, atom} = await deployAndMintTokens()
  const {positionRouter, router, vault, usdg, positionUtils} = await setupPositionRouter(fastPriceFeed, weth, atom)
  await configureVault(vault, router, usdg, weth, atom, fastPriceFeed, positionRouter)
  const tokens = [{symbol: "ETH", precision: 100_000, address: weth.address}, {symbol: "ATOM", precision: 100_000, address: atom.address}]
  await addFastPriceFeedTokens(fastPriceFeed, tokens)
  return {
    redstoneKeeper: redstoneKeeper,
    positionRouter: positionRouter,
    router: router,
    fastPriceFeed: fastPriceFeed,
    vault: vault,
    weth: weth,
    atom: atom,
    positionUtils: positionUtils,
    tokens: tokens
  }
}

async function setupFastPriceFeed() {
  const fastPriceEvents = await deployContract("FastPriceEvents", [])
  const fastPriceFeed = await deployContract("FastPriceFeed", [
    5 * 60, // _priceDuration
    120 * 60, // _maxPriceUpdateDelay
    1, // _minBlockInterval
    250, // _maxDeviationBasisPoints
    fastPriceEvents.address, // _fastPriceEvents
    TOKEN_MANAGER.address // _tokenManager
  ])
  await fastPriceFeed.initialize(2, [], [])
  await fastPriceFeed.setMaxTimeDeviation(1000)
  await fastPriceFeed.connect(TOKEN_MANAGER).setPriceDataInterval(1)
  await fastPriceEvents.setIsPriceFeed(fastPriceFeed.address, true)
  return {fastPriceFeed: fastPriceFeed}
}

async function deployAndMintTokens() {
  const weth = await deployContract("Token", [])
  await weth.mint(USER_1.address, expandDecimals(10, TOKEN_DECIMALS))
  const atom = await deployContract("Token", [])
  return {weth: weth, atom: atom}
}

async function registerPriceFeedKeepers(fastPriceFeed, keeperssAddresses) {
  for (const keeper of keeperssAddresses) {
    await fastPriceFeed.setUpdater(keeper, true)
  }
}

async function addFastPriceFeedTokens(fastPriceFeed, tokens) {
  const addresses = tokens.map(token => token.address)
  const precisions = tokens.map(token => token.precision)
  await fastPriceFeed.setTokens(addresses, precisions)
}

async function setupPositionRouter(fastPriceFeed, weth) {
  const vault = await deployContract("Vault", [])
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
  await positionRouter.setDelayValues(0, 0, 100)
  await router.addPlugin(positionRouter.address)
  await shortsTracker.setHandler(positionRouter.address, true)
  return {positionRouter: positionRouter, router: router, vault: vault, usdg: usdg, positionUtils: positionUtils}
}

async function configureVault(vault, router, usdg, weth, atom, fastPriceFeed, positionRouter) {
  const vaultPriceFeed = await deployContract("VaultPriceFeed", [])

  await vault.initialize(
    router.address, // _router
    usdg.address, // _usdg
    vaultPriceFeed.address, // _priceFeed
    toUsd(5), // _liquidationFeeUsd
    600, // _fundingRateFactor
    600 // _stableFundingRateFactor
  )

  const wethPriceFeed = await deployContract("PriceFeed", [])
  const atomPriceFeed = await deployContract("PriceFeed", [])

  await vaultPriceFeed.setTokenConfig(
    weth.address, // _token
    wethPriceFeed.address, // _priceFeed
    8, // _priceDecimals
    false // _isStrictStable
  )

  await vaultPriceFeed.setTokenConfig(
    atom.address, // _token
    atomPriceFeed.address, // _priceFeed
    8, // _priceDecimals
    false // _isStrictStable
  )

  const prices = await fetchPrices(["ETH", "ATOM"])
  await wethPriceFeed.setLatestAnswer(toChainlinkPrice(prices["ETH"].value))
  await atomPriceFeed.setLatestAnswer(toChainlinkPrice(prices["ATOM"].value))

  await vault.setTokenConfig(
    weth.address, // _token,
    TOKEN_DECIMALS, // _tokenDecimals,
    10000, // _tokenWeight,
    75, // _minProfitBps,
    0, // _maxUsdgAmount,
    false, // _isStable,
    true // _isShortable
  )

  await vault.setTokenConfig(
    atom.address, // _token,
    TOKEN_DECIMALS, // _tokenDecimals,
    10000, // _tokenWeight,
    75, // _minProfitBps,
    0, // _maxUsdgAmount,
    false, // _isStable,
    true // _isShortable
  )

  const vaultUtils = await deployContract("VaultUtils", [vault.address])
  await vault.setVaultUtils(vaultUtils.address)

  await weth.mint(vault.address, expandDecimals(30, TOKEN_DECIMALS))
  await vault.buyUSDG(weth.address, USER_1.address)

  await fastPriceFeed.setVaultPriceFeed(vaultPriceFeed.address)
  await vaultPriceFeed.setSecondaryPriceFeed(fastPriceFeed.address)

  const timelock = await deployContract("Timelock", [
    DEPLOYER.address, // _admin
    5 * 24 * 60 * 60, // _buffer
    ethers.constants.AddressZero, // _tokenManager
    ethers.constants.AddressZero, // _mintReceiver
    ethers.constants.AddressZero, // _glpManager
    ethers.constants.AddressZero, // _rewardRouter
    expandDecimals(1000, TOKEN_DECIMALS), // _maxTokenSupply
    10, // marginFeeBasisPoints 0.1%
    500, // maxMarginFeeBasisPoints 5%
  ])
  await vault.setGov(timelock.address)

  await timelock.setContractHandler(positionRouter.address, true)
  await timelock.setShouldToggleIsLeverageEnabled(true)
}

module.exports = {
  deployAll,
  registerPriceFeedKeepers,
  USER_1,
  POSITION_ROUTER_EXECUTION_FEE,
  TOKEN_DECIMALS
}
