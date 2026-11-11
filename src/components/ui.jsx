import { useEffect } from 'react'
import { X } from 'lucide-react'

export const inputCls =
  'w-full rounded-md border border-line bg-ink-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-soft focus:outline-none'
export const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/85'

export const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
    {children}
  </label>
)

const STATUS = {
  active: { label: 'Aktif', cls: 'bg-brand/15 text-brand-soft ring-brand/40' },
  passed: { label: 'Başarılı', cls: 'bg-up/15 text-up ring-up/40' },
  failed: { label: 'İhlal edildi', cls: 'bg-down/15 text-down ring-down/40' },
}
export function StatusBadge({ status }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}

export function StatCard({ label, value, sub, cls = 'text-white' }) {
  return (
    <div className="rounded-lg border border-line bg-ink-800 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`num mt-1 text-xl font-semibold sm:text-2xl ${cls}`}>{value}</p>
      {sub && <p className="num mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-ink-900 shadow-2xl sm:rounded-lg ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink-900 px-5 py-3">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Kapat" className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
