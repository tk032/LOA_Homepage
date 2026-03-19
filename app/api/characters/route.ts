import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const weekStart = getWeekStart()

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      raidSelections: {
        where: { weekStart },
      },
    },
    orderBy: { itemLevel: "desc" },
  })

  return NextResponse.json(characters)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, characterClass, itemLevel } = body as {
      name: string
      characterClass: string
      itemLevel: number
    }

    if (!name || !characterClass || itemLevel == null) {
      return NextResponse.json(
        { error: "캐릭터 이름, 직업, 아이템 레벨을 모두 입력해주세요." },
        { status: 400 }
      )
    }

    const character = await prisma.character.create({
      data: {
        name,
        characterClass,
        itemLevel,
        userId: session.user.id,
      },
    })

    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    console.error("Add character error:", error)
    return NextResponse.json(
      { error: "캐릭터 추가 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
