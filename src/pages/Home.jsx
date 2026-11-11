import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { computeMetrics, resolveStatus, money, pct, pnlCls } from '../lib/metrics.js'
import AccountCard from '../components/AccountCard.jsx'
import AccountForm from '../components/AccountForm.jsx'
import ImportBanner from '../components/ImportBanner.jsx'
import { Modal, StatCard, btnPrimary } from '../components/ui.jsx'

export default function Home() {
  const { accounts, trades } = useStore()
  const [adding, setAdding] = useState(false)

  const rows = accounts.map((a) => {
    const m = computeMetrics(a, trades)
    return { a, m, s: resolveStatus(a, m) }
  })
  const sum = (k) => rows.reduce((t, r) => t + r.m[k], 0)
  const totalStart = rows.reduce((t, r) => t + r.m.start, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Genel bakış</h1>
        <button onClick={() => setAdding(true)} className={btnPrimary}><Plus size={16} /> Hesap ekle</button>
      </div>

      <ImportBanner />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Toplam bakiye" value={money(sum('balance'))} />
        <StatCard label="Toplam K/Z" value={money(sum('totalPnl'))} cls={pnlCls(sum('totalPnl'))}
                  sub={totalStart ? pct((sum('totalPnl') / totalStart) * 100) : ''} />
        <StatCard label="Bugün" value={money(sum('todayPnl'))} cls={pnlCls(sum('todayPnl'))} />
        <StatCard label="Aktif hesap" value={rows.filter((r) => r.s === 'active').length} sub={`${rows.length} hesaptan`} />
      </div>

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => <AccountCard key={r.a.id} account={r.a} m={r.m} status={r.s} />)}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-slate-400">Henüz hesap yok. İlk fon hesabını ekleyerek başla.</p>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Yeni fon hesabı">
        <AccountForm onDone={() => setAdding(false)} />
      </Modal>
    </div>
  )
}
