FROM node:20-slim

WORKDIR /app

# Install dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built app
COPY dist/ ./dist/
COPY db/ ./db/
COPY contracts/ ./contracts/
COPY api/ ./api/
COPY data/ ./data/

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=./data/emotiecheck.db
ENV APP_ID=emotiecheck-app
ENV APP_SECRET=emotiecheck-secret

EXPOSE 3000

CMD ["node", "dist/boot.js"]
