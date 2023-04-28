const {deployAll} = require("./setup-common");

async function main() {
  await deployAll()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
