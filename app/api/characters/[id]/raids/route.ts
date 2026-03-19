export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
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
    const { raids, weekStart } = body as { raids: string[]; weekStart: string }

    if (!raids || !weekStart) {
      return NextResponse.json(
        { error: "레이드 목록과 주차 정보가 필요합니다." },
        { status: 400 }
      )
    }

    // Delete existing selections for this week
    await prisma.raidSelection.deleteMany({
      where: { characterId: id, weekStart },
    })

    // Create new selections
    if (raids.length > 0) {
      await prisma.raidSelection.createMany({
        data: raids.map((raidName) => ({
          raidName,
          weekStart,
          characterId: id,
        })),
      })
    }

    const updated = await prisma.character.findUnique({
      where: { id },
      include: {
        raidSelections: { where: { weekStart } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update raids error:", error)
    return NextResponse.json(
      { error: "레이드 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
