# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built React app
COPY --from=build /app/dist /usr/share/nginx/html
# OpenShift runs as non-root, fix permissions
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
