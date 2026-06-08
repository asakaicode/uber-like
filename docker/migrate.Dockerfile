FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @uber-like/shared build \
 && pnpm --filter @uber-like/database generate \
 && pnpm --filter @uber-like/database build

CMD ["sh", "-c", "pnpm --filter @uber-like/database push && pnpm --filter @uber-like/database seed"]
