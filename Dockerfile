FROM node:24

WORKDIR /app

COPY package.json ./

RUN npm i

COPY . .

ENV PORT=9000

EXPOSE 9000

RUN yarn build

CMD ["npm", "start"]