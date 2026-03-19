import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"
import { WeekLabel } from "@/components/WeekLabel"
import { GroupsClient } from "./GroupsClient"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const weekStart = getWeekStart()

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true } },
      runs: {
        where: { weekStart },
        include: {
          _count: { select: { members: true } },
        },
      },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const groupData = groups.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: g._count.members,
    runCount: g.runs.length,
    isMyGroup: g.members.length > 0,
    myRole: g.members[0]?.role ?? null,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">그룹</h1>
          <p className="text-sm text-gray-400 mt-1">
            레이드 그룹을 관리하세요
          </p>
        </div>
        <WeekLabel weekStart={weekStart} />
      </div>

      <GroupsClient groups={groupData} />
    </div>
  )
}
