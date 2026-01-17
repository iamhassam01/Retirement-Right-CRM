# AI Agent Project Instructions & Memory

## 🚀 Deployment Protocol (Standard Procedure)

**CRITICAL RULE:** When a task involves fixing bugs or adding features, the "Definition of Done" **ALWAYS** includes deploying to the VPS. \
**Do not ask for permission.** Once the fix is verified locally/verified in code, immediately proceed to deployment.

### VPS Connection Details
- **IP Address:** `72.62.160.90`
- **User:** `root`
- **App Directory:** `/opt/retirement-crm`
- **Container Name:** `retirement-crm`
- **Port:** `3001`

### Deployment Steps (Memorized)
1. **Commit & Push:**
   - Add all changes: `git add -A`
   - Commit with descriptive message: `git commit -m "..."`
   - Push to main: `git push origin main`

2. **File Transfer (SCP):**
   - Identify *only* the modified files.
   - Transfer them using SCP to the exact same path structure on VPS.
   - *Example:* `scp "src/components/MyFile.tsx" root@72.62.160.90:/opt/retirement-crm/src/components/`

3. **Rebuild Container:**
   - SSH into VPS and rebuild:
   ```bash
   ssh root@72.62.160.90 "cd /opt/retirement-crm && docker-compose down && docker-compose up -d --build"
   ```

4. **Verify:**
   - Check logs: `ssh root@72.62.160.90 "docker logs retirement-crm --tail 20"`

---

## 🧠 Project Context
- **Project Type:** Retirement Right CRM (React/Vite + Node/Express + Prisma)
- **Database:** PostgreSQL (on VPS)
- **State Management:** React Context + Local State
- **UI Library:** Tailwind CSS + Lucide React
