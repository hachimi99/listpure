import { NextResponse } from 'next/server'
import dns from 'dns/promises'

// ── Role-based prefixes ──────────────────────────────────────────────────────
const ROLE_PREFIXES = [
  'admin','info','support','help','contact','sales','marketing','noreply',
  'no-reply','hello','team','office','webmaster','postmaster','abuse',
  'hostmaster','billing','hr','jobs','newsletter','privacy','security',
  'legal','mail','feedback','press','media','service','services','enquiry',
  'enquiries','inquiry','inquiries','donotreply','do-not-reply','accounts',
  'account','general','reception','manager','ops','operations'
]

// ── Known disposable email domains ──────────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','throwam.com',
  'yopmail.com','trashmail.com','fakeinbox.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','guerrillamail.info','guerrillamail.biz',
  'guerrillamail.de','guerrillamail.net','guerrillamail.org','spam4.me',
  'trashmail.at','trashmail.io','trashmail.me','tempmail.com','temp-mail.org',
  'dispostable.com','mailnull.com','spamgourmet.com','spamgourmet.net',
  'maildrop.cc','discard.email','mailnesia.com','spamfree24.org',
  'spamfree24.de','spamfree24.eu','spamfree24.net','spamfree24.info',
  'spamfree.eu','spamfree24.com','spaml.de','spaml.com'
])

// ── Syntax validation ────────────────────────────────────────────────────────
function isValidSyntax(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  if (!re.test(email)) return false
  if (email.length > 254) return false
  const [local] = email.split('@')
  if (local.length > 64) return false
  return true
}

// ── MX record check ──────────────────────────────────────────────────────────
async function hasMxRecord(domain) {
  try {
    const records = await dns.resolveMx(domain)
    return records && records.length > 0
  } catch {
    return false
  }
}

// ── Classify single email ────────────────────────────────────────────────────
async function classifyEmail(email, mxCache) {
  const normalized = email.trim().toLowerCase()

  if (!normalized || !normalized.includes('@')) {
    return { email: normalized, status: 'invalid', reason: 'bad_format' }
  }

  if (!isValidSyntax(normalized)) {
    return { email: normalized, status: 'invalid', reason: 'invalid_syntax' }
  }

  const [local, domain] = normalized.split('@')

  // Disposable domain
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { email: normalized, status: 'invalid', reason: 'disposable' }
  }

  // Role-based
  const isRole = ROLE_PREFIXES.some(prefix => local === prefix || local.startsWith(prefix + '.') || local.startsWith(prefix + '+'))
  if (isRole) {
    return { email: normalized, status: 'risky', reason: 'role_based' }
  }

  // MX check (with cache to avoid repeated DNS lookups)
  if (!mxCache.has(domain)) {
    mxCache.set(domain, await hasMxRecord(domain))
  }
  const hasMx = mxCache.get(domain)

  if (!hasMx) {
    return { email: normalized, status: 'invalid', reason: 'no_mx_record' }
  }

  return { email: normalized, status: 'valid', reason: 'ok' }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 })
    }

    // Free tier: max 500 emails
    const FREE_LIMIT = 500
    const isPro = false // TODO: check Stripe subscription
    const limit = isPro ? 50000 : FREE_LIMIT
    const toProcess = emails.slice(0, limit)

    // Deduplicate first
    const seen = new Map()
    const duplicates = []
    const unique = []

    for (const email of toProcess) {
      const norm = email.trim().toLowerCase()
      if (!norm) continue
      if (seen.has(norm)) {
        duplicates.push(norm)
      } else {
        seen.set(norm, true)
        unique.push(norm)
      }
    }

    // Classify all unique emails
    const mxCache = new Map()
    const results = await Promise.all(
      unique.map(email => classifyEmail(email, mxCache))
    )

    const valid   = results.filter(r => r.status === 'valid')
    const invalid = results.filter(r => r.status === 'invalid')
    const risky   = results.filter(r => r.status === 'risky')

    // Stats per reason
    const reasons = {}
    for (const r of [...invalid, ...risky]) {
      reasons[r.reason] = (reasons[r.reason] || 0) + 1
    }

    return NextResponse.json({
      total:      toProcess.length,
      processed:  unique.length,
      valid:      valid.length,
      invalid:    invalid.length,
      risky:      risky.length,
      duplicates: duplicates.length,
      score:      Math.round((valid.length / unique.length) * 100),
      reasons,
      validEmails:   valid.map(r => r.email),
      invalidEmails: invalid.map(r => ({ email: r.email, reason: r.reason })),
      riskyEmails:   risky.map(r => ({ email: r.email, reason: r.reason })),
      duplicateEmails: duplicates,
      truncated: emails.length > limit,
      limit,
    })

  } catch (err) {
    console.error('Validation error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
