# Stage 1: Build environment
FROM node:22.11.0-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm run build

# Stage 2: Production image
FROM node:22.11.0-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./.env

ENV NODE_ENV=production
ENV PORT=3008
EXPOSE $PORT

# Install curl for healthcheck
RUN apk add --no-cache curl

RUN chown -R node:node /app
USER node

CMD ["node", "dist/app.js"]