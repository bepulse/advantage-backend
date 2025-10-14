# ---------- Build ----------
FROM --platform=linux/amd64 node:22-alpine AS builder
WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

RUN npm run build

# ---------- Runtime ----------
FROM --platform=linux/amd64 node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV RUN_MIGRATIONS=false

RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY start.sh ./start.sh

RUN chmod +x start.sh

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3085

CMD ["./start.sh"]
