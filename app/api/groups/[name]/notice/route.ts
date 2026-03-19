export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ name: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await params
  const groupName = decodeURIComponent(name)

  const body = await req.json()
  const { notice } = body as { notice: string }

  if (typeof notice !== "string") {
    return NextResponse.json({ error: "notice must be a string" }, { status: 400 })
  }

  if (notice.length > 200) {
    return NextResponse.json({ error: "공지는 200자 이하여야 합니다." }, { status: 400 })
  }

  const group = await prisma.group.findUnique({
    where: { name: groupName },
    include: { members: true },
  })

  if (!group) {
    return NextResponse.json({ error: "그룹을 찾을 수 없습니다." }, { status: 404 })
  }

  const myMember = group.members.find((m) => m.userId === session.user.id)
  if (!myMember || myMember.role !== "leader") {
    return NextResponse.json({ error: "리더만 공지를 수정할 수 있습니다." }, { status: 403 })
  }

  const updated = await prisma.group.update({
    where: { name: groupName },
    data: { notice: notice.trim() },
  })

  return NextResponse.json(updated)
}
