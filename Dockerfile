# ==============================================================================
# Stage 1: Build React + Vite static bundle inside Node.js container
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# 1. Copy dependency manifests in a separate layer to leverage Docker cache
COPY package.json package-lock.json ./

# 2. Perform a clean install of exact dependencies from package-lock.json
RUN npm ci

# 3. Copy application source code and compile production bundle into /app/dist
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production runtime with lightweight Nginx Alpine (~25MB)
# ==============================================================================
FROM nginx:1.27-alpine AS runtime

# 1. Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# 2. Copy compiled static bundle from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# 3. Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 4. Built-in container healthcheck for Docker Engine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]