export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_GOLD_CHARACTERS = 6

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await params

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!character) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 })
  }

  // If enabling gold, check limit
  if (!character.isGoldCharacter) {
    const goldCount = await prisma.character.count({
      where: { userId: session.user.id, isGoldCharacter: true, isActive: true },
    })
    if (goldCount >= MAX_GOLD_CHARACTERS) {
      return NextResponse.json(
        { error: `골드 캐릭터는 최대 ${MAX_GOLD_CHARACTERS}개까지 지정할 수 있습니다.` },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.character.update({
    where: { id },
    data: { isGoldCharacter: !character.isGoldCharacter },
  })

  return NextResponse.json({ isGoldCharacter: updated.isGoldCharacter })
}
