FROM ghcr.io/pnpm/pnpm:11.2.2 AS base
RUN pnpm runtime set node 20 -g
WORKDIR /piximi
COPY . .

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --prod --no-frozen-lockfile --dangerously-allow-all-builds

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --no-frozen-lockfile --dangerously-allow-all-builds
RUN pnpm run build

FROM base
COPY --from=prod-deps /piximi/node_modules /piximi/node_modules
COPY --from=build /piximi/dist /piximi/dist
EXPOSE 3000
CMD ["pnpm", "start", "--host"]