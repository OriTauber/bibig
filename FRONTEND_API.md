# Connecting bibig

Configure PostgreSQL and run migrations using backend/README.md first.
From the project root, start the backend with `npm run backend:dev`, then
start the frontend in a second terminal with `npm run dev`.

Open the Vite URL and register or sign in to save workouts to your account.
The Vite development and preview servers proxy /api to localhost port 3001.
If the backend uses another port, update the proxy target in vite.config.ts.
Production hosting must route /api to the backend on the same origin over HTTPS.

“Continue on this device” accesses the original IndexedDB workout collection.
It remains separate from account caches; those legacy workouts are not uploaded automatically.

Account mode now saves locally first. A per-user IndexedDB record in
“bibig-account-workouts” holds the cached workouts and ordered pending changes.
Each local save and queue entry commit in one transaction. The UI reports success
only after the transaction commits, without waiting for the backend.

Background sync runs on opening the account, after a change, every 15 seconds,
on window focus, on the browser's online event, and through “Sync now”.
Requests time out after 8 seconds, including when a backend hangs. Backend failures
keep the queue. Downloads preserve changes made while requests were in flight.
Web Locks serialize syncing for the same account across supported browser tabs.

Successful operations are removed from the queue individually. Client-generated UUIDs
prevent duplicate creation: after a lost POST response, a 409 is acknowledged only
when the authenticated user's existing workout matches the queued payload.
A repeated DELETE returning 404 counts as success. Updates replace the whole record.

Conflict policy: the last uploaded edit wins. This is not field-by-field merging,
and an offline edit may replace newer edits from another device. Updating a remotely
deleted workout, an inconsistent duplicate ID, or rejected validation keeps the change
queued and displays a sync error. There is currently no conflict-resolution screen;
such errors need investigation. The queue stops at a rejected operation to preserve order.

Tokens are stored in sessionStorage, allowing reloads in the same tab while offline.
They are cleared on sign-out. New tabs/browser sessions may require sign-in, and initial
sign-in/registration requires the backend. An expired token pauses uploads but leaves
cached workouts available and editable. Sign in to the same account to resume syncing.
Unsynced account data survives sign-out and is only selected again for that account.
Like other browser data, it is not encrypted against someone with access to the device,
and clearing site storage removes cached/pending workouts. Tokens in sessionStorage
are accessible to same-origin scripts; production requires HTTPS and XSS protections.

History now offers Edit workout and Delete workout, using the same local-first repository.
Deleting requires confirmation. Analytics and calendar use cached records immediately.

This change handles backend downtime. It does not add a service worker or package the
frontend for offline loading: keep Vite running during the local backend-offline test.
The browser must previously have downloaded account workouts to display them offline.

ApiWorkoutRepository implements the existing WorkoutRepository interface.
React uses the hook and repository; HTTP and authentication requests live in
src/api/client.ts. Analytics still run locally on the loaded workout records.

Verify with `npm test`, `npm run build`, `npm run backend:test`,
and `npm run backend:build`.

## Profiles, Google sign-in, and analytics ranges

New password registrations require a unique username. bibig displays this username in the app instead of the email address. Run `npm run backend:migrate` to apply the username migration before registering.

Google sign-in needs a Google OAuth Web client ID. Copy `.env.example` to `.env` in the project root and set `VITE_GOOGLE_CLIENT_ID`. Set the same value as `GOOGLE_CLIENT_ID` in `backend/.env`; see `backend/README.md` for the Google Cloud Console setup. Google identity tokens are verified by the backend. If either setting is omitted, the sign-in page explains that Google is unavailable.

Insights charts offer Last 30 days, Last 3 months, Last 6 months, Last year, and All time. Quick Log opens only when selected from the dashboard.

## Manual backend-offline test

1. Start both servers and sign in. Wait for “All changes synced”.
2. Stop only the backend with Ctrl+C, leaving Vite running.
3. Save a workout. It should appear immediately, with a pending count.
4. In History, edit an existing workout and delete another if desired.
5. Reload the same tab: cached records and pending changes should still be present.
6. Restart the backend. Wait up to 15 seconds, or click “Sync now”.
7. Confirm “All changes synced”, then reload and check the records in PostgreSQL.

No new SQL migrations are required for this feature.
