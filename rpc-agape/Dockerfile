# Builder
FROM node:20 AS builder 

# Set environment variable to disable source map generation
ENV GENERATE_SOURCEMAP 'false'

# Create app directory
WORKDIR /usr/src/builder

# Install pnpm
RUN corepack enable

# Copy app
COPY . .

# Install dependencies
# Ensure that the structure of the packages directory is preserved
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm build

# Production
FROM node:20-alpine

# Set environment variable for production
# ENV NODE_ENV 'production'

# Create app directory and set permissions
WORKDIR /home/app
RUN adduser --disabled-password --home /home/app --gecos '' app \
    && chown -R app /home/app

USER app

# Copy built files from builder stage
COPY --from=builder /usr/src/builder/dist .

# Install production dependencies
RUN npm install --production

# Command to run the app
CMD [ "npm", "start" ]
