.PHONY: test

deploy:
	npx hardhat run scripts/redstone/deploy-all.js --network localhost

demo:
	npx hardhat run scripts/redstone/redstone-keeper-demo.js --network localhost

node:
	npx hardhat node

test:
	npx hardhat test
