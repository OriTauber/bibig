import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from './pool.js'

const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations')
const pool = createPool()
try {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())')
  for (const name of (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()) {
    if ((await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name])).rowCount) continue
    const client = await pool.connect()
    try { await client.query('BEGIN'); await client.query(await readFile(join(directory, name), 'utf8')); await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]); await client.query('COMMIT') }
    catch (error) { await client.query('ROLLBACK'); throw error }
    finally { client.release() }
    console.log(`Applied ${name}`)
  }
} finally { await pool.end() }
