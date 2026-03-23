import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"
import { WeekLabel } from "@/components/WeekLabel"
import { WeekResetCountdown } from "@/components/WeekResetCountdown"
import { DashboardClient } from "./DashboardClient"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const weekStart = getWeekStart()

  const [characters, groupMemberships, weekRows] = await Promise.all([
    prisma.character.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        raidSelections: { where: { weekStart } },
      },
      orderBy: [{ sortOrder: "asc" }, { itemLevel: "desc" }],
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            runs: {
              where: { weekStart },
              include: { members: true },
            },
          },
        },
      },
    }),
    prisma.raidSelection.findMany({
      where: {
        character: { userId: session.user.id },
      },
      select: { weekStart: true },
      distinct: ["weekStart"],
      orderBy: { weekStart: "desc" },
      take: 8,
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">대시보드</h1>
          <p className="text-sm text-gray-400 mt-1">
            안녕하세요, {session.user.name ?? session.user.username}님
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <WeekLabel weekStart={weekStart} />
          <WeekResetCountdown />
        </div>
      </div>

      {/* Characters Section */}
      <DashboardClient
        initialCharacters={characters.map((c) => ({
          ...c,
          itemLevel: Number(c.itemLevel),
          isGoldCharacter: c.isGoldCharacter,
          raidSelections: c.raidSelections.map((r) => ({
            id: r.id,
            raidName: r.raidName,
            isCompleted: r.isCompleted,
            isGoldTarget: r.isGoldTarget,
            weekStart: r.weekStart,
          })),
        }))}
        weekStart={weekStart}
        availableWeeks={weekRows.map((r) => r.weekStart).includes(weekStart)
          ? weekRows.map((r) => r.weekStart)
          : [weekStart, ...weekRows.map((r) => r.weekStart)]}
      />

      {/* Groups Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">내 그룹</h2>
          <Link
            href="/groups"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            모든 그룹 보기
          </Link>
        </div>
        {groupMemberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400 text-sm">속한 그룹이 없습니다.</p>
            <Link
              href="/groups"
              className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              그룹 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupMemberships.map(({ group, role }) => {
              const runCount = group.runs.length
              const memberCount = group._count.members
              return (
                <Link
                  key={group.id}
                  href={`/groups/${encodeURIComponent(group.name)}`}
                  className="block rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{group.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
                      {role === "leader" ? "리더" : "멤버"}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{memberCount}명</span>
                    <span>이번 주 파티 {runCount}개</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
