import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { name } = await params
  const groupName = decodeURIComponent(name)
  const weekStart = getWeekStart()

  const group = await prisma.group.findUnique({
    where: { name: groupName },
    include: {
      members: {
        include: {
          user: {
            include: {
              characters: {
                where: { isActive: true },
                include: {
                  raidSelections: { where: { weekStart } },
                },
                orderBy: { itemLevel: "desc" },
              },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      runs: {
        where: { weekStart },
        include: {
          members: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!group) {
    return NextResponse.json(
      { error: "그룹을 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  return NextResponse.json({ ...group, weekStart })
}
