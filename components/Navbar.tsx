"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut, signIn } from "next-auth/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function Navbar() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 gap-2">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              🌸 <span className="hidden sm:inline">마리 홈페이지</span><span className="sm:hidden">마리</span>
            </span>
          </Link>
        </div>

        {/* Right: theme + user */}
        <div className="flex items-center gap-2 shrink-0">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="테마 전환"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          {status === "loading" ? (
            <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          ) : session ? (
            <>
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(session.user.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              {/* Username: hidden on mobile */}
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                {session.user.name ?? session.user.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs px-2 sm:px-3"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Discord </span>로그인
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
