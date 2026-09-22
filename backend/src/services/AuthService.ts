import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { UserRepository } from '../repositories/UserRepository.js'

export class AuthenticationError extends Error {}
export class AuthService {
  constructor(private readonly users: UserRepository, private readonly secret: string, private readonly expiresIn: string) {}
  private token(id: string, email: string) { return jwt.sign({ sub: id, email }, this.secret, { expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'] }) }
  private session(user: import('../repositories/UserRepository.js').User) { return { token: this.token(user.id, user.email), user: { id: user.id, username: user.username, createdAt: user.createdAt } } }
  async register(email: string, username: string, password: string) { const normalized = email.trim().toLowerCase(); const displayName = username.trim(); if (await this.users.findByEmail(normalized)) throw new Error('EMAIL_EXISTS'); if (await this.users.findByUsername(displayName)) throw new Error('USERNAME_EXISTS'); const user = await this.users.create(normalized, displayName, await bcrypt.hash(password, 12)); return this.session(user) }
  async login(email: string, password: string) { const user = await this.users.findByEmail(email.trim().toLowerCase()); if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new AuthenticationError('Invalid email or password.'); return this.session(user) }
  async googleLogin(identity: { sub: string; email: string }, username?: string) {
    const existing = await this.users.findByGoogleSub(identity.sub)
    if (existing) return this.session(existing)
    if (!username) throw new AuthenticationError('No bibig account is linked to this Google account. Create an account first.')
    if (await this.users.findByEmail(identity.email)) throw new Error('EMAIL_EXISTS')
    const displayName = username.trim()
    if (await this.users.findByUsername(displayName)) throw new Error('USERNAME_EXISTS')
    return this.session(await this.users.create(identity.email, displayName, null, identity.sub))
  }
}
