# Restaurant Incident Reporting Tool

Restaurant Incident Reporting Tool is a monorepo for reporting, tracking, and analyzing restaurant incidents across employees, managers, and admins. It includes a React/Vite frontend, an Express/MongoDB backend, seeded demo accounts, role-based analytics, AI-assisted summaries, image uploads, and a dark mode UI.

## What The App Does

- Employees can submit incidents with a title, description, category, severity, store location, and optional image.
- Managers and admins can review incidents, update status, export CSV reports, and access analytics dashboards.
- AI summaries can be generated for incident descriptions when enabled.
- Uploaded incident images are stored through Cloudinary.
- Demo accounts are pre-seeded for quick local testing.
- Dark mode is available from the top navigation bar.

## Project Structure

- `frontend` - React 19, Vite, TypeScript, React Router, and Recharts.
- `backend` - Express 5, TypeScript, Mongoose, JWT auth, Zod validation, Cloudinary upload handling, and optional Gemini/email integrations.
- `postman` - API collection and local environment for repeatable API testing.
- `Restaurant_Incident_Reporting_Tool_Requirements.md` - product scope and requirements reference.

## Main Features

### Authentication

- Demo employee, manager, and admin accounts are seeded automatically.
- Sign up is restricted to `@restaurant.local` addresses.
- Login uses JWT tokens and role-based access control.

### Incidents

- Create, view, update, and delete incidents.
- Employees can view their own incidents.
- Managers and admins can access organization-level incident data.
- Delete actions are time-limited by `DELETE_WINDOW_MINUTES`.
- Status updates trigger an email notification when SMTP is configured.

### Analytics

- Manager and admin dashboards show incident totals, charts, and trends.
- CSV export is available for filtered incident sets.

### Media And AI

- Incident images can be uploaded through `/api/uploads/image`.
- Gemini-based summaries can be generated from incident descriptions.

## Local Setup

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Configure Environment Files

Copy the provided example into your local backend environment file and fill in real values:

```bash
backend/.env.example -> backend/.env
```

### 3. Add Required Backend Values

At minimum, configure:

- `MONGODB_URI`
- `JWT_SECRET`
- `DELETE_WINDOW_MINUTES`

Optional but supported:

- `MONGODB_DIRECT_URI` for SRV fallback issues.
- `ALLOW_OFFLINE_START=true` to start the backend without MongoDB in local demo mode.
- `GEMINI_API_KEY` and `GEMINI_API_URL` for AI summaries.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for image uploads.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS` for status notification email delivery.

### 4. Configure Frontend Variables

Set the frontend API base URL if you are not running the backend on the default local port:

- `VITE_API_BASE_URL=http://localhost:5000`

## Running Locally

### Start Both Apps

```bash
npm run dev
```

This starts the frontend and backend together from the workspace root.

### Start Only One Side

```bash
npm run dev:frontend
npm run dev:backend
```

### Build For Production

```bash
npm run build
```

## Demo Accounts

The seed script creates these accounts:

- `employee.demo@restaurant.local` / `Demo@1234!`
- `manager.demo@restaurant.local` / `Demo@1234!`
- `admin.demo@restaurant.local` / `Demo@1234!`

## Signup Rules

- New accounts must use an `@restaurant.local` email address.
- The signup page shows an inline rejection banner when the suffix is invalid.
- New signups create employee accounts and capture store location.

## Seed Data

The backend seed script creates demo users and sample incidents.

```bash
npm run seed:demo -w backend
```

The seed is idempotent, so you can run it repeatedly without duplicating the demo records.

## API Overview

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Incidents

- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/:id`
- `PATCH /api/incidents/:id`
- `PATCH /api/incidents/:id/status`
- `DELETE /api/incidents/:id`

### Analytics

- `GET /api/analytics/dashboard`
- `GET /api/analytics/monthly`
- `GET /api/analytics/stores`
- `GET /api/analytics/severity`
- `GET /api/analytics/categories`
- `GET /api/analytics/export`

### Uploads

- `POST /api/uploads/image`

## Postman Testing

A ready-to-run Postman collection is included for local API verification.

- Collection: `postman/incident-reporter.postman_collection.json`
- Environment: `postman/local.postman_environment.json`

Import both into Postman and point them at `http://localhost:5000`.

## Deployment Guide

The app is set up for a split deployment:

- Frontend on Vercel, Netlify, or similar static hosting.
- Backend on Render, Railway, Fly.io, or another Node hosting provider.
- MongoDB Atlas for persistence.

### Render Deployment

The repository includes a [render.yaml](render.yaml) blueprint so you can deploy both services from the same repo.

1. Push the repository to GitHub.
2. In Render, create a new Blueprint and connect the GitHub repo.
3. Render will detect `render.yaml` and create:
	- a backend web service
	- a frontend static site
4. Add the backend environment variables in Render for the web service.
5. Set `MONGODB_URI`, `JWT_SECRET`, and the optional AI/media variables.
6. Set `VITE_API_BASE_URL` on the frontend service to the backend service URL Render gives you.
7. Redeploy the frontend after the backend URL is available.
8. Open the frontend URL and log in with a demo account.

Recommended Render values:

- Backend build command: `npm install && npm run build -w backend`
- Backend start command: `npm run start -w backend`
- Frontend build command: `npm install && npm run build -w frontend`
- Frontend publish directory: `frontend/dist`

For the backend service, Render sets `PORT` automatically in production, so you do not need to define it manually.

### Backend Deployment

1. Create a new Node service.
2. Set the build command to `npm run build -w backend`.
3. Set the start command to `npm run start -w backend`.
4. Add the backend environment variables from the list above.
5. Point `MONGODB_URI` to your Atlas cluster.
6. Add `MONGODB_DIRECT_URI` if your provider has SRV DNS issues.
7. Add `JWT_SECRET` and `DELETE_WINDOW_MINUTES`.
8. Add Gemini, Cloudinary, and SMTP variables only if you want those features enabled.

### Frontend Deployment

1. Create a new static site or frontend project.
2. Set the build command to `npm run build -w frontend`.
3. Set the output directory to `frontend/dist`.
4. Set `VITE_API_BASE_URL` to your deployed backend URL.
5. Redeploy after changing the backend URL.

### MongoDB Atlas

1. Create a cluster.
2. Create a database user.
3. Allow the deployment host IP or temporarily allow access from anywhere during testing.
4. Copy the connection string into `MONGODB_URI`.

### Deployment Checklist

- Backend health check returns successfully.
- Frontend points to the deployed API.
- Demo accounts can log in.
- Analytics is accessible to managers and admins.
- Image upload works if Cloudinary is configured.
- Status-change email works if SMTP is configured.

## Troubleshooting

- If the backend will not start, confirm `MONGODB_URI` and `JWT_SECRET` are set.
- If local development must proceed without MongoDB, set `ALLOW_OFFLINE_START=true`.
- If Vite points to the wrong backend, update `VITE_API_BASE_URL`.
- If uploads fail, confirm the Cloudinary credentials.
- If emails fail, confirm the SMTP credentials.

## Scripts

- `npm run dev` - run frontend and backend together.
- `npm run dev:frontend` - run the frontend only.
- `npm run dev:backend` - run the backend only.
- `npm run build` - build both workspaces.
- `npm run lint` - lint both workspaces.
- `npm run seed:demo -w backend` - seed demo users and incidents.

## Notes

- Employees can access their own incidents.
- Managers and admins can access analytics and status changes.
- The most common local setup is frontend on `http://localhost:5173` or `5175`, backend on `http://localhost:5000`.
