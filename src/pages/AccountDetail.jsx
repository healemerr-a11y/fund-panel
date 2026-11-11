import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { computeMetrics, resolveStatus, money, pct, pnlCls } from '../lib/metrics.js'
import DrawdownBar from '../components/DrawdownBar.jsx'
import EquityChart from '../components/EquityChart.jsx'
import TradeForm from '../components/TradeForm.jsx'
import TradeTable from '../components/TradeTable.jsx'
import { Modal, StatCard, StatusBadge, btnPrimary } from '../components/ui.jsx'

export default function AccountDetail() {
  const { id } = useParams()
  const { accounts, trades } = useStore()
  const [open, setOpen] = useState(false)

  const account = accounts.find((a) => a.id === id)
  if (!account)
    return <p className="text-slate-400">Hesap bulunamadı. <Link to="/" className="text-brand-soft hover:underline">Genel bakışa dön</Link></p>

  const m = computeMetrics(account, trades)
  const status = resolveStatus(account, m)
  const list = trades.filter((t) => t.accountId === id).sort((a, b) => b.date.localeCompare(a.date))
  const target = account.profitTargetPct
  const targetW = target ? Math.min(100, Math.max(0, (m.pnlPct / target) * 100)) : 0

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"><ArrowLeft size={14} /> Genel bakış</Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{account.name}</h1>
            <StatusBadge status={status} />
          </div>
          <button onClick={() => setOpen(true)} className={btnPrimary}><Plus size={16} /> Trade ekle</button>
        </div>
      </div>

      {/* Risk önce: bakiye + iki drawdown ölçeri */}
      <section className="grid gap-6 rounded-lg border border-line bg-ink-800 p-5 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
        <div>
          <p className="text-sm text-slate-400">Güncel bakiye</p>
          <p className="num mt-0.5 text-4xl font-semibold text-white">{money(m.balance)}</p>
          <p className={`num mt-1 text-sm ${pnlCls(m.totalPnl)}`}>{money(m.totalPnl)} ({pct(m.pnlPct)})</p>
          {target && (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                <span>Kâr hedefi %{target}</span><span className="num">%{targetW.toFixed(0)}</span>
              </div>
              <div className="h-1.5 rounded-sm bg-ink-700"><div className="h-full rounded-sm bg-brand-soft" style={{ width: `${targetW}%` }} /></div>
            </div>
          )}
        </div>
        <DrawdownBar label={`Max drawdown (limit %${account.maxDDPct})`} used={m.maxUsed} limit={m.maxLimit} pct={m.maxPct} />
        <DrawdownBar label={`Günlük drawdown (limit %${account.dailyDDPct})`} used={m.dailyUsed} limit={m.dailyLimit} pct={m.dailyPct} />
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Başlangıç bakiyesi" value={money(m.start, 0)} />
        <StatCard label="Bugün" value={money(m.todayPnl)} cls={pnlCls(m.todayPnl)} />
        <StatCard label="Win rate" value={`${m.winRate.toFixed(0)}%`} />
        <StatCard label="İşlem sayısı" value={m.count} />
      </div>

      <section className="rounded-lg border border-line bg-ink-800 p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-300">Equity curve</h2>
        {m.curve.length > 1
          ? <EquityChart data={m.curve} start={m.start} floor={m.floor} />
          : <p className="grid h-48 place-items-center text-sm text-slate-400">Grafik için ilk trade'ini ekle.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-300">İşlemler</h2>
        <TradeTable trades={list} />
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni trade">
        <TradeForm accountId={id} onDone={() => setOpen(false)} />
      </Modal>
    </div>
  )
}
