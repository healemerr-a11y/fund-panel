import { useEffect, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { Field, inputCls, btnPrimary } from './ui.jsx'

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30', 'BTCUSD']
const pipSize = (s) => (/JPY/.test(s) ? 0.01 : /XAU/.test(s) ? 0.1 : /NAS|US30|US100|SPX|BTC/.test(s) ? 1 : 0.0001)
const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// Ekran görüntüsünü 1280px JPEG'e küçültür (localStorage şişmesin diye).
async function shrink(file, max = 1280) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.8)
}

export default function TradeForm({ accountId, onDone }) {
  const { addTrade } = useStore()
  const [f, setF] = useState({
    date: nowLocal(), symbol: 'EURUSD', side: 'buy', entry: '', exit: '',
    size: '', pnl: '', pips: '', note: '', screenshot: '',
  })
  const [pipsEdited, setPipsEdited] = useState(false)
  const [imgMode, setImgMode] = useState('upload')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  // Pip, giriş/çıkıştan otomatik önerilir; elle değiştirirsen dokunmaz.
  useEffect(() => {
    if (pipsEdited || f.entry === '' || f.exit === '') return
    const dir = f.side === 'buy' ? 1 : -1
    const pips = ((+f.exit - +f.entry) * dir) / pipSize(f.symbol)
    setF((s) => ({ ...s, pips: pips.toFixed(1) }))
  }, [f.entry, f.exit, f.side, f.symbol, pipsEdited])

  const pick = async (file) => {
    if (!file?.type.startsWith('image/')) return
    const url = await shrink(file)
    setF((s) => ({ ...s, screenshot: url }))
  }
  // TradingView'den kopyalanan görüntü Ctrl+V ile doğrudan yapıştırılabilir.
  const onPaste = (e) => {
    const file = [...e.clipboardData.files].find((x) => x.type.startsWith('image/'))
    if (file) { e.preventDefault(); pick(file) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await addTrade({
        accountId, date: f.date, symbol: f.symbol.trim(), side: f.side,
        entry: +f.entry, exit: +f.exit, size: +f.size, pnl: +f.pnl, pips: +f.pips || 0,
        note: f.note.trim(), screenshot: f.screenshot,
      })
      onDone()
    } catch (e2) { setErr(e2.message || 'Kaydedilemedi'); setBusy(false) }
  }

  return (
    <form onSubmit={submit} onPaste={onPaste} className="grid gap-4 sm:grid-cols-2">
      <Field label="İşlem tarihi">
        <input type="datetime-local" required className={inputCls} value={f.date} onChange={set('date')} />
      </Field>
      <Field label="Enstrüman">
        <input list="symbols" required className={inputCls} placeholder="EURUSD" value={f.symbol}
               onChange={(e) => setF((s) => ({ ...s, symbol: e.target.value.toUpperCase() }))} />
        <datalist id="symbols">{SYMBOLS.map((s) => <option key={s} value={s} />)}</datalist>
      </Field>

      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400">İşlem yönü</span>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-ink-950 p-1">
          {['buy', 'sell'].map((s) => (
            <button type="button" key={s} onClick={() => setF((x) => ({ ...x, side: s }))}
              className={`rounded py-1.5 text-sm font-semibold ${f.side === s ? (s === 'buy' ? 'bg-up text-ink-950' : 'bg-down text-white') : 'text-slate-400 hover:text-white'}`}>
              {s === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>
      </div>

      <Field label="Giriş fiyatı"><input type="number" step="any" required className={inputCls} value={f.entry} onChange={set('entry')} /></Field>
      <Field label="Çıkış fiyatı"><input type="number" step="any" required className={inputCls} value={f.exit} onChange={set('exit')} /></Field>
      <Field label="Lot / boyut"><input type="number" step="any" min="0" required className={inputCls} value={f.size} onChange={set('size')} /></Field>
      <Field label="Pip (otomatik hesaplanır, değiştirebilirsin)">
        <input type="number" step="any" className={inputCls} value={f.pips}
               onChange={(e) => { setPipsEdited(e.target.value !== ''); set('pips')(e) }} />
      </Field>
      <Field label="Kâr/zarar ($), zarar için eksi yaz" className="sm:col-span-2">
        <input type="number" step="any" required className={inputCls} placeholder="-250 veya 400" value={f.pnl} onChange={set('pnl')} />
      </Field>

      <Field label="İşlem notu" className="sm:col-span-2">
        <textarea rows={3} className={inputCls} placeholder="Neden girdin? Plana uydun mu?" value={f.note} onChange={set('note')} />
      </Field>

      <div className="sm:col-span-2">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Ekran görüntüsü</span>
          <span className="flex gap-3">
            <button type="button" onClick={() => setImgMode('upload')} className={imgMode === 'upload' ? 'text-brand-soft' : 'hover:text-white'}>Dosya</button>
            <button type="button" onClick={() => setImgMode('url')} className={imgMode === 'url' ? 'text-brand-soft' : 'hover:text-white'}>URL</button>
          </span>
        </div>
        {imgMode === 'upload' ? (
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-line bg-ink-950 py-6 text-sm text-slate-400 hover:border-brand-soft/60">
            <ImagePlus size={20} />
            Dosya seç veya Ctrl+V ile yapıştır
            <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
          </label>
        ) : (
          <input className={inputCls} placeholder="https://..." value={f.screenshot.startsWith('data:') ? '' : f.screenshot} onChange={set('screenshot')} />
        )}
        {f.screenshot && (
          <div className="relative mt-2 inline-block">
            <img src={f.screenshot} alt="Ekran görüntüsü önizleme" className="max-h-40 rounded-md border border-line" />
            <button type="button" aria-label="Görüntüyü kaldır" onClick={() => setF((s) => ({ ...s, screenshot: '' }))}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X size={14} /></button>
          </div>
        )}
      </div>

      {err && <p className="text-sm text-down sm:col-span-2">{err}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Vazgeç</button>
        <button disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>{busy ? 'Kaydediliyor…' : 'Trade ekle'}</button>
      </div>
    </form>
  )
}
