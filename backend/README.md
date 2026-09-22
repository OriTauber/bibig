# bibig backend

## Local setup

1. Create a PostgreSQL database named `bibig` (for example, `createdb bibig`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters.
3. From the repository root, run `npm install`, then `npm run backend:migrate` and `npm run backend:dev`.

To delete all local bibig accounts and workouts, then recreate the schema, use this development-only command:

```powershell
npm run backend:reset-db -- --confirm
```

The `--confirm` part is required. If you run the backend workspace command directly, use `npm run reset-db --workspace=backend -- --confirm`.

It refuses to run when `NODE_ENV=production`. It drops bibig's users, workouts, strength exercise/set, endurance, and migration tables in the database selected by `DATABASE_URL`, so verify that value first.

The API listens on `http://localhost:3001` by default. Use `npm run backend:build` and `npm run backend:test` for backend verification; `npm test` runs the existing frontend tests.

The application is named bibig. Existing PostgreSQL databases can keep their current name: preserve the matching `DATABASE_URL` in your private `.env`. The browser database retains its original `stride` storage key to keep existing workouts accessible.

## API

`POST /api/auth/register` accepts `{ email, username, password }`; `POST /api/auth/login` accepts `{ email, password }`; and `POST /api/auth/google` accepts a Google identity credential. Include `username` with the Google credential only when creating a new Google-linked account; omit it to sign into an existing one. Each returns `{ token, user }`, where `user` contains `id`, `username`, and `createdAt`. Send `Authorization: Bearer <token>` for workout routes:

- `GET /api/workouts`
- `GET /api/workouts/:id`
- `POST /api/workouts`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`

Workout request/response bodies follow the framework-independent backend workout type and are compatible with the frontend `Workout` shape. Strength exercise `name` is accepted only for compatibility and is always returned from the canonical catalog based on `exerciseId`; PostgreSQL persists only `exercise_id`.

Migrations in `src/database/migrations` are tracked in `schema_migrations` and run transactionally. The API intentionally has no synchronization endpoints or API repository yet.

## Google sign-in

1. In Google Cloud Console, create an OAuth 2.0 **Web application** client.
2. Add your local frontend origin, such as `http://localhost:5173`, under Authorized JavaScript origins.
3. Put the Web client ID in the root `.env` as `VITE_GOOGLE_CLIENT_ID`. In `backend/.env`, set `GOOGLE_CLIENT_IDS` to the accepted token audiences: the Web client ID and, when Android tokens use a different audience, the Android client ID separated by a comma. The older single `GOOGLE_CLIENT_ID` setting remains supported.
4. Restart both servers. Never put a Google client secret in either file.
