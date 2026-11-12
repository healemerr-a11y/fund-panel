const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function group(trades, keyFn) {
  const m = {}
  trades.forEach((t) => {
    const k = keyFn(t)
    const g = (m[k] ||= { key: k, n: 0, pnl: 0, wins: 0 })
    g.n++; g.pnl += t.pnl; if (t.pnl > 0) g.wins++
  })
  return Object.values(m).map((g) => ({ ...g, winRate: (g.wins / g.n) * 100, avg: g.pnl / g.n }))
}

export function analyze(list) {
  const t = [...list].sort((a, b) => a.date.localeCompare(b.date))
  const n = t.length
  const wins = t.filter((x) => x.pnl > 0)
  const losses = t.filter((x) => x.pnl < 0)
  const gross = wins.reduce((s, x) => s + x.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, x) => s + x.pnl, 0))
  const total = gross - grossLoss
  const avgWin = wins.length ? gross / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0

  let maxWin = 0, maxLoss = 0, w = 0, l = 0
  t.forEach((x) => {
    if (x.pnl > 0) { w++; l = 0 } else if (x.pnl < 0) { l++; w = 0 } else { w = 0; l = 0 }
    maxWin = Math.max(maxWin, w); maxLoss = Math.max(maxLoss, l)
  })

  let cum = 0
  const curve = t.map((x, i) => ({ n: i + 1, date: x.date.slice(0, 10), symbol: x.symbol, cum: (cum += x.pnl) }))

  const dayIdx = (x) => { const [y, m, d] = x.date.slice(0, 10).split('-').map(Number); return (new Date(y, m - 1, d).getDay() + 6) % 7 }
  const byWeekday = DAYS.map((label, i) => {
    const g = group(t.filter((x) => dayIdx(x) === i), () => i)[0]
    return { label, n: g?.n ?? 0, pnl: g?.pnl ?? 0 }
  })
  const byHour = group(t, (x) => +x.date.slice(11, 13)).sort((a, b) => a.key - b.key)
    .map((g) => ({ label: String(g.key).padStart(2, '0') + ':00', n: g.n, pnl: g.pnl }))

  return {
    n, total, winRate: n ? (wins.length / n) * 100 : 0,
    profitFactor: grossLoss ? gross / grossLoss : gross ? Infinity : 0,
    avgWin, avgLoss, payoff: avgLoss ? avgWin / avgLoss : 0, expectancy: n ? total / n : 0,
    best: n ? Math.max(...t.map((x) => x.pnl)) : 0, worst: n ? Math.min(...t.map((x) => x.pnl)) : 0,
    maxWin, maxLoss, curve, byWeekday, byHour,
    bySymbol: group(t, (x) => x.symbol).sort((a, b) => b.pnl - a.pnl),
    bySide: group(t, (x) => (x.side === 'buy' ? 'Buy' : 'Sell')),
    byMonth: group(t, (x) => x.date.slice(0, 7)).sort((a, b) => b.key.localeCompare(a.key)),
  }
}
