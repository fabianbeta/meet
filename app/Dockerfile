FROM node:20-alpine

# better-sqlite3 needs python + build tools for native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public/ ./public/

# SQLite data lives on a persistent volume
RUN mkdir -p /data
VOLUME ["/data"]

ENV PORT=3000
ENV DB_PATH=/data/board.db

EXPOSE 3000

CMD ["node", "server.js"]
