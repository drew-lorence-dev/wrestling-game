"use client"

import { useEffect, useState } from "react"
import { getNextLockTime, formatCountdown } from "@/lib/beta"

export default function Countdown() {
  const [display, setDisplay] = useState("")

  useEffect(() => {
    const target = getNextLockTime()
    const update = () => setDisplay(formatCountdown(target))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const locked = display === "Locked"

  return (
    <span className={locked ? "text-red-400" : "text-[#c9a84c]"}>
      {display || "—"}
    </span>
  )
}
