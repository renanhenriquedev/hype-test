FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package*.json ./
RUN npm i --omit=dev

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4001

CMD ["node", "dist/main.js"]
