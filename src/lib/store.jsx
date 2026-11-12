import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { useAuth } from './auth.jsx'

const LOCAL_KEY = 'fund-panel-v1'
const BUCKET = 'screenshots'

// ---- DB <-> uygulama dönüşümleri ----
const num = (v) => (v == null ? null : Number(v))
const toLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }

const fromAccount = (r) => ({
  id: r.id, name: r.name, firm: r.firm ?? '', startBalance: num(r.start_balance),
  maxDDPct: num(r.max_dd_pct), dailyDDPct: num(r.daily_dd_pct), profitTargetPct: num(r.profit_target_pct), status: r.status,
})
const toAccount = (a) => ({
  name: a.name, firm: a.firm || null, start_balance: a.startBalance, max_dd_pct: a.maxDDPct,
  daily_dd_pct: a.dailyDDPct, profit_target_pct: a.profitTargetPct, ...(a.status ? { status: a.status } : {}),
})
const fromTrade = (r) => ({
  id: r.id, accountId: r.account_id, date: toLocal(r.opened_at), symbol: r.symbol, side: r.side,
  entry: num(r.entry_price), exit: num(r.exit_price), size: num(r.size), pnl: num(r.pnl),
  pips: num(r.pips) ?? 0, note: r.note ?? '', screenshot: r.screenshot_url ?? '',
})
const fromAnalysis = (r) => ({ id: r.id, date: r.analysis_date, title: r.title ?? '', body: r.body ?? '', images: r.images ?? [] })
const toTrade = (t, screenshot) => ({
  account_id: t.accountId, opened_at: new Date(t.date).toISOString(), symbol: t.symbol, side: t.side,
  entry_price: t.entry, exit_price: t.exit, size: t.size, pnl: t.pnl, pips: t.pips,
  note: t.note || null, screenshot_url: screenshot || null,
})

// Supabase tek istekte en fazla 1000 satır döner; sayfa sayfa çekiyoruz.
async function fetchAll(table, col) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').order(col).order('id').range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

// ---- Ekran görüntüsü (özel bucket, yol: <user_id>/<uuid>.jpg) ----
const isPath = (s) => s && !s.startsWith('data:') && !/^https?:/.test(s)
async function uploadShot(userId, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}
async function signUrl(path) {
  if (!path) return ''
  if (!isPath(path)) return path // harici URL
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

const readLocal = () => {
  try { const r = JSON.parse(localStorage.getItem(LOCAL_KEY)); return r?.accounts?.length ? r : null } catch { return null }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [db, setDb] = useState({ accounts: [], trades: [], analyses: [], analysesOk: true })
  const [state, setState] = useState({ loading: true, error: '' })
  const [local, setLocal] = useState(readLocal)

  const load = useCallback(async () => {
    setState({ loading: true, error: '' })
    try {
      // Analiz tablosu kurulmamışsa uygulamanın geri kalanı yine çalışır.
      const [a, t, n] = await Promise.all([
        fetchAll('accounts', 'created_at'), fetchAll('trades', 'opened_at'),
        fetchAll('analyses', 'created_at').then((r) => ({ ok: true, r })).catch(() => ({ ok: false, r: [] })),
      ])
      setDb({ accounts: a.map(fromAccount), trades: t.map(fromTrade), analyses: n.r.map(fromAnalysis), analysesOk: n.ok })
      setState({ loading: false, error: '' })
    } catch (e) {
      setState({ loading: false, error: e.message || 'Veriler yüklenemedi' })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const actions = useMemo(() => ({
    async addAccount(a) {
      const { data, error } = await supabase.from('accounts').insert(toAccount(a)).select().single()
      if (error) throw error
      setDb((s) => ({ ...s, accounts: [...s.accounts, fromAccount(data)] }))
    },
    async addTrade(t) {
      const path = t.screenshot?.startsWith('data:') ? await uploadShot(user.id, t.screenshot) : t.screenshot
      const { data, error } = await supabase.from('trades').insert(toTrade(t, path)).select().single()
      if (error) {
        if (isPath(path)) supabase.storage.from(BUCKET).remove([path])
        throw error
      }
      setDb((s) => ({ ...s, trades: [...s.trades, fromTrade(data)] }))
    },
    async deleteTrade(id) {
      const t = db.trades.find((x) => x.id === id)
      const { error } = await supabase.from('trades').delete().eq('id', id)
      if (error) throw error
      if (t && isPath(t.screenshot)) supabase.storage.from(BUCKET).remove([t.screenshot])
      setDb((s) => ({ ...s, trades: s.trades.filter((x) => x.id !== id) }))
    },
    signUrl,
    async signUrls(paths) {
      if (!paths.length) return {}
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
      return Object.fromEntries((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
    },
    // images: yeni görüntüler data URL, mevcutlar storage yolu
    async saveAnalysis({ id, date, title, body, images }) {
      const paths = []
      for (const im of images) paths.push(im.startsWith('data:') ? await uploadShot(user.id, im) : im)
      const row = { analysis_date: date, title: title || null, body: body || null, images: paths }
      const q = id ? supabase.from('analyses').update(row).eq('id', id) : supabase.from('analyses').insert(row)
      const { data, error } = await q.select().single()
      if (error) throw error
      const prev = id ? db.analyses.find((x) => x.id === id) : null
      const gone = prev ? prev.images.filter((p) => !paths.includes(p)) : []
      if (gone.length) supabase.storage.from(BUCKET).remove(gone)
      const item = fromAnalysis(data)
      setDb((s) => ({ ...s, analyses: id ? s.analyses.map((x) => (x.id === id ? item : x)) : [...s.analyses, item] }))
    },
    async deleteAnalysis(id) {
      const a = db.analyses.find((x) => x.id === id)
      const { error } = await supabase.from('analyses').delete().eq('id', id)
      if (error) throw error
      if (a?.images.length) supabase.storage.from(BUCKET).remove(a.images)
      setDb((s) => ({ ...s, analyses: s.analyses.filter((x) => x.id !== id) }))
    },
    // Tarayıcıdaki (localStorage) eski veriyi Supabase'e taşır.
    async importLocal() {
      const src = readLocal()
      if (!src) return
      const idMap = {}
      for (const a of src.accounts) {
        const { data, error } = await supabase.from('accounts').insert(toAccount(a)).select().single()
        if (error) throw error
        idMap[a.id] = data.id
      }
      const rows = []
      for (const t of src.trades) {
        if (!idMap[t.accountId]) continue
        const path = t.screenshot?.startsWith('data:') ? await uploadShot(user.id, t.screenshot) : t.screenshot
        rows.push(toTrade({ ...t, accountId: idMap[t.accountId] }, path))
      }
      for (let i = 0; i < rows.length; i += 50) {
        const { error } = await supabase.from('trades').insert(rows.slice(i, i + 50))
        if (error) throw error
      }
      // Silmiyoruz, yedek olarak yeniden adlandırıyoruz.
      localStorage.setItem(LOCAL_KEY + '-imported', localStorage.getItem(LOCAL_KEY))
      localStorage.removeItem(LOCAL_KEY)
      setLocal(null)
      await load()
    },
  }), [user, db.trades, db.analyses, load])

  if (state.loading)
    return <div className="grid min-h-screen place-items-center text-sm text-slate-400">Yükleniyor…</div>
  if (state.error)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-3">
          <p className="text-down">Veriler yüklenemedi: {state.error}</p>
          <button onClick={load} className="rounded-md bg-brand px-4 py-2 text-sm text-white">Tekrar dene</button>
        </div>
      </div>
    )

  const localCount = !db.accounts.length && local ? { accounts: local.accounts.length, trades: local.trades.length } : null
  return <Ctx.Provider value={{ ...db, ...actions, localCount }}>{children}</Ctx.Provider>
}
