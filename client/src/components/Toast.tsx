import { useEffect } from 'react'

interface ToastProps {
  message: string
  error?: boolean
  onClose: () => void
}

export default function Toast({ message, error, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast mostrar${error ? ' error' : ''}`}>
      {message}
    </div>
  )
}
