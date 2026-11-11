import { useState } from 'react'
import { CandlestickChart } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { Field, inputCls, btnPrimary } from '../components/ui.jsx'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg({ type: '', text: '' })
    const { data, error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMsg({ type: 'err', text: error.message })
    if (mode === 'signup' && !data.session)
      setMsg({ type: 'ok', text: 'Kayıt oluşturuldu. E-postana gelen doğrulama bağlantısına tıkla, sonra giriş yap.' })
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-line bg-ink-800 p-6">
        <div className="flex items-center gap-2 text-white">
          <CandlestickChart size={20} className="text-brand-soft" />
          <span className="font-semibold">Fund Panel</span>
        </div>
        <Field label="E-posta"><input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Şifre (en az 6 karakter)">
          <input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                 className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {msg.text && <p className={`text-sm ${msg.type === 'err' ? 'text-down' : 'text-up'}`}>{msg.text}</p>}
        <button disabled={busy} className={`${btnPrimary} w-full justify-center disabled:opacity-60`}>
          {busy ? 'Bekle…' : mode === 'signin' ? 'Giriş yap' : 'Hesap oluştur'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg({ type: '', text: '' }) }}
                className="w-full text-center text-sm text-slate-400 hover:text-white">
          {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
        </button>
      </form>
    </div>
  )
}
