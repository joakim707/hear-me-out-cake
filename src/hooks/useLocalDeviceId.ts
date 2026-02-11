import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

const STORAGE_KEY = 'hear-me-out-device-id'

export function useLocalDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    let current = window.localStorage.getItem(STORAGE_KEY)
    if (!current) {
      current = uuid()
      window.localStorage.setItem(STORAGE_KEY, current)
    }
    setDeviceId(current)
  }, [])

  return deviceId
}

