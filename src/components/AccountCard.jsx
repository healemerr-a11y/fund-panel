import { Link } from 'react-router-dom'
import { StatusBadge } from './ui.jsx'
import { money, pct, pnlCls } from '../lib/metrics.js'

const Mini = ({ label, p }) => {
  const w = Math.min(100, Math.max(0, p))
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span><span className="num">%{w.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-sm bg-ink-700">
        <div className={`h-full rounded-sm ${w >= 85 ? 'bg-down' : w >= 60 ? 'bg-amber-400' : 'bg-up'}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  )
}

export default function AccountCard({ account: a, m, status }) {
  return (
    <Link to={`/accounts/${a.id}`} className="block rounded-lg border border-line bg-ink-800 p-5 transition-colors hover:border-brand-soft/60">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{a.name}</p>
          <p className="text-xs text-slate-400">{a.firm}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="num mt-5 text-3xl font-semibold text-white">{money(m.balance)}</p>
      <p className={`num mt-1 text-sm ${pnlCls(m.totalPnl)}`}>{money(m.totalPnl)} ({pct(m.pnlPct)})</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Mini label="Max DD kullanımı" p={m.maxPct} />
        <Mini label="Daily DD kullanımı" p={m.dailyPct} />
      </div>
    </Link>
  )
}
