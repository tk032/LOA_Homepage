"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sword } from "lucide-react"

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-white hover:text-blue-400 transition-colors"
          >
            <Sword className="h-5 w-5 text-blue-400" />
            <span>LOA 레이드</span>
          </Link>
          {session && (
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/groups"
                className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                그룹
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                내 캐릭터
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-gray-800" />
          ) : session ? (
            <>
              <span className="text-sm text-gray-400">
                {session.user.name ?? session.user.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  로그인
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  회원가입
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
