import { createClient } from '@supabase/supabase-js'

// Publishable (anon) anahtar tarayıcıda görünmek üzere tasarlanmıştır.
// Veriyi koruyan şey giriş sistemi ve tablolardaki RLS kurallarıdır.
// service_role / secret key'i ASLA buraya koyma.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://frlrtwnjfmrmrkppojca.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_aCzgX1HcqS1dwbpm8wxlLQ_CfcXWY33'
)
