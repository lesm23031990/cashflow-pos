import { useState } from 'react'
import { login } from '../api'

interface Props {
  onLogin: (token: string, usuario: { username: string; rol: string }) => void
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    setError('')
    login(username.trim(), password)
      .then(res => {
        localStorage.setItem('token', res.token)
        localStorage.setItem('usuario', JSON.stringify(res.usuario))
        onLogin(res.token, res.usuario)
      })
      .catch(err => {
        setError(err.message || 'Error al iniciar sesión')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0f172a'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1e293b', padding: '32px', borderRadius: '12px',
        width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: '#f1f5f9', marginBottom: '8px', fontSize: '1.5rem', textAlign: 'center' }}>
          Admin - Precios
        </h1>
        <p style={{ color: '#64748b', marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          Inicia sesión para continuar
        </p>

        {error && (
          <div style={{
            background: '#7f1d1d', color: '#fca5a5', padding: '8px 12px',
            borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: '6px',
              background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: '6px',
              background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '10px', border: 'none', borderRadius: '6px',
            background: '#06b6d4', color: '#0f172a', fontSize: '0.9rem', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
