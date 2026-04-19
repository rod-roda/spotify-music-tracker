import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? ''

export function Callback() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const [error, setError] = useState<string | null>(token ? null : 'Token não encontrado. Tente fazer login novamente.')

  useEffect(() => {
    if (!token) return

    axios
      .get(`${API_URL}/auth/session`, {
        params: { token },
        withCredentials: true,
      })
      .then(() => {
        window.location.href = '/'
      })
      .catch(() => {
        setError('Falha ao autenticar. Tente novamente.')
      })
  }, [token])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff', background: '#16141e' }}>
        <p>{error}</p>
        <a href="/" style={{ color: '#818cf8', marginTop: '1rem' }}>Voltar ao início</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff', background: '#16141e' }}>
      <p>Autenticando...</p>
    </div>
  )
}
