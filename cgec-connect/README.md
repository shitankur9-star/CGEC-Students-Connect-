# CGEC Connect

CGEC Connect is a campus community application for students to share posts, discover people through academic and campus interests, message, find clubs and events, and report safety concerns. It is not a dating service. Student IDs, email addresses and precise location are never returned by public profile or search APIs.

## Stack

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, Lucide React
- `backend/`: Node.js, Express, TypeScript, Socket.IO, Zod validation, JWT in HTTP-only cookies
- `prisma/`: PostgreSQL relational schema and seed data

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 15 or newer
- SMTP provider and institutional email domain confirmation for production verification emails
- Optional Cloudinary account (or compatible private image provider) for uploads

## Install and run

1. Copy `.env.example` to `backend/.env` and set `DATABASE_URL` and a strong random `JWT_SECRET`. Configure PostgreSQL and create the `cgec_connect` database.
2. Install dependencies from the repository root and each app:

   ```sh
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. Generate the Prisma client, apply the development migration, and seed campus interests and clubs:

   ```sh
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Start both servers:

   ```sh
   npm run dev
   ```

   Web: `http://localhost:5173`; API: `http://localhost:3001/api`; health check: `http://localhost:3001/api/health`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, read by Prisma |
| `JWT_SECRET` | Long, random signing secret (required in production) |
| `PORT` | API port, defaults to 3001 |
| `FRONTEND_ORIGIN` | Exact frontend origin for credentialed CORS and Socket.IO |
| `NODE_ENV` | Set to `production` to enable secure cookies |
| `SMTP_*`, `EMAIL_FROM` | Email verification delivery integration settings |
| `CLOUDINARY_*` | Optional image storage credentials; keep uploads server-signed |

## Database and migrations

The schema is in `prisma/schema.prisma`. Use `npm run db:migrate` for development migrations. For deployment, commit migrations and run `npx prisma migrate deploy` from the repository root (or the equivalent Prisma command with the root schema path). Unique compound keys prevent duplicate follows, likes, saves, club memberships, event interests and conversation membership.

## Production build and deployment

Run `npm run build` at the root. Deploy the frontend static `frontend/dist` to a static host and the backend `backend/dist/server.js` to a Node host. Set `FRONTEND_ORIGIN` to the deployed HTTPS origin and terminate TLS at the host or reverse proxy. Host PostgreSQL privately, run migrations before deploying API code, and configure the API host's websocket upgrade support. Set secure cookies, strict origin allowlists, production email delivery and private image storage before opening registration.

## Admin setup

New accounts have the `STUDENT` role. Promote a trusted account using a controlled database operation, for example `UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@your-college.ac.in';`. The API only permits `ADMIN` and `MODERATOR` roles to access report review and moderation actions; every action is recorded with its moderator and reason.

## Security and product notes

- Passwords use bcrypt hashing. Login is rate limited and sessions use HTTP-only, same-site cookies.
- Registration is limited to `.ac.in` or `.edu` email suffixes. A production email delivery and token verification provider must be configured before enabling real registration; unverified accounts cannot log in.
- Endpoints use authentication middleware, ownership checks, input schemas, output projections, and role checks for moderation.
- Blocks remove both follow directions and suppress blocked users in discovery and feeds. Messaging checks blocks and optional follower-only restrictions.
- Report categories cover harassment, spam, bullying, impersonation, inappropriate content and other concerns.
- Use a signed upload flow and file type/size validation for any production image upload feature. Do not store student IDs, email or location in public profile fields.
- The frontend includes a polished interactive experience with seeded demo content so it can be reviewed without a database. Its client-side interactions are illustrative; connect production screens to the API before launch.

## API map

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/PATCH /api/users/:id`, `POST/DELETE /api/users/:id/follow`, follower/following lists
- `GET /api/feed`, post CRUD, likes, comments, saved posts
- `GET /api/discover`, `GET /api/search?q=...`
- `GET/POST /api/messages`, conversation history and own-message delete
- `GET /api/events`, event interest, authorized event creation; `GET /api/clubs`, club join/leave
- `GET/PATCH /api/notifications`, `PATCH /api/privacy`, `POST /api/block`, `POST /api/reports`
- `/api/admin/*` moderation endpoints require an `ADMIN` or `MODERATOR` session
- Socket.IO events: `conversation:join`, `message:send`, `message:new`, `typing`, `message:read`
