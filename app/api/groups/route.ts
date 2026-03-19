import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name } = body as { name: string }

    if (!name) {
      return NextResponse.json(
        { error: "그룹 이름을 입력해주세요." },
        { status: 400 }
      )
    }

    const existing = await prisma.group.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 그룹 이름입니다." },
        { status: 409 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: "leader",
          },
        },
      },
      include: { _count: { select: { members: true } } },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Create group error:", error)
    return NextResponse.json(
      { error: "그룹 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
