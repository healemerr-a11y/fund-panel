import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = henüz kontrol edilmedi

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, signOut: () => supabase.auth.signOut() }}>
      {children}
    </Ctx.Provider>
  )
}
