import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../lib/metrics.js'

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border border-line bg-ink-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{d.date ? `${d.date}, ${d.symbol}` : 'Başlangıç'}</p>
      <p className="num mt-0.5 text-sm font-semibold text-white">{money(d.balance)}</p>
    </div>
  )
}

export default function EquityChart({ data, start, floor }) {
  const color = data[data.length - 1].balance >= start ? '#22ab94' : '#f23645'
  const vals = data.map((d) => d.balance)
  const lo = Math.min(floor, ...vals), hi = Math.max(start, ...vals)
  const pad = (hi - lo) * 0.08 || 100
  const tick = { fill: '#787b86', fontSize: 11 }

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="n" tick={tick} tickLine={false} axisLine={false} />
          <YAxis domain={[lo - pad, hi + pad]} tick={tick} tickLine={false} axisLine={false} width={54}
                 tickFormatter={(v) => '$' + (v / 1000).toFixed(1) + 'k'} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={start} stroke="#787b86" strokeDasharray="4 4" />
          <ReferenceLine y={floor} stroke="#f23645" strokeDasharray="4 4"
                         label={{ value: 'Max DD limiti', fill: '#f23645', fontSize: 11, position: 'insideBottomRight' }} />
          <Area type="monotone" dataKey="balance" stroke={color} strokeWidth={2} fill="url(#eq)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
