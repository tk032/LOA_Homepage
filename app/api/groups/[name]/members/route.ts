import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { username } = body as { username: string }

    if (!username) {
      return NextResponse.json(
        { error: "사용자 이름을 입력해주세요." },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({ where: { username } })
    if (!targetUser) {
      return NextResponse.json(
        { error: "해당 사용자를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: targetUser.id } },
    })
    if (existing) {
      return NextResponse.json(
        { error: "이미 그룹에 속해 있는 사용자입니다." },
        { status: 409 }
      )
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: targetUser.id,
        role: "member",
      },
      include: { user: true },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Add member error:", error)
    return NextResponse.json(
      { error: "멤버 추가 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      )
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: group.id, userId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "멤버 제거 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
