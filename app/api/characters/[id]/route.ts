export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

  await prisma.character.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
