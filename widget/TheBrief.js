// The Brief — Scriptable Home Screen widget (free: https://scriptable.app)
// Shows your next item, today's counts and your nearest countdown.
// Tap opens The Brief. Medium size adds "+ Task" and "Plan" buttons.
// Token: create/revoke it in The Brief → More → Widget. It is read-only.
// NOTE: untested on real iPhone hardware.
const TOKEN = 'PASTE_TOKEN_HERE'
const APP = 'https://antmanfitness.github.io/the-brief/'
const SB = 'https://bvbcydanngfzemnnbuxa.supabase.co'
const KEY = 'sb_publishable_6ty7ZiomiqfHSr8HT07-sQ_2gMLSkZe'
const GREEN = new Color('#2fbf71'), BG = new Color('#000000'), MUTED = new Color('#ebebf5', 0.6)

function toMin(t) { // "7:00 AM" or "16:00"
  const m = String(t || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?/i); if (!m) return 9999
  let h = +m[1]; const mi = +(m[2] || 0), ap = (m[3] || '').toLowerCase()
  if (ap === 'p' && h < 12) h += 12; if (ap === 'a' && h === 12) h = 0; return h * 60 + mi
}
function fmt(min) { let h = Math.floor(min / 60) % 24; const m = min % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}` }
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }

async function load() {
  const r = new Request(SB + '/rest/v1/rpc/brief_widget_read')
  r.method = 'POST'; r.headers = { apikey: KEY, 'Content-Type': 'application/json' }
  r.body = JSON.stringify({ p_token: TOKEN }); r.timeoutInterval = 15
  const j = await r.loadJSON()
  if (j && j.code) throw new Error(j.message || 'Token rejected')
  return j
}

async function build() {
  const w = new ListWidget(); w.backgroundColor = BG; w.url = APP; w.setPadding(12, 14, 12, 14)
  const fam = config.widgetFamily || 'medium'
  let d
  try { d = await load() } catch (e) {
    const t = w.addText('The Brief'); t.font = Font.boldSystemFont(14); t.textColor = GREEN
    w.addSpacer(4); const m = w.addText('Open The Brief → More → Widget to make a new token.'); m.font = Font.systemFont(11); m.textColor = MUTED
    return w
  }
  const wg = d.widget || {}, n = nowMin()
  const items = []
  ;(d.sessions || []).forEach(s => items.push({ title: s.name || '', min: toMin(s.time), color: s.color || '#2fbf71' }))
  ;(wg.date === d.date ? (wg.items || []) : []).forEach(t => items.push({ title: t.title, min: toMin(t.time), color: t.color || '#2fbf71' }))
  const next = items.filter(i => i.min < 9999 && i.min >= n).sort((a, b) => a.min - b.min)[0]

  const head = w.addStack(); head.centerAlignContent()
  const h = head.addText('THE BRIEF'); h.font = Font.heavySystemFont(11); h.textColor = GREEN
  head.addSpacer()
  const c = head.addText(`${(d.sessions || []).length} sessions · ${wg.date === d.date ? (wg.tasks_open || 0) : 0} open`); c.font = Font.mediumSystemFont(10); c.textColor = MUTED
  w.addSpacer(6)
  if (next) {
    const diff = next.min - n
    const row = w.addStack(); row.centerAlignContent()
    const dot = row.addText('●'); dot.font = Font.systemFont(12); dot.textColor = new Color(next.color)
    row.addSpacer(5)
    const nm = row.addText(next.title); nm.font = Font.boldSystemFont(fam === 'small' ? 15 : 17); nm.textColor = Color.white(); nm.lineLimit = 1
    const cd = w.addText(diff < 60 ? `in ${diff}m · ${fmt(next.min)}` : `in ${Math.floor(diff / 60)}h ${diff % 60}m · ${fmt(next.min)}`)
    cd.font = Font.semiboldSystemFont(13); cd.textColor = GREEN
  } else { const t = w.addText('Nothing else timed today'); t.font = Font.semiboldSystemFont(14); t.textColor = Color.white() }
  w.addSpacer()
  if (wg.countdown && wg.countdown.date) {
    const days = Math.round((new Date(wg.countdown.date + 'T12:00:00') - new Date(d.date + 'T12:00:00')) / 864e5)
    const t = w.addText(`${wg.countdown.emoji || '⏳'} ${wg.countdown.name} · ${days > 0 ? 'in ' + days + ' days' : 'today'}`)
    t.font = Font.mediumSystemFont(11); t.textColor = MUTED; t.lineLimit = 1
  }
  if (fam !== 'small') {
    w.addSpacer(6); const b = w.addStack(); b.spacing = 8
    for (const [label, url] of [['+ Task', APP + '?add=task'], ['Plan', APP + '?tab=plan']]) {
      const s = b.addStack(); s.backgroundColor = new Color('#2fbf71', 0.22); s.cornerRadius = 10; s.setPadding(4, 10, 4, 10); s.url = url
      const t = s.addText(label); t.font = Font.boldSystemFont(12); t.textColor = GREEN
    }
  }
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)
  return w
}

const widget = await build()
if (config.runsInWidget) Script.setWidget(widget)
else if (args.queryParameters && args.queryParameters.open) Safari.open(APP)
else await widget.presentMedium()
Script.complete()
