FROM --platform=linux/amd64 node:16 as build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY env-template.json env.json
COPY . .
RUN npx hardhat compile

EXPOSE 3000
CMD ["node", "scripts/redstone/keeper/keeper.js"]