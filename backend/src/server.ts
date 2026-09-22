import { getConfig } from './config.js'
import { createPool } from './database/pool.js'
import { PostgresUserRepository } from './repositories/PostgresUserRepository.js'
import { PostgresWorkoutRepository } from './repositories/PostgresWorkoutRepository.js'
import { AuthService } from './services/AuthService.js'
import { WorkoutService } from './services/WorkoutService.js'
import { createApp } from './app.js'
const config = getConfig(); const pool = createPool(config.DATABASE_URL)
const googleClientIds = (config.GOOGLE_CLIENT_IDS ?? config.GOOGLE_CLIENT_ID ?? '').split(',').map(id => id.trim()).filter(Boolean)
const app = createApp({ auth: new AuthService(new PostgresUserRepository(pool), config.JWT_SECRET, config.JWT_EXPIRES_IN), workouts: new WorkoutService(new PostgresWorkoutRepository(pool)), jwtSecret: config.JWT_SECRET, googleClientIds, corsOrigins: config.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean) })
app.listen(config.PORT, '0.0.0.0', () => console.log(`bibig API listening on port ${config.PORT}`))
