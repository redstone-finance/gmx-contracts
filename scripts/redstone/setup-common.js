const {deployContract} = require("../shared/helpers");
const {expandDecimals} = require("../../test/shared/utilities");
const {toUsd} = require("../../test/shared/units");
const {toChainlinkPrice} = require("../../test/shared/chainlink");

const POSITION_ROUTER_EXECUTION_FEE = 4000

const localhostProvider = new ethers.providers.JsonRpcProvider("http://localhost:8545")

//TODO: change updater_1 to 2nd (as its deployer)

// Hardhat Account #0
const DEPLOYER = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80").connect(localhostProvider)
// Hardhat Account #1
const UPDATER_1 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d").connect(localhostProvider)
// Hardhat Account #2
const UPDATER_2 = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a").connect(localhostProvider)
// Hardhat Account #3
const USER_1 = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6").connect(localhostProvider)
// Hardhat Account #19
const TOKEN_MANAGER = new ethers.Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e").connect(localhostProvider)


async function deployAll() {
  const {fastPriceFeed} = await setupFastPriceFeed()
  const {weth, atom} = await deployAndMintTokens()
  const {positionRouter, router, vault} = await setupPositionRouter(fastPriceFeed, weth, atom)
  return {positionRouter: positionRouter, router: router, fastPriceFeed: fastPriceFeed, vault: vault, weth: weth, atom: atom}
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
  await fastPriceFeed.initialize(2, [], [UPDATER_1.address, UPDATER_2.address])
  await fastPriceFeed.setMaxTimeDeviation(1000)
  await fastPriceFeed.connect(TOKEN_MANAGER).setPriceDataInterval(1)
  await fastPriceEvents.setIsPriceFeed(fastPriceFeed.address, true)
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

async function addFastPriceFeedTokens(fastPriceFeed, tokens) {
  const addresses = tokens.map(token => token.address)
  const precisions = tokens.map(token => token.precision)
  await fastPriceFeed.setTokens(addresses, precisions)
}

async function setupPositionRouter(fastPriceFeed, weth, atom) {
  const vault = await deployContract("Vault", [])
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
  await positionRouter.setDelayValues(0, 0, 100)
  await router.addPlugin(positionRouter.address)
  await shortsTracker.setHandler(positionRouter.address, true)

  //TODO: extract to function

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

  //TODO: set by redstone value
  await wethPriceFeed.setLatestAnswer(toChainlinkPrice(1920.711))
  await atomPriceFeed.setLatestAnswer(toChainlinkPrice(11.665))

  await vault.setTokenConfig(
    weth.address, // _token,
    18, // _tokenDecimals,
    10000, // _tokenWeight,
    75, // _minProfitBps,
    0, // _maxUsdgAmount,
    false, // _isStable,
    true // _isShortable
  )

  await vault.setTokenConfig(
    atom.address, // _token,
    18, // _tokenDecimals,
    10000, // _tokenWeight,
    75, // _minProfitBps,
    0 , // _maxUsdgAmount,
    false, // _isStable,
    true // _isShortable
  )

  const vaultUtils = await deployContract("VaultUtils", [vault.address])
  await vault.setVaultUtils(vaultUtils.address)

  await weth.mint(vault.address, expandDecimals(30, 18))
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
    expandDecimals(1000, 18), // _maxTokenSupply
    10, // marginFeeBasisPoints 0.1%
    500, // maxMarginFeeBasisPoints 5%
  ])
  await vault.setGov(timelock.address)

  await timelock.setContractHandler(positionRouter.address, true)
  await timelock.setShouldToggleIsLeverageEnabled(true)

  return {positionRouter: positionRouter, router: router, vault: vault}
}

module.exports = {
  deployAll,
  addFastPriceFeedUpdaters,
  addFastPriceFeedTokens,
  UPDATER_1,
  UPDATER_2,
  USER_1,
  POSITION_ROUTER_EXECUTION_FEE
}
