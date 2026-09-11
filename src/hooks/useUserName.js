import { useEffect, useState } from 'react'
import { getUserName, subscribe } from '../store'

export default function useUserName() {
  const [name, setName] = useState(() => getUserName())

  useEffect(() => {
    const refresh = () => {
      try { setName(getUserName()) } catch {}
    }
    const unsub = subscribe(refresh)
    window.addEventListener('storage', refresh)
    return () => {
      unsub()
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return name
}