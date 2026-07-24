import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, getProductos } from './api'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('api', () => {

  describe('login', () => {

    it('debe autenticar y retornar token + usuario', async () => {
      const fakeResponse = { token: 'tok123', usuario: { username: 'admin', rol: 'admin' } }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(fakeResponse), { status: 200 })
      )

      const result = await login('admin', 'admin123')
      expect(result).toEqual(fakeResponse)
    })

    it('debe lanzar error si las credenciales son inválidas', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 })
      )

      await expect(login('admin', 'wrong')).rejects.toThrow('Credenciales inválidas')
    })

  })

  describe('getProductos', () => {

    it('debe retornar lista de productos', async () => {
      const productos = [{ id: 1, p: 'Test', v: 1000 }]
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(productos), { status: 200 })
      )
      localStorage.setItem('token', 'valid-token')

      const result = await getProductos()
      expect(result).toEqual(productos)
    })

    it('debe lanzar error si no hay token', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      )

      await expect(getProductos()).rejects.toThrow('Sesión expirada')
    })

  })

})
