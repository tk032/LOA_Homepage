"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut, signIn } from "next-auth/react"
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
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-800" />
          ) : session ? (
            <>
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white">
                    {(session.user.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-300">
                  {session.user.name ?? session.user.username}
                </span>
              </div>
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
            <Button
              size="sm"
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Discord 로그인
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
