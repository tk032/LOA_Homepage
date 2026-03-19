"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Flower2 } from "lucide-react"

export default function LoginPage() {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Flower2 className="h-8 w-8 text-pink-400" />
          </div>
          <CardTitle className="text-white text-xl">마리 홈페이지</CardTitle>
          <CardDescription className="text-gray-400">
            Discord 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 동의 체크박스 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              <Link
                href="/privacy"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                개인정보 처리방침
              </Link>
              에 동의합니다. Discord 사용자명과 프로필 사진이 서비스 내 그룹 멤버에게 공개됩니다.
            </span>
          </label>

          {/* Discord 로그인 버튼 */}
          <Button
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            disabled={!agreed}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Discord로 로그인
          </Button>

          <p className="text-center text-xs text-gray-500">
            처음 로그인하면 자동으로 계정이 만들어집니다
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
