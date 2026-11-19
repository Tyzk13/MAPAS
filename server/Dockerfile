# Servidor de sincronização do mapa 3D (Render, Fly.io, VPS com Docker…)
#   docker build -t mapa-sync server/
#   docker run -p 8080:8080 -v mapa-dados:/data -e EDIT_KEY=segredo mapa-sync
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY servidor-sync.mjs ./
ENV PORT=8080 DATA_DIR=/data NODE_ENV=production
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/saude || exit 1
CMD ["node", "servidor-sync.mjs"]
