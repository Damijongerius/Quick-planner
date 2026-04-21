# Deploying to ARM Devices

This guide explains how to build and deploy Quick-planner for ARM architectures (e.g., Apple Silicon, Raspberry Pi, AWS Graviton).

## Prerequisites
- Docker and Docker Compose installed.
- (If cross-building) **Docker Buildx** and **QEMU** enabled.

---

## 1. Deploying Directly on an ARM Device
If you are running the commands on the target ARM device itself:

```bash
# Build and start
docker compose -f docker-compose.arm.yml up --build -d
```

## 2. Cross-Building for ARM from x86 (Windows/Linux)
If you want to build the image on your PC and then move it to an ARM device:

### Step 2a: Create a Buildx Builder (One-time)
```bash
docker buildx create --name arm-builder --use
docker buildx inspect --bootstrap
```

### Step 2b: Build the Image
```bash
# From the project root
docker buildx build --platform linux/arm64 -t your-username/quick-planner-app:arm64 ./services/app --push
```
*Note: Using `--push` will push it to Docker Hub. If you want to load it locally, use `--load` (but this only works if host and target platforms match or if using a single platform).*

## 3. Configuration Notes
The `docker-compose.arm.yml` file includes:
- `platform: linux/arm64`: Forces Docker to use the ARM64 version of images.
- Multi-arch base images: `node:20-alpine` and `postgres:16-alpine` both natively support ARM.
- Prisma Engines: The Dockerfile automatically generates the correct Prisma engines for the target architecture during the build process.

---

## Troubleshooting
### Error: `requested access to the resource is denied`
Login to Docker Hub first:
```bash
docker login
```

### Prisma Engines not found
Ensure `npx prisma generate` runs inside the Docker container as specified in the [Dockerfile](file:///c:/Users/damia/WebstormProjects/Quick-planner/services/app/Dockerfile).
