# ---------- build ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npx prisma generate

COPY src ./src/
RUN npm run build

# ---------- production ----------
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY prisma.config.ts ./

EXPOSE 3333

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
