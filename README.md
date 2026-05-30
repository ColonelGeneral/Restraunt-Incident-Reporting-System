# Restaurant Incident Reporting Tool

Monorepo scaffold for the restaurant incident reporting app.

## Workspace Layout

- `frontend` - React 19 + Vite UI
- `backend` - Express + MongoDB API
- `Restaurant_Incident_Reporting_Tool_Requirements.md` - project scope and phased plan

## Local Setup

1. Install dependencies in the repository root.
2. Create environment files from the provided examples.
3. Add your MongoDB Atlas connection string to `backend/.env`.
4. Add a strong `JWT_SECRET` to `backend/.env`.
5. Add `GEMINI_API_KEY` and `GEMINI_API_URL` to `backend/.env` when AI features are enabled.
6. Add `DELETE_WINDOW_MINUTES` to control how long managers/admins can delete incidents after creation.
7. (Optional) If your environment blocks DNS SRV lookups, set `MONGODB_DIRECT_URI` in `backend/.env` with a non-`+srv` connection string (host:port list + replicaSet) and the backend will try it as a fallback.
8. Start the backend and frontend together with the root dev script.

## Environment Variables

### Backend

Required:

- `MONGODB_URI` - your MongoDB Atlas connection string
- `JWT_SECRET` - long random secret for JWT signing
- `DELETE_WINDOW_MINUTES` - delete window in minutes for manager/admin incident deletion

AI:

- `GEMINI_API_KEY` - your Gemini API key
- `GEMINI_API_URL` - use `https://generativelanguage.googleapis.com/v1beta`

Put those values in [backend/.env](backend/.env) for local development. For Vercel deployment, add the same variables in the project settings under Environment Variables.

Optional notification and media values can be added later for email and Cloudinary.

### Frontend

- `VITE_API_BASE_URL=http://localhost:5000`

## Demo Accounts

The seed script creates these accounts:

- `employee.demo@restaurant.local` / `Demo@1234!`
- `manager.demo@restaurant.local` / `Demo@1234!`
- `admin.demo@restaurant.local` / `Demo@1234!`

## Scripts

- `npm run dev` - run frontend and backend together
- `npm run dev:frontend` - run the frontend only
- `npm run dev:backend` - run the backend only
- `npm run seed:demo -w backend` - seed demo accounts
