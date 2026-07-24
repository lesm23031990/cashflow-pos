import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Toast from './Toast'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {

  it('debe mostrar el mensaje', () => {
    render(<Toast message="Producto guardado" onClose={() => {}} />)
    expect(screen.getByText('Producto guardado')).toBeInTheDocument()
  })

  it('debe mostrar el mensaje de error con clase error', () => {
    render(<Toast message="Error al guardar" error onClose={() => {}} />)
    const el = screen.getByText('Error al guardar')
    expect(el.className).toContain('error')
  })

  it('debe llamar a onClose después de 2 segundos', () => {
    const onClose = vi.fn()
    render(<Toast message="Auto cerrar" onClose={onClose} />)

    expect(onClose).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(2000) })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

})
