import { NavLink } from 'react-router-dom'
import { CandlestickChart, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { useStore } from '../lib/store.jsx'
import { computeMetrics, resolveStatus, money } from '../lib/metrics.js'

const dot = { active: 'bg-brand-soft', passed: 'bg-up', failed: 'bg-down' }
const side = ({ isActive }) =>
  `flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
const tab = ({ isActive }) =>
  `flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-white/10 text-white' : 'text-slate-400'}`

export default function Layout({ children }) {
  const { accounts, trades } = useStore()
  const { user, signOut } = useAuth()
  const rows = accounts.map((a) => {
    const m = computeMetrics(a, trades)
    return { a, m, s: resolveStatus(a, m) }
  })

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Masaüstü: sol menü */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-1 border-r border-line bg-ink-900 p-3 lg:flex">
        <div className="mb-4 flex items-center gap-2 px-2 pt-1 text-white">
          <CandlestickChart size={20} className="text-brand-soft" />
          <span className="font-semibold">Fund Panel</span>
        </div>
        <NavLink to="/" end className={side}>
          <span className="flex items-center gap-2"><LayoutDashboard size={16} />Genel bakış</span>
        </NavLink>
        <p className="mb-1 mt-5 px-3 text-xs text-slate-500">Hesaplar</p>
        {rows.map(({ a, m, s }) => (
          <NavLink key={a.id} to={`/accounts/${a.id}`} className={side}>
            <span className="flex min-w-0 items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${dot[s]}`} />
              <span className="truncate">{a.name}</span>
            </span>
            <span className="num text-xs text-slate-500">{money(m.balance, 0)}</span>
          </NavLink>
        ))}
        <div className="mt-auto border-t border-line px-2 pt-3">
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <button onClick={signOut} className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><LogOut size={14} /> Çıkış yap</button>
        </div>
      </aside>

      {/* Mobil: üstte kaydırılabilir hesap sekmeleri */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-900/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-4 pt-3 text-white">
          <CandlestickChart size={18} className="text-brand-soft" />
          <span className="font-semibold">Fund Panel</span>
          <button onClick={signOut} aria-label="Çıkış yap" className="ml-auto text-slate-400 hover:text-white"><LogOut size={16} /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          <NavLink to="/" end className={tab}>Genel bakış</NavLink>
          {rows.map(({ a, s }) => (
            <NavLink key={a.id} to={`/accounts/${a.id}`} className={tab}>
              <span className={`size-2 rounded-full ${dot[s]}`} />{a.name}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
