import { useEffect, useState } from 'react'
import { Check as CheckIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { inputCls } from '../components/ui.jsx'

const KEY = 'fund-panel-checklist'
// İlk açılışta gelen örnek maddeler; "Düzenle" ile kendi maddelerinle değiştirebilirsin.
const DEFAULTS = [
  'Likidite alımı oldu',
  'Box (range) oluştu',
  'Market structure shift (MSS) geldi',
  'Giriş bölgesi (FVG / OB) işaretlendi',
  'Haber kontrol edildi',
  'Stop yeri net, R:R en az 1:2',
]

const load = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v) && v.length) return v } catch { /* ilk açılış */ }
  return DEFAULTS
}

export default function Check() {
  const [items, setItems] = useState(load)
  const [done, setDone] = useState([]) // işaretlenenler kaydedilmez, sayfa yenilenince sıfırlanır
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* yoksay */ } }, [items])

  const toggle = (it) => setDone((d) => (d.includes(it) ? d.filter((x) => x !== it) : [...d, it]))
  const add = (e) => {
    e.preventDefault()
    const v = text.trim()
    if (v && !items.includes(v)) setItems([...items, v])
    setText('')
  }
  const remove = (it) => { setItems(items.filter((x) => x !== it)); setDone(done.filter((x) => x !== it)) }

  const count = items.filter((i) => done.includes(i)).length
  const ready = items.length > 0 && count === items.length

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Kontrol</h1>
        <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5">
          <Pencil size={14} /> {editing ? 'Bitti' : 'Düzenle'}
        </button>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${ready ? 'border-up/50 bg-up/10 text-up' : 'border-line bg-ink-800 text-slate-300'}`}>
        {ready ? 'Tüm şartlar tamam, hazırsın.' : `${count} / ${items.length} şart tamam`}
      </div>

      <ul className="space-y-2">
        {items.map((it) => {
          const on = done.includes(it)
          return (
            <li key={it} className="flex items-center gap-2">
              <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 transition-colors ${on ? 'border-up/50 bg-up/10' : 'border-line bg-ink-800 hover:border-slate-500'}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(it)} className="peer sr-only" />
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? 'border-up bg-up text-white' : 'border-slate-500'} peer-focus-visible:ring-2 peer-focus-visible:ring-brand-soft`}>
                  {on && <CheckIcon size={14} strokeWidth={3} />}
                </span>
                <span className={on ? 'text-white' : 'text-slate-300'}>{it}</span>
              </label>
              {editing && <button onClick={() => remove(it)} aria-label={`${it} maddesini sil`} className="rounded p-2 text-slate-400 hover:bg-white/5 hover:text-down"><Trash2 size={16} /></button>}
            </li>
          )
        })}
      </ul>

      {editing && (
        <form onSubmit={add} className="flex gap-2">
          <input className={inputCls} placeholder="Yeni madde ekle" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="inline-flex items-center gap-1 rounded-md bg-brand px-4 text-sm font-medium text-white"><Plus size={16} /> Ekle</button>
        </form>
      )}

      <button onClick={() => setDone([])} className="w-full rounded-lg bg-brand py-3 font-medium text-white hover:opacity-90">Tamam</button>
    </div>
  )
}
