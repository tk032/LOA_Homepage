"use client"

import { useState, useEffect } from "react"

function getNextResetMs(): number {
  const now = new Date()
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60 * 60 * 1000
  const kstNow = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + kstOffset)

  // Target: next Wednesday 06:00 KST
  const day = kstNow.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const target = new Date(kstNow)
  target.setHours(6, 0, 0, 0)

  // Days until next Wednesday
  let daysUntilWed: number
  if (day === 3) {
    // Today is Wednesday
    if (kstNow.getTime() < target.getTime()) {
      // Before 06:00 KST — reset is today
      daysUntilWed = 0
    } else {
      // After 06:00 KST — next Wednesday
      daysUntilWed = 7
    }
  } else {
    daysUntilWed = (3 - day + 7) % 7
    if (daysUntilWed === 0) daysUntilWed = 7
  }

  target.setDate(kstNow.getDate() + daysUntilWed)

  // Convert target back to UTC ms
  const targetUtcMs = target.getTime() - now.getTimezoneOffset() * 60 * 1000 - kstOffset
  return targetUtcMs
}

export function WeekResetCountdown() {
  const [remaining, setRemaining] = useState<number>(() => getNextResetMs() - Date.now())

  useEffect(() => {
    const tick = () => {
      setRemaining(getNextResetMs() - Date.now())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (remaining <= 0) {
    return (
      <span className="text-xs text-gray-500">리셋됨</span>
    )
  }

  const totalSec = Math.floor(remaining / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return (
    <span className="text-xs text-gray-500">
      리셋{" "}
      <span className="font-mono text-gray-400">
        {days > 0 && `${days}d `}
        {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
      </span>
    </span>
  )
}
