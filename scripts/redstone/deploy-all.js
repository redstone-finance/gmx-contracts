const {deployAll} = require("./setup-common");

async function main() {
  const deployResult = await deployAll()
  Object.keys(deployResult).forEach((key) => {
    console.log(`${key} address - ${deployResult[key].address}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
