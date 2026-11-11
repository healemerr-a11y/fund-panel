export const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD (yerel gün)
export const money = (n, d = 2) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const pct = (n) => (n > 0 ? '+' : '') + n.toFixed(2) + '%'
export const pnlCls = (n) => (n > 0 ? 'text-up' : n < 0 ? 'text-down' : 'text-slate-400')

// Tüm hesap metrikleri tradelerden türetilir; bakiye ayrıca saklanmaz.
// Max DD ve Daily DD limitleri başlangıç bakiyesi üzerinden hesaplanır (statik).
export function computeMetrics(account, allTrades) {
  const trades = allTrades.filter((t) => t.accountId === account.id).sort((a, b) => a.date.localeCompare(b.date))
  const start = account.startBalance
  const maxLimit = (start * account.maxDDPct) / 100
  const dailyLimit = (start * account.dailyDDPct) / 100
  const floor = start - maxLimit

  let bal = start, minBal = start, wins = 0
  const byDay = {}
  const curve = [{ n: 0, balance: start }]
  trades.forEach((t, i) => {
    bal += t.pnl
    minBal = Math.min(minBal, bal)
    if (t.pnl > 0) wins++
    const d = t.date.slice(0, 10)
    byDay[d] = (byDay[d] || 0) + t.pnl
    curve.push({ n: i + 1, date: d, symbol: t.symbol, balance: bal })
  })

  const totalPnl = bal - start
  const todayPnl = byDay[today()] || 0
  const maxUsed = Math.max(0, start - bal)
  const dailyUsed = Math.max(0, -todayPnl)
  const worstDay = Math.min(0, ...Object.values(byDay))

  return {
    start, balance: bal, totalPnl, pnlPct: (totalPnl / start) * 100, todayPnl,
    maxLimit, maxUsed, maxPct: (maxUsed / maxLimit) * 100,
    dailyLimit, dailyUsed, dailyPct: (dailyUsed / dailyLimit) * 100,
    floor, curve, count: trades.length, winRate: trades.length ? (wins / trades.length) * 100 : 0,
    breached: minBal <= floor || -worstDay >= dailyLimit, // geçmişte bir kez bile aşıldıysa kalıcı ihlal
  }
}

// Elle seçilen durum (Başarılı / Failed) önceliklidir; aksi halde metriklerden türetilir.
export function resolveStatus(account, m) {
  if (account.status !== 'active') return account.status
  if (m.breached) return 'failed'
  if (account.profitTargetPct && m.pnlPct >= account.profitTargetPct) return 'passed'
  return 'active'
}
