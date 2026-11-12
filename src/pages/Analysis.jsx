import { useEffect, useState } from 'react'
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { shrink } from '../lib/image.js'
import { Field, Modal, inputCls, btnPrimary } from '../components/ui.jsx'

const today = () => new Date().toLocaleDateString('sv-SE')
const fmt = (d) => d.split('-').reverse().join('.')

function AnalysisForm({ item, urls, onDone }) {
  const { saveAnalysis } = useStore()
  const [f, setF] = useState({ date: item?.date ?? today(), title: item?.title ?? '', body: item?.body ?? '' })
  const [imgs, setImgs] = useState((item?.images ?? []).map((p) => ({ key: p, src: urls[p] ?? '', value: p })))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const add = async (files) => {
    const ok = [...files].filter((x) => x.type.startsWith('image/'))
    const out = await Promise.all(ok.map(async (x) => { const d = await shrink(x); return { key: crypto.randomUUID(), src: d, value: d } }))
    setImgs((s) => [...s, ...out])
  }
  const onPaste = (e) => {
    const files = [...e.clipboardData.files].filter((x) => x.type.startsWith('image/'))
    if (files.length) { e.preventDefault(); add(files) }
  }
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await saveAnalysis({ id: item?.id, ...f, title: f.title.trim(), body: f.body.trim(), images: imgs.map((i) => i.value) })
      onDone()
    } catch (e2) { setErr(e2.message || 'Kaydedilemedi'); setBusy(false) }
  }

  return (
    <form onSubmit={submit} onPaste={onPaste} className="grid gap-4 sm:grid-cols-2">
      <Field label="Tarih"><input type="date" required className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Başlık (isteğe bağlı)"><input className={inputCls} placeholder="EURUSD günlük kurgu" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>

      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400">Ekran görüntüleri</span>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-line bg-ink-950 py-6 text-sm text-slate-400 hover:border-brand-soft/60">
          <ImagePlus size={20} />
          Dosya seç (birden fazla olabilir) veya Ctrl+V ile yapıştır
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />
        </label>
        {imgs.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {imgs.map((i) => (
              <div key={i.key} className="relative">
                <img src={i.src} alt="Önizleme" className="aspect-video w-full rounded-md border border-line object-cover" />
                <button type="button" aria-label="Görüntüyü kaldır" onClick={() => setImgs((s) => s.filter((x) => x.key !== i.key))}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Field label="Analizin / beklentin" className="sm:col-span-2">
        <textarea rows={7} className={inputCls} placeholder="Bugün şunu bekliyorum..." value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </Field>

      {err && <p className="text-sm text-down sm:col-span-2">{err}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Vazgeç</button>
        <button disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
      </div>
    </form>
  )
}

export default function Analysis() {
  const { analyses, analysesOk, signUrls, deleteAnalysis } = useStore()
  const [urls, setUrls] = useState({})
  const [edit, setEdit] = useState(null) // null | 'new' | analiz
  const [zoom, setZoom] = useState('')

  const sorted = [...analyses].sort((a, b) => b.date.localeCompare(a.date))
  const key = analyses.flatMap((a) => a.images).join('|')
  useEffect(() => {
    const paths = analyses.flatMap((a) => a.images)
    let live = true
    signUrls(paths).then((m) => live && setUrls(m))
    return () => { live = false }
  }, [key, signUrls]) // eslint-disable-line

  useEffect(() => {
    if (!zoom) return
    const h = (e) => e.key === 'Escape' && setZoom('')
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [zoom])

  const remove = async (a) => {
    if (!confirm('Bu analiz silinsin mi?')) return
    try { await deleteAnalysis(a.id) } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Analiz</h1>
        {analysesOk && <button onClick={() => setEdit('new')} className={btnPrimary}><Plus size={16} /> Yeni analiz</button>}
      </div>

      {!analysesOk ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-sm text-slate-300">
          Analiz tablosu henüz kurulmamış. Supabase SQL Editor'de <code>db/analyses.sql</code> dosyasındaki kodu çalıştırıp sayfayı yenile.
        </p>
      ) : !sorted.length ? (
        <p className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-slate-400">Henüz analiz yok. İlk kurgunu ekleyerek başla.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <article key={a.id} className="rounded-lg border border-line bg-ink-800 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="num text-xs text-slate-400">{fmt(a.date)}</p>
                  {a.title && <h2 className="mt-0.5 font-semibold text-white">{a.title}</h2>}
                </div>
                <div className="flex gap-1 text-slate-400">
                  <button onClick={() => setEdit(a)} aria-label="Düzenle" className="rounded p-1.5 hover:bg-white/5 hover:text-white"><Pencil size={15} /></button>
                  <button onClick={() => remove(a)} aria-label="Sil" className="rounded p-1.5 hover:bg-white/5 hover:text-down"><Trash2 size={15} /></button>
                </div>
              </div>
              {a.images.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {a.images.map((p) => urls[p]
                    ? <img key={p} src={urls[p]} alt="Analiz görüntüsü" onClick={() => setZoom(urls[p])} className="w-full cursor-zoom-in rounded-md border border-line bg-black object-contain" />
                    : <div key={p} className="grid aspect-video place-items-center rounded-md border border-line text-xs text-slate-500">Yükleniyor…</div>)}
                </div>
              )}
              {a.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{a.body}</p>}
            </article>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit && edit !== 'new' ? 'Analizi düzenle' : 'Yeni analiz'}>
        {edit && <AnalysisForm item={edit === 'new' ? null : edit} urls={urls} onDone={() => setEdit(null)} />}
      </Modal>

      {zoom && (
        <div className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-black/90 p-4" onClick={() => setZoom('')}>
          <img src={zoom} alt="Büyük görüntü" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}
