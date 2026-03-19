export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!character) {
    return NextResponse.json(
      { error: "캐릭터를 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  try {
    const body = await req.json()
    const { raidName, weekStart } = body as {
      raidName: string
      weekStart: string
    }

    if (!raidName || !weekStart) {
      return NextResponse.json(
        { error: "레이드 이름과 주차 정보가 필요합니다." },
        { status: 400 }
      )
    }

    const existing = await prisma.raidSelection.findUnique({
      where: {
        characterId_raidName_weekStart: {
          characterId: id,
          raidName,
          weekStart,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "해당 레이드 선택을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const updated = await prisma.raidSelection.update({
      where: { id: existing.id },
      data: {
        isCompleted: !existing.isCompleted,
        completedAt: !existing.isCompleted ? new Date() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Toggle complete error:", error)
    return NextResponse.json(
      { error: "완료 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
