import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Tasas } from './types'
import { getTasas as apiGetTasas, actualizarTasas as apiActualizarTasas } from './api'

interface TasasContextValue {
  tasas: Tasas | null
  setTasas: (t: Tasas) => void
  recargar: () => void
  guardarTasas: (usd: number, ves: number) => Promise<Tasas>
}

const TasasContext = createContext<TasasContextValue | null>(null)

export function TasasProvider({ children }: { children: ReactNode }) {
  const [tasas, setTasas] = useState<Tasas | null>(null)

  function recargar() {
    apiGetTasas().then(setTasas).catch(() => {})
  }

  useEffect(() => { recargar() }, [])

  async function guardarTasas(usd: number, ves: number): Promise<Tasas> {
    const t = await apiActualizarTasas(usd, ves)
    setTasas(t)
    return t
  }

  return (
    <TasasContext.Provider value={{ tasas, setTasas, recargar, guardarTasas }}>
      {children}
    </TasasContext.Provider>
  )
}

export function useTasas() {
  const ctx = useContext(TasasContext)
  if (!ctx) throw new Error('useTasas debe usarse dentro de TasasProvider')
  return ctx
}
