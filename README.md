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
5. Add Gemini credentials to `backend/.env` when AI features are enabled.
6. Start the backend and frontend together with the root dev script.

## Environment Variables

### Backend

Required:

- `MONGODB_URI` - your MongoDB Atlas connection string
- `JWT_SECRET` - long random secret for JWT signing

AI:

- `GEMINI_API_KEY` - your Gemini API key
- `GEMINI_API_URL` - use `https://generativelanguage.googleapis.com/v1beta`

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
