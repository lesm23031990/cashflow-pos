import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'

const mockOnLogin = vi.fn()

beforeEach(() => {
  mockOnLogin.mockClear()
  localStorage.clear()
})

function renderLogin() {
  return render(<Login onLogin={mockOnLogin} />)
}

describe('Login', () => {

  it('debe mostrar el formulario de login', () => {
    renderLogin()
    expect(screen.getByText('Admin - Precios')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('debe mostrar error si se envía vacío', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('Completa todos los campos')).toBeInTheDocument()
  })

  it('debe llamar a login y onLogin con credenciales válidas', async () => {
    const fakeToken = 'fake-token-123'
    const fakeUser = { username: 'admin', rol: 'admin' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ token: fakeToken, usuario: fakeUser }), { status: 200 })
    )

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('admin'), 'admin')
    await user.type(screen.getByPlaceholderText('••••••'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await vi.waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(fakeToken, fakeUser)
    })

    expect(localStorage.getItem('token')).toBe(fakeToken)
  })

})
