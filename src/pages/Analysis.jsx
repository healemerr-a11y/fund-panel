import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../lib/store.jsx'
import { analyze } from '../lib/analytics.js'
import { money, pnlCls } from '../lib/metrics.js'
import { StatCard, inputCls } from '../components/ui.jsx'

const tick = { fill: '#787b86', fontSize: 11 }
const box = 'rounded-lg border border-line bg-ink-800 p-4 sm:p-5'
const fmtPF = (v) => (v === Infinity ? '∞' : v.toFixed(2))

function Bars({ data }) {
  return (
    <div className="h-52">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => '$' + v} />
          <ReferenceLine y={0} stroke="#787b86" />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return <div className="rounded-md border border-line bg-ink-900 px-3 py-2 text-xs"><p className="text-slate-400">{d.label}, {d.n} işlem</p><p className={`num text-sm font-semibold ${pnlCls(d.pnl)}`}>{money(d.pnl)}</p></div>
          }} />
          <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#22ab94' : '#f23645'} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Rows({ title, rows, label = (r) => r.key }) {
  return (
    <section className={box}>
      <h2 className="mb-3 text-sm font-medium text-slate-300">{title}</h2>
      <div className="overflow-x-auto">
        <table className="num w-full min-w-[420px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs text-slate-400">
            {['', 'İşlem', 'Win rate', 'Ort. K/Z', 'Toplam K/Z'].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.key} className="border-b border-line/60 last:border-0">
              <td className="py-2 pr-3 font-medium text-white">{label(r)}</td>
              <td className="py-2 pr-3">{r.n}</td>
              <td className="py-2 pr-3">{r.winRate.toFixed(0)}%</td>
              <td className={`py-2 pr-3 ${pnlCls(r.avg)}`}>{money(r.avg)}</td>
              <td className={`py-2 font-medium ${pnlCls(r.pnl)}`}>{money(r.pnl)}</td>
            </tr>))}</tbody>
      </table></div>
    </section>
  )
}

export default function Analysis() {
  const { accounts, trades } = useStore()
  const [acc, setAcc] = useState('all')
  const a = useMemo(() => analyze(acc === 'all' ? trades : trades.filter((t) => t.accountId === acc)), [acc, trades])
  const color = a.total >= 0 ? '#22ab94' : '#f23645'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Analiz</h1>
        <select value={acc} onChange={(e) => setAcc(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Hesap">
          <option value="all">Tüm hesaplar</option>
          {accounts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>

      {!a.n ? (
        <p className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-slate-400">Analiz için henüz trade yok.</p>
      ) : (<>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Toplam K/Z" value={money(a.total)} cls={pnlCls(a.total)} sub={`${a.n} işlem`} />
          <StatCard label="Win rate" value={`${a.winRate.toFixed(0)}%`} />
          <StatCard label="Profit factor" value={fmtPF(a.profitFactor)} sub="brüt kâr / brüt zarar" />
          <StatCard label="Beklenti / işlem" value={money(a.expectancy)} cls={pnlCls(a.expectancy)} />
          <StatCard label="Ort. kazanç" value={money(a.avgWin)} cls="text-up" />
          <StatCard label="Ort. kayıp" value={money(-a.avgLoss)} cls="text-down" />
          <StatCard label="Kazanç/kayıp oranı" value={a.payoff.toFixed(2)} sub="ort. kazanç / ort. kayıp" />
          <StatCard label="En iyi / en kötü" value={money(a.best, 0)} sub={`en kötü ${money(a.worst, 0)}`} cls="text-up" />
          <StatCard label="En uzun kazanç serisi" value={a.maxWin} />
          <StatCard label="En uzun kayıp serisi" value={a.maxLoss} cls={a.maxLoss >= 3 ? 'text-down' : 'text-white'} />
        </div>

        <section className={box}>
          <h2 className="mb-4 text-sm font-medium text-slate-300">Kümülatif K/Z</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={a.curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs><linearGradient id="cum" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="n" tick={tick} tickLine={false} axisLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => '$' + v} />
                <ReferenceLine y={0} stroke="#787b86" strokeDasharray="4 4" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return <div className="rounded-md border border-line bg-ink-900 px-3 py-2 text-xs"><p className="text-slate-400">{d.date}, {d.symbol}</p><p className="num text-sm font-semibold text-white">{money(d.cum)}</p></div>
                }} />
                <Area type="monotone" dataKey="cum" stroke={color} strokeWidth={2} fill="url(#cum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={box}><h2 className="mb-3 text-sm font-medium text-slate-300">Haftanın gününe göre K/Z</h2><Bars data={a.byWeekday} /></section>
          <section className={box}><h2 className="mb-3 text-sm font-medium text-slate-300">Saate göre K/Z</h2><Bars data={a.byHour} /></section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Rows title="Enstrümana göre" rows={a.bySymbol} />
          <div className="space-y-6">
            <Rows title="Yöne göre" rows={a.bySide} />
            <Rows title="Aylık" rows={a.byMonth} />
          </div>
        </div>
      </>)}
    </div>
  )
}
