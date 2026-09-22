import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import type { AuthService } from './services/AuthService.js'
import type { WorkoutService } from './services/WorkoutService.js'
import { authenticate } from './middleware/auth.js'
import { errorHandler } from './middleware/errors.js'
import { toCanonicalWorkout, workoutInputSchema } from './validation/workout.js'
import { OAuth2Client } from 'google-auth-library'

const credentials = z.object({ email: z.string().email().max(320), password: z.string().min(8).max(200) })
const registration = credentials.extend({ username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, underscores, or hyphens.') })
const googleCredential = z.object({ credential: z.string().min(1), username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, underscores, or hyphens.').optional() })
export function createApp(dependencies: { auth: AuthService; workouts: WorkoutService; jwtSecret: string; googleClientId?: string; googleClientIds?: string[]; corsOrigins?: string[] }) {
  const googleClientIds = dependencies.googleClientIds ?? (dependencies.googleClientId ? [dependencies.googleClientId] : [])
  const allowedOrigins = dependencies.corsOrigins ?? ['http://localhost', 'http://localhost:5173', 'http://127.0.0.1:5173', 'https://localhost', 'capacitor://localhost']
  const corsOrigin = allowedOrigins.includes('*') ? true : allowedOrigins
  const app = express(); app.use(cors({ origin: corsOrigin })); app.use(express.json({ limit: '1mb' }))
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.post('/api/auth/register', async (req, res, next) => { try { const body = registration.parse(req.body); res.status(201).json(await dependencies.auth.register(body.email, body.username, body.password)) } catch (error) { next(error) } })
  app.post('/api/auth/login', async (req, res, next) => { try { const body = credentials.parse(req.body); res.json(await dependencies.auth.login(body.email, body.password)) } catch (error) { next(error) } })
  app.post('/api/auth/google', async (req, res, next) => { try { if (!googleClientIds.length) return res.status(503).json({ error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not configured.' } }); const body = googleCredential.parse(req.body); const ticket = await new OAuth2Client().verifyIdToken({ idToken: body.credential, audience: googleClientIds }); const payload = ticket.getPayload(); if (!payload?.sub || !payload.email || !payload.email_verified) return res.status(401).json({ error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Google did not provide a verified email.' } }); res.json(await dependencies.auth.googleLogin({ sub: payload.sub, email: payload.email.toLowerCase() }, body.username)) } catch (error) { next(error) } })
  const secured = express.Router(); secured.use(authenticate(dependencies.jwtSecret))
  secured.get('/', async (req, res, next) => { try { res.json(await dependencies.workouts.getAll(req.auth!.userId)) } catch (error) { next(error) } })
  secured.get('/:id', async (req, res, next) => { try { const workout = await dependencies.workouts.getById(req.auth!.userId, z.string().uuid().parse(req.params.id)); if (!workout) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workout not found.' } }); return res.json(workout) } catch (error) { return next(error) } })
  secured.post('/', async (req, res, next) => { try { const workout = toCanonicalWorkout(workoutInputSchema.parse(req.body)); await dependencies.workouts.create(req.auth!.userId, workout); res.status(201).json(workout) } catch (error) { next(error) } })
  secured.put('/:id', async (req, res, next) => { try { const id = z.string().uuid().parse(req.params.id); const workout = toCanonicalWorkout(workoutInputSchema.parse(req.body)); if (id !== workout.id) return res.status(400).json({ error: { code: 'ID_MISMATCH', message: 'Path and workout IDs must match.' } }); if (!(await dependencies.workouts.update(req.auth!.userId, workout))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workout not found.' } }); return res.json(workout) } catch (error) { return next(error) } })
  secured.delete('/:id', async (req, res, next) => { try { if (!(await dependencies.workouts.delete(req.auth!.userId, z.string().uuid().parse(req.params.id)))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workout not found.' } }); return res.status(204).send() } catch (error) { return next(error) } })
  app.use('/api/workouts', secured); app.use(errorHandler); return app
}
