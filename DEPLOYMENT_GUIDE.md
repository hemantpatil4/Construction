# 🚀 OpenShift Deployment Guide — Construction App

> **Full-Stack deployment of React + .NET 8 Microservices + SQL Server on Red Hat OpenShift (ARO)**

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Login to OpenShift](#step-1--login-to-openshift)
4. [Step 2 — Create a Project (Namespace)](#step-2--create-a-project-namespace)
5. [Step 3 — Create Dockerfiles](#step-3--create-dockerfiles)
6. [Step 4 — Create Frontend Nginx Config](#step-4--create-frontend-nginx-config)
7. [Step 5 — Create .dockerignore Files](#step-5--create-dockerignore-files)
8. [Step 6 — Fix Frontend API Base URL for Production](#step-6--fix-frontend-api-base-url-for-production)
9. [Step 7 — Build Docker Images (linux/amd64)](#step-7--build-docker-images-linuxamd64)
10. [Step 8 — Push Images to Quay.io](#step-8--push-images-to-quayio)
11. [Step 9 — Create OpenShift Deployment Manifest](#step-9--create-openshift-deployment-manifest)
12. [Step 10 — Create Image Pull Secret](#step-10--create-image-pull-secret)
13. [Step 11 — Grant MSSQL Security Permissions](#step-11--grant-mssql-security-permissions)
14. [Step 12 — Deploy Everything](#step-12--deploy-everything)
15. [Step 13 — Verify Deployment](#step-13--verify-deployment)
16. [Step 14 — Connect to MSSQL Database](#step-14--connect-to-mssql-database)
17. [Troubleshooting](#troubleshooting)
18. [Useful Commands Cheat Sheet](#useful-commands-cheat-sheet)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenShift Cluster (ARO)                   │
│                   Project: grafana-test                      │
│                                                             │
│  ┌──────────┐     ┌────────────────┐  ┌──────────────────┐ │
│  │ Frontend  │────▶│  Auth Service   │  │ Building Service │ │
│  │ (Nginx)   │────▶│  (.NET 8)      │  │ (.NET 8)         │ │
│  │ Port 8080 │     │  Port 8080     │  │ Port 8080        │ │
│  └─────┬─────┘     └───────┬────────┘  └────────┬─────────┘ │
│        │                   │                     │           │
│        │  Route (HTTPS)    └──────────┬──────────┘           │
│        │                              │                      │
│  ┌─────┴─────────────────────────┐    │                      │
│  │  frontend-route-grafana-test  │    ▼                      │
│  │  .apps.jm3zhi0ir56df50fef    │  ┌──────────┐             │
│  │  .centralindia.aroapp.io     │  │  MSSQL   │             │
│  └───────────────────────────────┘  │  Server  │             │
│                                     │Port 1433 │             │
│                                     │  + PVC   │             │
│                                     └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

| Component        | Image                                              | Internal Port |
| ---------------- | -------------------------------------------------- | ------------- |
| Frontend (React) | `quay.io/vinayakv2m/finiq/frontend:latest`         | 8080          |
| Auth Service     | `quay.io/vinayakv2m/finiq/auth-service:latest`     | 8080          |
| Building Service | `quay.io/vinayakv2m/finiq/building-service:latest` | 8080          |
| SQL Server 2022  | `mcr.microsoft.com/mssql/server:2022-latest`       | 1433          |

---

## 2. Prerequisites

- **Docker Desktop** installed and running
- **oc** CLI (OpenShift Client) installed
- **Quay.io** account (or any container registry)
- Access to an **OpenShift cluster** (ARO / OKD / CRC)

---

## Step 1 — Login to OpenShift

```bash
# Login to the OpenShift cluster
oc login https://api.jm3zhi0ir56df50fef.centralindia.aroapp.io:6443 \
  -u kube:admin \
  -p <your-password>

# Verify login
oc whoami
# Output: kube:admin
```

---

## Step 2 — Create a Project (Namespace)

```bash
# Create a new project
oc new-project grafana-test

# Verify
oc project
# Output: Using project "grafana-test"
```

---

## Step 3 — Create Dockerfiles

### 3.1 — Auth Service (`Backend/BuildingFlatService/Dockerfile.auth`)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Construction.sln .
COPY src/AuthService/AuthService.API/AuthService.API.csproj src/AuthService/AuthService.API/
COPY src/AuthService/AuthService.Application/AuthService.Application.csproj src/AuthService/AuthService.Application/
COPY src/AuthService/AuthService.Domain/AuthService.Domain.csproj src/AuthService/AuthService.Domain/
COPY src/AuthService/AuthService.Infrastructure/AuthService.Infrastructure.csproj src/AuthService/AuthService.Infrastructure/
COPY src/BuildingFlatService/BuildingFlatService.API/BuildingFlatService.API.csproj src/BuildingFlatService/BuildingFlatService.API/
COPY src/BuildingFlatService/BuildingFlatService.Application/BuildingFlatService.Application.csproj src/BuildingFlatService/BuildingFlatService.Application/
COPY src/BuildingFlatService/BuildingFlatService.Domain/BuildingFlatService.Domain.csproj src/BuildingFlatService/BuildingFlatService.Domain/
COPY src/BuildingFlatService/BuildingFlatService.Infrastructure/BuildingFlatService.Infrastructure.csproj src/BuildingFlatService/BuildingFlatService.Infrastructure/

RUN dotnet restore
COPY . .

WORKDIR /src/src/AuthService/AuthService.API
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "AuthService.API.dll"]
```

### 3.2 — Building Service (`Backend/BuildingFlatService/Dockerfile.building`)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Construction.sln .
COPY src/AuthService/AuthService.API/AuthService.API.csproj src/AuthService/AuthService.API/
COPY src/AuthService/AuthService.Application/AuthService.Application.csproj src/AuthService/AuthService.Application/
COPY src/AuthService/AuthService.Domain/AuthService.Domain.csproj src/AuthService/AuthService.Domain/
COPY src/AuthService/AuthService.Infrastructure/AuthService.Infrastructure.csproj src/AuthService/AuthService.Infrastructure/
COPY src/BuildingFlatService/BuildingFlatService.API/BuildingFlatService.API.csproj src/BuildingFlatService/BuildingFlatService.API/
COPY src/BuildingFlatService/BuildingFlatService.Application/BuildingFlatService.Application.csproj src/BuildingFlatService/BuildingFlatService.Application/
COPY src/BuildingFlatService/BuildingFlatService.Domain/BuildingFlatService.Domain.csproj src/BuildingFlatService/BuildingFlatService.Domain/
COPY src/BuildingFlatService/BuildingFlatService.Infrastructure/BuildingFlatService.Infrastructure.csproj src/BuildingFlatService/BuildingFlatService.Infrastructure/

RUN dotnet restore
COPY . .

WORKDIR /src/src/BuildingFlatService/BuildingFlatService.API
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "BuildingFlatService.API.dll"]
```

### 3.3 — Frontend (`Frontend/React/construction-app/Dockerfile`)

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# OpenShift runs as non-root — fix permissions
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

---

## Step 4 — Create Frontend Nginx Config

**File:** `Frontend/React/construction-app/nginx.conf`

> Nginx acts as both a static file server and a **reverse proxy** to the backend services.

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Auth & Users → auth-service
    location /api/Auth {
        proxy_pass http://auth-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /api/Users {
        proxy_pass http://auth-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Buildings & Flats → building-service
    location /api/Buildings {
        proxy_pass http://building-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /api/Flats {
        proxy_pass http://building-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Step 5 — Create .dockerignore Files

### 5.1 — Backend (`Backend/BuildingFlatService/.dockerignore`)

```
**/bin/
**/obj/
**/node_modules/
**/.git
**/.vs
**/.vscode
**/Dockerfile*
**/README.md
```

### 5.2 — Frontend (`Frontend/React/construction-app/.dockerignore`)

```
node_modules
dist
.git
.env
.env.local
.env.*.local
```

> ⚠️ **Critical:** The `.env` file contains `VITE_API_BASE_URL=http://localhost:5001` for local dev. We MUST exclude it from Docker builds, otherwise Vite bakes `localhost:5001` into the production JS bundle.

---

## Step 6 — Fix Frontend API Base URL for Production

### 6.1 — Create `.env.production`

**File:** `Frontend/React/construction-app/.env.production`

```
VITE_API_BASE_URL=
```

> Vite uses `.env.production` during `npm run build`. Setting it to empty means all API calls go to relative paths (`/api/Auth/login`, `/api/Buildings`, etc.), which Nginx then reverse-proxies to the backend services.

### 6.2 — Verify `api.ts`

**File:** `src/services/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL, // Empty in production → relative paths
});
```

---

## Step 7 — Build Docker Images (linux/amd64)

> ⚠️ **Must use `--platform linux/amd64`** — Mac builds ARM images by default, but OpenShift nodes run x86_64.

```bash
# ── Auth Service ──
cd Backend/BuildingFlatService
docker build --platform linux/amd64 --no-cache \
  -f Dockerfile.auth \
  -t quay.io/vinayakv2m/finiq/auth-service:latest .

# ── Building Service ──
docker build --platform linux/amd64 --no-cache \
  -f Dockerfile.building \
  -t quay.io/vinayakv2m/finiq/building-service:latest .

# ── Frontend ──
cd ../../Frontend/React/construction-app
docker build --platform linux/amd64 --no-cache \
  -t quay.io/vinayakv2m/finiq/frontend:latest .
```

---

## Step 8 — Push Images to Quay.io

```bash
# Login to Quay.io
docker login quay.io -u vinayakv2m

# Push all 3 images
docker push quay.io/vinayakv2m/finiq/auth-service:latest
docker push quay.io/vinayakv2m/finiq/building-service:latest
docker push quay.io/vinayakv2m/finiq/frontend:latest
```

---

## Step 9 — Create OpenShift Deployment Manifest

**File:** `openshift-deploy.yaml`

This single YAML contains everything:

- **Secret** — DB passwords, JWT secret, connection strings
- **PersistentVolumeClaim** — 5Gi storage for MSSQL data
- **4 Deployments** — mssql, auth-service, building-service, frontend
- **4 Services** — internal ClusterIP services for each
- **1 Route** — exposes frontend externally with HTTPS

> The full YAML is in the repo at `openshift-deploy.yaml` (424 lines).

**Key patterns used:**

```yaml
# Image pull from private registry
imagePullSecrets:
  - name: quayredirect

# Tolerate node taints (specific to HDFC-POC cluster)
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "hdfc"
    effect: "NoSchedule"

# Prefer specific nodes
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: hdfc
              operator: In
              values: ["true"]

# Connection strings injected as env vars
env:
  - name: ConnectionStrings__AuthDb
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: auth-db-connection
```

---

## Step 10 — Create Image Pull Secret

```bash
# Create docker-registry secret for Quay.io
oc create secret docker-registry quayredirect \
  --docker-server=quay.io \
  --docker-username=vinayakv2m \
  --docker-password='<your-quay-password>' \
  -n grafana-test
```

---

## Step 11 — Grant MSSQL Security Permissions

> OpenShift runs containers as random non-root UIDs. SQL Server needs root-level access.

```bash
# Grant anyuid SCC to the default service account
oc adm policy add-scc-to-user anyuid \
  system:serviceaccount:grafana-test:default
```

The MSSQL deployment also uses an **init container** to fix file permissions:

```yaml
initContainers:
  - name: init-permissions
    image: "mcr.microsoft.com/mssql/server:2022-latest"
    command:
      [
        "sh",
        "-c",
        "chown -R 10001:0 /var/opt/mssql && chmod -R 775 /var/opt/mssql",
      ]
    volumeMounts:
      - name: mssql-data
        mountPath: /var/opt/mssql
securityContext:
  fsGroup: 10001
```

---

## Step 12 — Deploy Everything

```bash
# Apply the entire manifest
oc apply -f openshift-deploy.yaml

# Watch pods come up
oc get pods -n grafana-test -w
```

Expected output (after ~1–2 minutes):

```
NAME                                READY   STATUS    AGE
mssql-56cb48898b-xxxxx              1/1     Running   2m
auth-service-885665849-xxxxx        1/1     Running   1m
building-service-594fb8657d-xxxxx   1/1     Running   1m
frontend-69b489fd94-xxxxx           1/1     Running   1m
```

---

## Step 13 — Verify Deployment

### 13.1 — Check all pods

```bash
oc get pods -n grafana-test
```

### 13.2 — Check services

```bash
oc get svc -n grafana-test
```

### 13.3 — Check route (external URL)

```bash
oc get route -n grafana-test
```

Output:

```
NAME              HOST/PORT                                                                  PORT
frontend-route    frontend-route-grafana-test.apps.jm3zhi0ir56df50fef.centralindia.aroapp.io  8080-tcp
```

### 13.4 — Check logs

```bash
# Auth Service logs (should show "Applying AuthDb migrations...")
oc logs deployment/auth-service -n grafana-test

# Building Service logs
oc logs deployment/building-service -n grafana-test

# MSSQL logs
oc logs deployment/mssql -n grafana-test
```

### 13.5 — Open the app

```
https://frontend-route-grafana-test.apps.jm3zhi0ir56df50fef.centralindia.aroapp.io
```

---

## Step 14 — Connect to MSSQL Database

### Option A: From Pod Terminal (sqlcmd)

```bash
# Get the MSSQL pod name
oc get pods -n grafana-test -l app=mssql

# Open interactive SQL session
oc exec -it <mssql-pod-name> -n grafana-test -- \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong!Pass123' -C

# Example queries inside sqlcmd:
# SELECT name FROM sys.databases;
# GO
# USE ConstructionAuthDb;
# SELECT * FROM Users;
# GO
```

### Option B: Port-Forward + DBeaver

```bash
# Forward MSSQL port to your local machine
oc port-forward deployment/mssql 1433:1433 -n grafana-test
```

Then in **DBeaver**:
| Field | Value |
|-----------|-------------------------|
| Host | `localhost` |
| Port | `1433` |
| Database | `ConstructionAuthDb` or `ConstructionBuildingFlatDb` |
| Username | `sa` |
| Password | `YourStrong!Pass123` |
| SSL | Trust Server Certificate ✅ |

> ⚠️ Keep the `oc port-forward` terminal running while using DBeaver.

---

## Troubleshooting

### Pod stuck in `CrashLoopBackOff`

```bash
# Check logs
oc logs <pod-name> -n grafana-test

# Check events
oc describe pod <pod-name> -n grafana-test
```

### Image pull errors (`ImagePullBackOff`)

```bash
# Verify secret exists
oc get secret quayredirect -n grafana-test

# Recreate if needed
oc delete secret quayredirect -n grafana-test
oc create secret docker-registry quayredirect \
  --docker-server=quay.io \
  --docker-username=vinayakv2m \
  --docker-password='<password>' \
  -n grafana-test
```

### MSSQL permission errors

```bash
oc adm policy add-scc-to-user anyuid system:serviceaccount:grafana-test:default
oc rollout restart deployment/mssql -n grafana-test
```

### Frontend still showing localhost API calls

```bash
# Verify no localhost in the built JS
oc exec deployment/frontend -n grafana-test -- \
  sh -c 'grep -o "localhost:[0-9]*" /usr/share/nginx/html/assets/*.js'

# If found, rebuild with --no-cache and ensure .env.production exists
```

### Database not created

The services auto-run `db.Database.Migrate()` at startup. If it fails:

```bash
# Check auth-service logs for migration errors
oc logs deployment/auth-service -n grafana-test | grep -i migrat

# Restart to retry
oc rollout restart deployment/auth-service -n grafana-test
```

---

## Useful Commands Cheat Sheet

| Action               | Command                                                      |
| -------------------- | ------------------------------------------------------------ |
| Login to cluster     | `oc login <server-url> -u <user> -p <password>`              |
| Switch project       | `oc project grafana-test`                                    |
| List all pods        | `oc get pods -n grafana-test`                                |
| View pod logs        | `oc logs deployment/<name> -n grafana-test`                  |
| Follow live logs     | `oc logs -f deployment/<name> -n grafana-test`               |
| Restart a deployment | `oc rollout restart deployment/<name> -n grafana-test`       |
| Exec into pod        | `oc exec -it <pod-name> -n grafana-test -- /bin/sh`          |
| Port-forward MSSQL   | `oc port-forward deployment/mssql 1433:1433 -n grafana-test` |
| Check route          | `oc get route -n grafana-test`                               |
| Check events         | `oc get events -n grafana-test --sort-by='.lastTimestamp'`   |
| Scale deployment     | `oc scale deployment/<name> --replicas=2 -n grafana-test`    |
| Delete everything    | `oc delete -f openshift-deploy.yaml`                         |
| Redeploy everything  | `oc apply -f openshift-deploy.yaml`                          |
| Build image (amd64)  | `docker build --platform linux/amd64 --no-cache -t <tag> .`  |
| Push image           | `docker push <tag>`                                          |

---

## 📌 Key Lessons Learned

1. **Always build with `--platform linux/amd64`** on Mac — OpenShift nodes are x86_64.
2. **Exclude `.env` from Docker builds** — Vite bakes env vars into the JS bundle at build time.
3. **Use `.env.production`** with empty `VITE_API_BASE_URL=` so API calls use relative paths.
4. **MSSQL needs `anyuid` SCC** + init container for file permissions on OpenShift.
5. **EF Core auto-migration** (`db.Database.Migrate()`) at startup creates databases & tables automatically.
6. **`EnableRetryOnFailure`** handles transient SQL connection failures when MSSQL is still starting.
7. **Nginx reverse proxy** eliminates CORS issues — frontend and API share the same origin.

---

_Last updated: March 12, 2026_
