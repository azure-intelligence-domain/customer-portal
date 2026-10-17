import { describe, expect, it } from 'vitest'
import { claims, refusal } from '../src/lib/auth.js'

const jwt = (payload) => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`
const later = Math.floor(Date.now() / 1000) + 3600

describe('staff sign-in', () => {
  it('reads the claims of a Google ID token', () => {
    expect(claims(jwt({ email: 'ann@thevaluehub.be', hd: 'thevaluehub.be', name: 'Ann Bé' }))).toMatchObject({ hd: 'thevaluehub.be', name: 'Ann Bé' })
  })
  it('accepts an account of the staff domain', () => {
    expect(refusal({ email: 'ann@thevaluehub.be', hd: 'thevaluehub.be', exp: later }, 'thevaluehub.be')).toBeNull()
  })
  it('refuses any other account, with a reason', () => {
    expect(refusal({ email: 'someone@gmail.com', exp: later }, 'thevaluehub.be')).toMatch(/Only thevaluehub.be accounts/)
    expect(refusal({ email: 'x@other.be', hd: 'other.be', exp: later }, 'thevaluehub.be')).toMatch(/x@other.be/)
  })
  it('refuses an expired sign-in', () => {
    expect(refusal({ hd: 'thevaluehub.be', exp: 1 }, 'thevaluehub.be')).toMatch(/expired/)
  })
})
