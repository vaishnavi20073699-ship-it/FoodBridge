# FoodBridge — HACK-P197 (MERN)

Food donation coordination prototype using MongoDB Atlas, Express, React, Node.js, JWT authentication and bcrypt password hashing.

## Requirements
- Node.js 20 LTS or newer
- npm
- MongoDB Atlas account and a database user
- Browser and VS Code

## 1. Configure MongoDB Atlas
1. Sign in to MongoDB Atlas and create a free cluster.
2. Under **Database Access**, create a database user and password.
3. Under **Network Access**, allow your current IP address. For a short-lived demo only, you may temporarily allow `0.0.0.0/0`, but remove it afterward.
4. Choose **Connect → Drivers → Node.js** and copy the connection string.
5. Replace the username, password and database name in `server/.env` with your actual values. URL-encode special characters in the database password.

## 2. Install and run on Mac
From Terminal, enter the extracted project folder:
```bash
cd FoodBridge_MERN
cp server/.env.example server/.env
```
Edit `server/.env` and set `MONGODB_URI`, a long random `JWT_SECRET`, and the demo seed password.
Then install:
```bash
npm install
npm run install:all
```
Seed the demo data:
```bash
npm run seed
```
Start frontend and backend:
```bash
npm run dev
```
Open `http://localhost:5173`.

API runs on `http://localhost:5000`. The React development server proxies `/api` requests to it.

## Demo accounts
The seed script creates:
- Donor: `sunrise@example.test`
- Donor: `greenleaf@example.test`
- Donor: `citycaterers@example.test`
- Recipient: `helpinghands@example.test`
- Recipient: `hopekitchen@example.test`
- Recipient: `annapurna@example.test`
- Admin: `admin@example.test`

The seed script reads `SEED_DEMO_PASSWORD` from `server/.env`; the default example is `DemoFoodBridge123!`. Change this before seeding and never use these demo credentials for a public deployment. Seed is safe to rerun: it upserts demo users and organizations and resets demo listings/requests/reports to the seeded state.

## Included functionality
- Registration/login with bcrypt-hashed passwords and JWTs.
- Role-based authorization middleware.
- Donor profile registration/editing, create listing, donor dashboard and request review.
- Recipient organization profiles, searchable marketplace and recipient dashboard.
- Listing fields: preparation time, use-by guidance, pickup window, location, storage and allergen notes.
- 10 sample listings and 3 demo recipient organizations.
- Pending/accepted/rejected/cancelled/completed request states.
- Reservation capacity is checked in a MongoDB transaction; pending and accepted requests reserve capacity.
- Pickup confirmation code, status history and reports.
- Admin can remove/restore listings and resolve reports.

## Food safety limitations
FoodBridge is a coordination tool, not a food inspection, certification or safety guarantee service. Demo addresses and contacts are fictional. Donors must provide accurate information, follow applicable local food-safety rules, and not list food if its safety is uncertain. Recipients should check handling details and decline unsafe or unclear donations. The platform cannot verify temperature history, allergen accuracy, preparation conditions or legal compliance.

## Important technical notes
- Reservation transactions require a MongoDB Atlas replica set, which Atlas clusters support. If you use a deployment that doesn't support transactions, the reservation API will return an error rather than silently permit overbooking.
- JWTs are stored in localStorage for prototype simplicity. For production, consider secure httpOnly cookies, refresh-token rotation, rate limiting, stricter validation, email verification, audit logging and security review.
- This is a hackathon prototype; have a responsible operator review the workflow before real donations.
