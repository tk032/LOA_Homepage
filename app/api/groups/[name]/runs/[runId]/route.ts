export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; runId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { name, runId } = await params
  const groupName = decodeURIComponent(name)

  const group = await prisma.group.findUnique({ where: { name: groupName } })
  if (!group) {
    return NextResponse.json(
      { error: "그룹을 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  const run = await prisma.groupRun.findFirst({
    where: { id: runId, groupId: group.id },
  })
  if (!run) {
    return NextResponse.json(
      { error: "파티를 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  await prisma.groupRun.delete({ where: { id: runId } })

  return NextResponse.json({ success: true })
}
