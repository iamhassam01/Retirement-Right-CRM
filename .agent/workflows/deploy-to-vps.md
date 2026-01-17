---
description: Deploy changes to VPS - commit, push, transfer files, rebuild Docker container
---

# Deploy to VPS Workflow

This workflow commits all changes, pushes to GitHub, transfers modified files to VPS, and rebuilds the Docker container.

## Prerequisites
- VPS: 72.62.160.90
- App Directory: /opt/retirement-crm
- Container Name: retirement-crm

## Steps

### 1. Stage all changes
```bash
git add -A
```

### 2. Commit with descriptive message
```bash
git commit -m "fix: YOUR_COMMIT_MESSAGE_HERE"
```

### 3. Push to GitHub
```bash
git push origin main
```

### 4. Transfer modified files via SCP
Transfer the specific files that were changed. Common files:

**Backend files:**
```bash
scp "server/controllers/YOUR_FILE.ts" root@72.62.160.90:/opt/retirement-crm/server/controllers/
scp "server/routes/YOUR_FILE.ts" root@72.62.160.90:/opt/retirement-crm/server/routes/
```

**Frontend files:**
```bash
scp "src/components/YOUR_FILE.tsx" root@72.62.160.90:/opt/retirement-crm/src/components/
scp "src/services/YOUR_FILE.ts" root@72.62.160.90:/opt/retirement-crm/src/services/
```

// turbo
### 5. Rebuild Docker container on VPS
```bash
ssh root@72.62.160.90 "cd /opt/retirement-crm && docker-compose down && docker-compose up -d --build"
```
*Note: This takes 1-2 minutes to complete*

// turbo
### 6. Verify deployment
```bash
ssh root@72.62.160.90 "docker ps && docker logs retirement-crm --tail 20"
```

## Quick Deploy Script (All-in-one)
If you want to transfer ALL source files and rebuild (slower but complete):
```bash
ssh root@72.62.160.90 "cd /opt/retirement-crm && git pull origin main && docker-compose down && docker-compose up -d --build"
```
