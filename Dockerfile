FROM node:22-alpine

# Build tools for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Install @mapineda48/agape-app globally from GitHub Packages
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    echo "@mapineda48:registry=https://npm.pkg.github.com" > ~/.npmrc \
    && echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN)" >> ~/.npmrc \
    && npm install -g @mapineda48/agape-app \
    && rm -f ~/.npmrc

# Run as unprivileged user
RUN adduser --disabled-password --home /home/app --gecos '' app
USER app
WORKDIR /home/app

EXPOSE 3000

CMD ["agape-app"]
