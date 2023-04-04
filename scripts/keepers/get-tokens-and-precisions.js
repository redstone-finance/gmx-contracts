const { getFastPriceFeedContract } = require("./common");

// Usage: npx hardhat run scripts/keepers/get-tokens-and-precisions.js

main();

async function main() {
  const contract = await getFastPriceFeedContract();

  let shouldContinue = true, tokenIndex = 0;
  const tokensWithPrecisions = [];

  while (shouldContinue) {
    try {
      console.log(`Trying to get token details at index ${tokenIndex}`);
      const token = await contract.tokens(tokenIndex);
      const precision = (await contract.tokenPrecisions(tokenIndex)).toNumber();
      console.log({ token, precision });
      tokensWithPrecisions.push({ token, precision });
      tokenIndex++;
    } catch (e) {
      console.log(`Looks like we reached the end of the list of tokens. Stopping...`);
      shouldContinue = false;
    }
  }

  console.log(tokensWithPrecisions);
}
