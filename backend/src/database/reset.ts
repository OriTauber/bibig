import { getConfig } from '../config.js'
import { createPool } from './pool.js'

const config = getConfig()
if (config.NODE_ENV === 'production') throw new Error('Database reset is disabled when NODE_ENV is production.')
if (!process.argv.includes('--confirm')) throw new Error('This deletes all bibig users and workouts. Re-run with: npm run backend:reset-db -- --confirm')

const pool = createPool(config.DATABASE_URL)
try {
  await pool.query('BEGIN')
  await pool.query('DROP TABLE IF EXISTS strength_sets CASCADE')
  await pool.query('DROP TABLE IF EXISTS strength_exercises CASCADE')
  await pool.query('DROP TABLE IF EXISTS endurance_details CASCADE')
  await pool.query('DROP TABLE IF EXISTS workouts CASCADE')
  await pool.query('DROP TABLE IF EXISTS users CASCADE')
  await pool.query('DROP TABLE IF EXISTS schema_migrations')
  await pool.query('COMMIT')
  console.log('Deleted bibig database tables.')
} catch (error) {
  await pool.query('ROLLBACK')
  throw error
} finally { await pool.end() }

await import('./migrate.js')
