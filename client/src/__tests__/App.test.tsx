import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import Login from '../components/Login'

/**
 * Installs a fake fetch that resolves config/verify calls so App can render
 * the login screen deterministically (no real network in jsdom).
 */
function mockFetch({ tokenValid = false }: { tokenValid?: boolean } = {}) {
  const fetchMock = vi.fn((url: string) => {
    if (String(url).includes('/api/config')) {
      return Promise.resolve({ json: () => Promise.resolve({ nombre_app: 'CASHFLOW-POS' }) } as Response)
    }
    if (String(url).includes('/api/auth/verificar')) {
      return Promise.resolve(
        { ok: tokenValid, status: tokenValid ? 200 : 401, json: () => Promise.resolve({}) } as Response
      )
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('shows the login screen when there is no valid session (single Router)', async () => {
    mockFetch({ tokenValid: false })
    render(<App />)
    // App.tsx already wraps its own BrowserRouter; we must NOT wrap it again.
    expect(await screen.findByText(/Inicia sesión/i)).toBeInTheDocument()
  })

  it('clears stale token and shows login when verification fails', async () => {
    mockFetch({ tokenValid: false })
    localStorage.setItem('token', 'expired-token')
    render(<App />)
    expect(await screen.findByText(/Inicia sesión/i)).toBeInTheDocument()
  })
})

describe('Login form', () => {
  it('renders credential inputs and submit button', () => {
    render(<Login onLogin={() => {}} />)
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty fields (no fetch)', () => {
    const onLogin = vi.fn()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<Login onLogin={onLogin} />)

    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    expect(screen.getByText(/Completa todos los campos/i)).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls login endpoint and onLogin on valid submit', async () => {
    const onLogin = vi.fn()
    const user = { username: 'admin', rol: 'admin' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-token', usuario: user }),
    }))
    render(<Login onLogin={onLogin} />)

    fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('jwt-token', user))
    expect(localStorage.getItem('token')).toBe('jwt-token')
  })
})
