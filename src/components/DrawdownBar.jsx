import { AlertTriangle } from 'lucide-react'
import { money } from '../lib/metrics.js'

// İşaretler %60 (sarı) ve %85 (kırmızı) eşiklerini gösterir.
export default function DrawdownBar({ label, used, limit, pct }) {
  const p = Math.min(100, Math.max(0, pct))
  const level = p >= 85 ? 'down' : p >= 60 ? 'warn' : 'ok'
  const bar = { down: 'bg-down', warn: 'bg-amber-400', ok: 'bg-up' }[level]
  const txt = { down: 'text-down', warn: 'text-amber-400', ok: 'text-up' }[level]

  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`num mt-0.5 text-2xl font-semibold ${txt}`}>{money(Math.max(0, limit - used))}</p>
      <p className="num text-xs text-slate-400">limite kalan, {money(used)} / {money(limit, 0)} kullanıldı</p>
      <div
        className="relative mt-3 h-3 rounded-sm bg-ink-700"
        role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}
      >
        <div className={`h-full rounded-sm transition-[width] ${bar}`} style={{ width: `${p}%` }} />
        <span className="absolute inset-y-0 left-[60%] w-px bg-white/25" />
        <span className="absolute inset-y-0 left-[85%] w-px bg-white/25" />
      </div>
      {level === 'down' && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-down">
          <AlertTriangle size={13} /> Limite yaklaştın, %{(100 - p).toFixed(0)} pay kaldı.
        </p>
      )}
    </div>
  )
}
