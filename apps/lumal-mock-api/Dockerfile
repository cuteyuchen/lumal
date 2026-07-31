FROM node:22-bookworm-slim AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/lumal-mock-api ./apps/lumal-mock-api

RUN pnpm install --frozen-lockfile
# 必须显式指定 node-server preset：nitro.config.ts 的默认 preset 是 'vercel'，
# 它产出 .vercel/output 而非下方 COPY 需要的 .output，会导致镜像构建失败。
RUN pnpm --filter lumal-mock-api build:test

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5320

COPY --from=build /workspace/apps/lumal-mock-api/.output ./.output

EXPOSE 5320
CMD ["node", ".output/server/index.mjs"]
