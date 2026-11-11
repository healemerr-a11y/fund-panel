import { useEffect, useState } from 'react'
import { Image as ImageIcon, Trash2 } from 'lucide-react'
import { Modal } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import { money, pnlCls } from '../lib/metrics.js'

const Item = ({ k, v, cls = 'text-white' }) => (
  <div><dt className="text-xs text-slate-400">{k}</dt><dd className={`num mt-0.5 font-medium ${cls}`}>{v}</dd></div>
)

export default function TradeTable({ trades }) {
  const { deleteTrade, signUrl } = useStore()
  const [sel, setSel] = useState(null)
  const [zoom, setZoom] = useState(false)
  const [img, setImg] = useState('')

  // Ekran görüntüleri özel bucket'ta; açılınca süreli adres alınır.
  useEffect(() => {
    setImg('')
    if (!sel?.screenshot) return
    let live = true
    signUrl(sel.screenshot).then((u) => live && setImg(u))
    return () => { live = false }
  }, [sel?.id, sel?.screenshot, signUrl])

  if (!trades.length)
    return <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-slate-400">Henüz trade yok. İlk işlemini ekleyerek equity curve'ü başlat.</div>

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-line bg-ink-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-slate-400">
              {['Tarih', 'Enstrüman', 'Yön', 'Giriş', 'Çıkış', 'Lot', 'Pip', 'K/Z', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} onClick={() => setSel(t)} className="num cursor-pointer border-b border-line/60 last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-slate-400">{t.date.replace('T', ' ')}</td>
                <td className="px-4 py-3 font-medium text-white">{t.symbol}</td>
                <td className={`px-4 py-3 ${t.side === 'buy' ? 'text-up' : 'text-down'}`}>{t.side === 'buy' ? 'Buy' : 'Sell'}</td>
                <td className="px-4 py-3">{t.entry}</td>
                <td className="px-4 py-3">{t.exit}</td>
                <td className="px-4 py-3">{t.size}</td>
                <td className={`px-4 py-3 ${pnlCls(t.pips)}`}>{t.pips}</td>
                <td className={`px-4 py-3 font-medium ${pnlCls(t.pnl)}`}>{money(t.pnl)}</td>
                <td className="px-4 py-3 text-slate-400">{t.screenshot && <ImageIcon size={15} aria-label="Ekran görüntüsü var" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} wide title={sel ? `${sel.symbol} ${sel.side === 'buy' ? 'Buy' : 'Sell'}` : ''}>
        {sel && (
          <div className="space-y-4">
            {sel.screenshot ? (img ? <img src={img} alt="Trade ekran görüntüsü" onClick={() => setZoom(true)}
                   className="max-h-[60vh] w-full cursor-zoom-in rounded-md border border-line bg-black object-contain" /> : <p className="grid h-40 place-items-center text-sm text-slate-400">Görüntü yükleniyor…</p>
            ) : <p className="text-sm text-slate-400">Bu işleme ekran görüntüsü eklenmemiş.</p>}
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Item k="Giriş" v={sel.entry} /><Item k="Çıkış" v={sel.exit} /><Item k="Lot" v={sel.size} />
              <Item k="Pip" v={sel.pips} cls={pnlCls(sel.pips)} /><Item k="K/Z" v={money(sel.pnl)} cls={pnlCls(sel.pnl)} />
            </dl>
            {sel.note && <p className="whitespace-pre-wrap rounded-md bg-ink-800 p-3 text-sm text-slate-300">{sel.note}</p>}
            <button onClick={async () => { if (!confirm('Bu trade silinsin mi?')) return; try { await deleteTrade(sel.id); setSel(null) } catch (e) { alert(e.message) } }}
                    className="inline-flex items-center gap-1.5 text-sm text-down hover:underline"><Trash2 size={14} /> Trade'i sil</button>
          </div>
        )}
      </Modal>

      {zoom && img && (
        <div className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <img src={img} alt="Trade ekran görüntüsü, büyük" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  )
}
