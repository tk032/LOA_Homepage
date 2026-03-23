export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")
  if (!name) return NextResponse.json({ error: "name 파라미터 필요" }, { status: 400 })

  const apiKey = process.env.LOSTARK_API_KEY
  if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 })

  const res = await fetch(
    `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(name)}/profiles`,
    { headers: { Authorization: `bearer ${apiKey}`, Accept: "application/json" } }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
