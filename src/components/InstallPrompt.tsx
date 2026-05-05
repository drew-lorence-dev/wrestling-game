"use client"

import { useEffect, useState } from "react"

const DISMISSED_KEY = "aew-install-dismissed"

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<Event | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return

    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(t)
    }

    // Android/Chrome: capture the native prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, "1")
  }

  async function install() {
    if (!prompt) return
    ;(prompt as BeforeInstallPromptEvent).prompt()
    const { outcome } = await (prompt as BeforeInstallPromptEvent).userChoice
    if (outcome === "accepted") localStorage.setItem(DISMISSED_KEY, "1")
    setVisible(false)
    setPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-[4.5rem] md:bottom-5 left-4 right-4 md:left-auto md:right-5 md:w-80 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-[#0d0d0d] border border-[#c9a84c]/30 shrink-0 flex flex-col items-center justify-center gap-0">
          <span className="text-[#c9a84c] font-black text-[10px] leading-none tracking-wider">AEW</span>
          <span className="text-white text-[7px] leading-none tracking-widest opacity-70 mt-0.5">FANTASY</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white leading-tight">Add to Home Screen</div>
          {isIOS ? (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Tap the <span className="text-white font-medium">Share</span> button{" "}
              <ShareIcon />{" "}then{" "}
              <span className="text-white font-medium">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Install for a faster, native app experience.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {!isIOS && (
            <button
              onClick={install}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#c9a84c] text-black font-bold hover:bg-[#e8c96a] transition-colors whitespace-nowrap"
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors whitespace-nowrap"
          >
            {isIOS ? "Got it" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline w-3.5 h-3.5 text-zinc-300 -mt-0.5"
    >
      <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
    </svg>
  )
}

// Extend Window for the non-standard BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}
