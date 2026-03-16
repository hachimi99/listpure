'use client'
import { useState, useRef } from 'react'

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5',
    fontFamily: "'DM Sans', system-ui, sans-serif", padding: '0',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    padding: '16px 5%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  logo: { fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' },
  logoSpan: { color: '#00e87a' },
  main: { maxWidth: 680, margin: '0 auto', padding: '60px 5% 100px' },
  h1: { fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.1 },
  sub: { fontSize: 16, color: '#9090a8', marginBottom: 40, fontWeight: 300 },
  uploadBox: {
    border: '2px dashed rgba(0,232,122,0.3)', borderRadius: 16,
    padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
    background: 'rgba(0,232,122,0.05)', transition: 'all .2s',
    marginBottom: 0,
  },
  uploadBoxHover: {
    border: '2px dashed #00e87a', background: 'rgba(0,232,122,0.1)',
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 17, fontWeight: 600, marginBottom: 6 },
  uploadSub: { fontSize: 13, color: '#9090a8' },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 10, border: 'none',
    background: '#00e87a', color: '#000', fontWeight: 700,
    fontSize: 15, cursor: 'pointer', transition: 'all .2s',
    marginTop: 20, width: '100%', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  card: {
    background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '24px', marginBottom: 12,
  },
  scoreRing: {
    width: 96, height: 96, borderRadius: '50%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    border: '4px solid #00e87a', flexShrink: 0,
  },
  scoreNum: { fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#00e87a' },
  scoreLbl: { fontSize: 11, color: '#9090a8', marginTop: 2 },
  statGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20,
  },
  stat: {
    background: '#16161f', borderRadius: 12, padding: '14px 12px', textAlign: 'center',
  },
  statN: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statL: { fontSize: 11, color: '#9090a8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em' },
  progress: {
    background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8,
  },
  pill: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '2px 10px', borderRadius: 20, marginRight: 6, marginBottom: 4,
  },
  reasonItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: 13,
  },
  dlBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent', color: '#f0f0f5', fontWeight: 600,
    fontSize: 14, cursor: 'pointer', marginBottom: 10, transition: 'background .15s',
  },
  tag: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const emails = []
  for (const line of lines) {
    // Try splitting by comma — handle single-column or multi-column CSV
    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
    for (const part of parts) {
      if (part.includes('@')) emails.push(part)
    }
    // If line itself looks like email (no commas)
    if (!line.includes(',') && line.includes('@')) emails.push(line)
  }
  return [...new Set(emails)]
}

function downloadCSV(emails, filename) {
  const content = 'email\n' + emails.join('\n')
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadReport(results, filename) {
  const reasonLabels = {
    invalid_syntax: 'Invalid syntax',
    no_mx_record: 'Domain has no mail server',
    disposable: 'Disposable email service',
    role_based: 'Role-based address',
    bad_format: 'Malformed address',
  }
  const lines = [
    'ListPure — Email Validation Report',
    '===================================',
    `Date: ${new Date().toLocaleDateString()}`,
    `Total processed: ${results.total}`,
    `Deliverability score: ${results.score}%`,
    '',
    'SUMMARY',
    `✅ Valid:      ${results.valid}`,
    `❌ Invalid:    ${results.invalid}`,
    `⚠️  Risky:     ${results.risky}`,
    `🔁 Duplicate: ${results.duplicates}`,
    '',
    'REASONS FOR REMOVAL',
    ...Object.entries(results.reasons).map(([k,v]) => `  • ${reasonLabels[k] || k}: ${v}`),
    '',
    'INVALID EMAILS',
    ...results.invalidEmails.map(r => `${r.email} — ${reasonLabels[r.reason] || r.reason}`),
    '',
    'RISKY EMAILS',
    ...results.riskyEmails.map(r => `${r.email} — ${reasonLabels[r.reason] || r.reason}`),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const REASON_LABELS = {
  invalid_syntax:  'Syntax invalide',
  no_mx_record:    'Domain without mail server',
  disposable:      'Disposable service',
  role_based:      'Role address (info@, admin@…)',
  bad_format:      'Malformed address',
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [hover, setHover] = useState(false)
  const [fileName, setFileName] = useState('')
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setResults(null)
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = parseCSV(e.target.result)
      setEmails(parsed)
    }
    reader.readAsText(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setHover(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) handleFile(file)
  }

  async function handleValidate() {
    if (!emails.length) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = results
    ? results.score >= 80 ? '#00e87a' : results.score >= 60 ? '#ffb84d' : '#ff4d6a'
    : '#00e87a'

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.logo}>List<span style={S.logoSpan}>Pure</span></div>
        <div style={{ fontSize: 13, color: '#9090a8' }}>
          <span style={{ color: '#00e87a', marginRight: 6 }}>●</span>
          Free · 500 emails/month
        </div>
      </nav>

      <div style={S.main}>
        {/* HEADER */}
        <h1 style={S.h1}>Clean your email list.<br /><span style={{ color: '#00e87a' }}>In 2 minutes.</span></h1>
        <p style={S.sub}>Upload a CSV — we detect invalid emails, spam traps, role addresses, and duplicates. Download your clean list instantly.</p>

        {/* UPLOAD */}
        {!results && (
          <>
            <div
              style={{ ...S.uploadBox, ...(hover ? S.uploadBoxHover : {}) }}
              onDragOver={e => { e.preventDefault(); setHover(true) }}
              onDragLeave={() => setHover(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
            >
              <div style={S.uploadIcon}>{fileName ? '📄' : '📂'}</div>
              <div style={S.uploadTitle}>
                {fileName ? fileName : 'Drop your CSV here, or click to browse'}
              </div>
              <div style={S.uploadSub}>
                {emails.length
                  ? `${emails.length} emails detected — ready to validate`
                  : 'Accepts .csv and .txt · one email per row'}
              </div>
              <input
                ref={inputRef} type="file" accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {emails.length > 0 && (
              <button
                style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
                onClick={handleValidate}
                disabled={loading}
              >
                {loading ? '⚙️  Scanning…' : `🔍  Validate ${emails.length} emails`}
              </button>
            )}

            {loading && (
              <div style={{ marginTop: 16, background: '#111118', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 10 }}>
                  Checking syntax · MX records · Disposable domains · Role addresses…
                </div>
                <div style={S.progress}>
                  <div style={{ height: 8, background: '#00e87a', width: '70%', borderRadius: 8, animation: 'none' }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 12, padding: '14px 20px', fontSize: 14, color: '#ff4d6a' }}>
                {error}
              </div>
            )}
          </>
        )}

        {/* RESULTS */}
        {results && (
          <>
            {/* Score header */}
            <div style={{ ...S.card, display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ ...S.scoreRing, border: `4px solid ${scoreColor}` }}>
                <div style={{ ...S.scoreNum, color: scoreColor }}>{results.score}%</div>
                <div style={S.scoreLbl}>healthy</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {results.score >= 80 ? '✅ Good list' : results.score >= 60 ? '⚠️ Needs cleaning' : '❌ Dirty list'}
                </div>
                <div style={{ fontSize: 14, color: '#9090a8', lineHeight: 1.6 }}>
                  {results.valid} valid emails out of {results.processed} unique.
                  {results.duplicates > 0 && ` Found ${results.duplicates} duplicates.`}
                  {results.truncated && ` (First ${results.limit} emails processed — upgrade for more)`}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={S.statGrid}>
              <div style={S.stat}>
                <div style={{ ...S.statN, color: '#00e87a' }}>{results.valid}</div>
                <div style={S.statL}>Valid</div>
              </div>
              <div style={S.stat}>
                <div style={{ ...S.statN, color: '#ff4d6a' }}>{results.invalid}</div>
                <div style={S.statL}>Invalid</div>
              </div>
              <div style={S.stat}>
                <div style={{ ...S.statN, color: '#ffb84d' }}>{results.risky}</div>
                <div style={S.statL}>Risky</div>
              </div>
              <div style={S.stat}>
                <div style={{ ...S.statN, color: '#9090a8' }}>{results.duplicates}</div>
                <div style={S.statL}>Duplicate</div>
              </div>
            </div>

            {/* Breakdown bar */}
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>List breakdown</div>
              <div style={{ display: 'flex', height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 12, gap: 2 }}>
                <div style={{ width: `${(results.valid/results.processed)*100}%`, background: '#00e87a', borderRadius: '8px 0 0 8px' }} />
                <div style={{ width: `${(results.risky/results.processed)*100}%`, background: '#ffb84d' }} />
                <div style={{ width: `${(results.invalid/results.processed)*100}%`, background: '#ff4d6a' }} />
                <div style={{ width: `${(results.duplicates/results.processed)*100}%`, background: '#5a5a72', borderRadius: '0 8px 8px 0' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#9090a8' }}>
                <span>🟢 Valid {Math.round(results.valid/results.processed*100)}%</span>
                <span>🟡 Risky {Math.round(results.risky/results.processed*100)}%</span>
                <span>🔴 Invalid {Math.round(results.invalid/results.processed*100)}%</span>
                <span>⚪ Duplicate {Math.round(results.duplicates/results.processed*100)}%</span>
              </div>
            </div>

            {/* Reasons */}
            {Object.keys(results.reasons).length > 0 && (
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>Why emails were flagged</div>
                {Object.entries(results.reasons).map(([k, v]) => (
                  <div key={k} style={S.reasonItem}>
                    <span>{REASON_LABELS[k] || k}</span>
                    <span style={{ fontWeight: 700, color: '#f0f0f5' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Downloads */}
            <div style={S.card}>
              <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>Download your results</div>

              <button style={S.dlBtn} onClick={() => downloadCSV(results.validEmails, 'listpure-clean.csv')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span>⬇️</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Clean list CSV</span>
                <span style={{ ...S.tag, background: 'rgba(0,232,122,0.1)', color: '#00e87a' }}>{results.valid} emails</span>
              </button>

              <button style={S.dlBtn} onClick={() => downloadReport(results, 'listpure-report.txt')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span>📄</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Full report (TXT)</span>
                <span style={{ ...S.tag, background: 'rgba(255,255,255,0.06)', color: '#9090a8' }}>with reasons</span>
              </button>

              {results.invalidEmails.length > 0 && (
                <button style={S.dlBtn} onClick={() => downloadCSV(results.invalidEmails.map(r=>r.email), 'listpure-invalid.csv')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>🗑️</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>Invalid emails CSV</span>
                  <span style={{ ...S.tag, background: 'rgba(255,77,106,0.1)', color: '#ff4d6a' }}>{results.invalid} emails</span>
                </button>
              )}
            </div>

            {/* Clean again */}
            <button
              style={{ ...S.btn, marginTop: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f0f5' }}
              onClick={() => { setResults(null); setEmails([]); setFileName('') }}
            >
              ↩ Clean another list
            </button>

            {/* Upgrade nudge */}
            {results.truncated && (
              <div style={{ marginTop: 16, background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#9090a8', textAlign: 'center' }}>
                ⚡ <strong style={{ color: '#00e87a' }}>Only first {results.limit} emails processed.</strong> Upgrade to Pro for up to 50,000 emails + API access.
                <br />
                <a href="/#pricing" style={{ color: '#00e87a', marginTop: 8, display: 'inline-block', fontWeight: 600 }}>See Pricing →</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
