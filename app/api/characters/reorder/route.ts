export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { order } = body as { order: string[] }

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: "순서 정보가 필요합니다." },
        { status: 400 }
      )
    }

    // Verify ownership of all characters
    const characters = await prisma.character.findMany({
      where: {
        id: { in: order },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (characters.length !== order.length) {
      return NextResponse.json(
        { error: "일부 캐릭터를 찾을 수 없거나 권한이 없습니다." },
        { status: 403 }
      )
    }

    // Update sortOrder atomically in a transaction
    await prisma.$transaction(
      order.map((id, index) =>
        prisma.character.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Reorder error:", error)
    return NextResponse.json(
      { error: "순서 변경 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
