# Smart-Campus-Operations-Hub
**IT3030 – PAF Assignment 2026**

### 
```bash
git clone https://github.com/Ransara821/Smart-Campus-Operations-Hub.git
```

### Step 2 — Start MongoDB
Make sure MongoDB is running locally:

MongoDB must be running on `mongodb://localhost:27017`

### Step 3 — Configure Backend Environment
Create the backend `.env` file:
```bash
cd backend
cp .env.example .env
```
The default `.env.example` values work out of the box for local development:
```
MONGODB_URI=mongodb://localhost:27017/SmartCampus
PORT=8082
FRONTEND_URL=http://localhost:5173
```

### Step 4 — Run the Backend
```bash
# From the /backend directory
./gradlew bootRun
```
Wait for:
```
Started SmartCampusBackendApplication in X.XXX seconds
Database already contains data. Skipping initialization.
```
Backend runs at: **http://localhost:8082**

> **If you see "Port 8082 already in use":**
> ```bash
> lsof -ti:8082 | xargs kill -9
> ./gradlew bootRun
> ```

### Step 5 — Configure Frontend Environment
```bash
cd ../frontend
cp .env.example .env   # or create .env manually
```
The `.env` file should contain:
```
VITE_API_URL=http://localhost:8082
```

### Step 6 — Run the Frontend
```bash
# From the /frontend directory
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**


GitHub Actions automatically builds the backend and frontend on every push to `main` or `dev`:

```yaml
# .github/workflows/build.yml
- Backend: ./gradlew build
- Frontend: npm install && npm run build
```

##  Modules Implemented

- **Module A** – Facilities & Assets Catalogue (CRUD, search, filter, status)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED, conflict check, QR check-in)
- **Module C** – Maintenance & Incident Ticketing (workflow, images, technician assign, comments)
- **Module D** – Notifications (booking/ticket events, unread badge, mark-as-read)
- **Module E** – Authentication & Authorization (Google OAuth2, role-based access: USER/ADMIN/TECHNICIAN)
