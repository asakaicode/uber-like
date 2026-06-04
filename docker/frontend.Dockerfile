# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS builder
ARG APP_NAME=user
ARG VITE_API_URL=http://localhost:4000/graphql
ARG VITE_WS_URL=ws://localhost:4000/graphql

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/web/package.json ./packages/web/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
RUN pnpm install --frozen-lockfile

COPY packages/web ./packages/web
COPY apps/${APP_NAME} ./apps/${APP_NAME}

RUN pnpm --filter @uber-like/${APP_NAME} build

FROM nginx:1.27-alpine AS runner
ARG APP_NAME=user
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html
EXPOSE 80
