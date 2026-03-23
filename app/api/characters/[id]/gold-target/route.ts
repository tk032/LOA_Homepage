export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_GOLD_RAIDS = 3

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { raidName, weekStart } = body as { raidName: string; weekStart: string }

  // Verify ownership
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!character) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 })
  }

  const selection = await prisma.raidSelection.findUnique({
    where: { characterId_raidName_weekStart: { characterId: id, raidName, weekStart } },
  })
  if (!selection) {
    return NextResponse.json({ error: "레이드를 찾을 수 없습니다." }, { status: 404 })
  }

  // If enabling gold target, check limit (max 3 per character per week)
  if (!selection.isGoldTarget) {
    const currentGoldCount = await prisma.raidSelection.count({
      where: { characterId: id, weekStart, isGoldTarget: true },
    })
    if (currentGoldCount >= MAX_GOLD_RAIDS) {
      return NextResponse.json(
        { error: `골드 레이드는 캐릭터당 최대 ${MAX_GOLD_RAIDS}개까지 지정할 수 있습니다.` },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.raidSelection.update({
    where: { id: selection.id },
    data: { isGoldTarget: !selection.isGoldTarget },
  })

  return NextResponse.json({ isGoldTarget: updated.isGoldTarget })
}
