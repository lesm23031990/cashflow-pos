import { useEffect, useRef } from 'react'
import { getTasas, actualizarTasas } from '../api'
import type { Tasas } from '../types'

interface Props {
  tasas: Tasas
  onChange: (field: 'usd' | 'ves', value: number) => void
  onToast: (msg: string, err?: boolean) => void
}

export default function TasasForm({ tasas, onChange, onToast }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    getTasas()
      .then(t => {
        onChange('usd', t.usd)
        onChange('ves', t.ves)
      })
      .catch(() => onToast('Error al cargar tasas', true))
  }, [onChange, onToast])

  function handleChange(field: 'usd' | 'ves', value: string) {
    const num = parseFloat(value) || 0
    onChange(field, num)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const newTasas = field === 'usd'
        ? { usd: num, ves: tasas.ves }
        : { usd: tasas.usd, ves: num }
      actualizarTasas(newTasas.usd, newTasas.ves).catch(() => {})
    }, 500)
  }

  return (
    <section className="tasas">
      <div className="tasa-item">
        <label htmlFor="tasaUsd">Tasa USD (1 USD = X COP)</label>
        <input
          id="tasaUsd"
          type="number"
          step="any"
          min="0"
          value={tasas.usd}
          onChange={e => handleChange('usd', e.target.value)}
        />
      </div>
      <div className="tasa-item">
        <label htmlFor="tasaVes">Tasa VES (1 VES = X COP)</label>
        <input
          id="tasaVes"
          type="number"
          step="any"
          min="0"
          value={tasas.ves}
          onChange={e => handleChange('ves', e.target.value)}
        />
      </div>
    </section>
  )
}
