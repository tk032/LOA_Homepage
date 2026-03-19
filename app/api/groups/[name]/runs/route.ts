export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { name } = await params
  const groupName = decodeURIComponent(name)

  const group = await prisma.group.findUnique({ where: { name: groupName } })
  if (!group) {
    return NextResponse.json(
      { error: "그룹을 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  try {
    const body = await req.json()
    const { raidName, members, note } = body as {
      raidName: string
      members: { userId: string; characterName: string; itemLevel: number }[]
      note?: string
    }

    if (!raidName || !members || members.length === 0) {
      return NextResponse.json(
        { error: "레이드 이름과 멤버 정보가 필요합니다." },
        { status: 400 }
      )
    }

    const weekStart = getWeekStart()

    const run = await prisma.groupRun.create({
      data: {
        raidName,
        weekStart,
        note: note ?? "",
        groupId: group.id,
        members: {
          create: members.map((m) => ({
            userId: m.userId,
            characterName: m.characterName,
            itemLevel: m.itemLevel,
          })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    })

    return NextResponse.json(run, { status: 201 })
  } catch (error) {
    console.error("Create run error:", error)
    return NextResponse.json(
      { error: "파티 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
