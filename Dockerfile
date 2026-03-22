# 1. Builder: instala build tools y compila
FROM node:22 AS builder
WORKDIR /usr/src/builder

# 1.1 Instala herramientas para compilar módulos nativos (Debian)
RUN apt-get update && apt-get install -y python3 make g++

# 1.2 Activa pnpm y copia workspace manifests para cachear install
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/rpc/package.json packages/rpc/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN pnpm install --frozen-lockfile

# 1.3 Copia el resto del código y genera build
COPY . .
RUN pnpm -C packages/shared build && pnpm -C packages/rpc build && pnpm -C packages/frontend build && pnpm -C packages/backend build

# 2. Runner: stage ligero para producción
FROM node:22-alpine AS runner
WORKDIR /home/app

# 2.1 Crea un usuario no privilegiado
RUN adduser --disabled-password --home /home/app --gecos '' app \
    && chown -R app /home/app

USER app

# 2.2 Copia únicamente el resultado compilado
COPY --from=builder /usr/src/builder/packages/backend/dist .

# 2.3 Configura GitHub Packages registry y descarga dependencias
ARG NODE_AUTH_TOKEN
RUN echo "@mapineda48:registry=https://npm.pkg.github.com" > .npmrc \
    && echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
    && npm install --production \
    && rm -f .npmrc

# Command to run the app
CMD [ "npm", "start" ]
