# Deploying to Coolify

Coolify doesn't support direct file upload of source code. Two paths:

---

## Option A — GitHub repo → Coolify (easiest, ~5 min)

1. Create a free GitHub account (if you don't have one): https://github.com
2. Create a **new private repo**, e.g. `meeting-app`
3. Upload these files to the repo (drag & drop in the GitHub UI):
   - `server.js`
   - `package.json`
   - `Dockerfile`
   - `.dockerignore`
   - `public/index.html`
4. In Coolify → **New Resource → Git Repository**
5. Connect your GitHub account, select the repo
6. Coolify detects the Dockerfile automatically — hit Deploy
7. Add a **persistent volume**: `/data` (stores the SQLite database)
8. Set environment variable if needed: `PORT=3000`

Every time you push to GitHub, Coolify auto-redeploys.

---

## Option B — Build Docker image locally, push to Docker Hub (no GitHub needed)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Free Docker Hub account: https://hub.docker.com

### Steps

Open a terminal in this folder (`Attendance App`):

```bash
# 1. Build the image (replace YOUR_USERNAME with your Docker Hub username)
docker build -t YOUR_USERNAME/meeting-app:latest .

# 2. Log in to Docker Hub
docker login

# 3. Push
docker push YOUR_USERNAME/meeting-app:latest
```

Then in Coolify → **New Resource → Docker Image**:
- Image: `YOUR_USERNAME/meeting-app:latest`
- Port: `3000`
- Add volume: `/data`

To update later, rebuild and push the same tag — then click "Redeploy" in Coolify.

---

## Coolify volume setup (both options)

In the service settings → **Storage**:
- Source: leave blank (Coolify manages it)
- Destination: `/data`

This is where the SQLite file lives. It persists across deploys and container restarts.

---

## Test locally before deploying

```bash
# In the Attendance App folder:
npm install
node server.js
# Open http://localhost:3000
```

Or with Docker:

```bash
docker build -t meeting-app .
docker run -p 3000:3000 -v meeting-data:/data meeting-app
# Open http://localhost:3000
```
