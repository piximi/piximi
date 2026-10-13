# syntax=docker/dockerfile:1
FROM ghcr.io/pnpm/pnpm:11.2.2 AS build
RUN pnpm runtime set node 20 -g
WORKDIR /piximi
COPY . .
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --frozen-lockfile --dangerously-allow-all-builds
RUN pnpm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /piximi/dist /usr/share/nginx/html
EXPOSE 3000
