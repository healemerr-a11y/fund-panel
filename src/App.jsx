import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import AccountDetail from './pages/AccountDetail.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './lib/auth.jsx'
import { StoreProvider } from './lib/store.jsx'

export default function App() {
  const { session, user } = useAuth()
  if (session === undefined) return <div className="grid min-h-screen place-items-center text-sm text-slate-400">Yükleniyor…</div>
  if (!session) return <Login />
  return (
    <StoreProvider key={user.id}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}
