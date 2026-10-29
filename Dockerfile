# ============================================================
# AI-Generated Dockerfile
# Language: nodejs | Framework: express
# Builder: node:20-slim → Runtime: node:20-slim
# ============================================================

FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .


FROM node:20-slim
WORKDIR /app
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup appuser
COPY --from=builder --chown=appuser:appgroup /app ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["npm", "start"]