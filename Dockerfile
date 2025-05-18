# 1. Builder: instala build tools y compila bcrypt
FROM node:22 AS builder
WORKDIR /usr/src/builder

# 1.1 Instala herramientas para compilar módulos nativos (Debian)
RUN apt-get update && apt-get install -y python3 make g++

# 1.2 Activa pnpm y copia solo el package manifest para cachear install
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 1.3 Reconstruye bcrypt desde fuente con npm
RUN npm rebuild bcrypt --build-from-source

# 1.3 Copia el resto del código y genera build
COPY . .
RUN pnpm build

# 2. Runner: stage ligero para producción
FROM node:22-alpine AS runner
WORKDIR /home/app

# 2.1 Crea un usuario no privilegiado
RUN adduser --disabled-password --home /home/app --gecos '' app \
    && chown -R app /home/app

USER app

# 2.2 Copia únicamente el resultado compilado y los node_modules ya preparados
COPY --from=builder /usr/src/builder/dist .

# Install production dependencies
RUN npm install --production

# Command to run the app
CMD [ "npm", "start" ]