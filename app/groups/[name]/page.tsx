import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getWeekStart } from "@/lib/raids"
import { WeekLabel } from "@/components/WeekLabel"
import { GroupDetailClient } from "./GroupDetailClient"

interface PageProps {
  params: Promise<{ name: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
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
          attendances: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!group) {
    notFound()
  }

  const isMember = group.members.some((m) => m.userId === session.user.id)
  const myRole = group.members.find((m) => m.userId === session.user.id)?.role ?? null

  const groupData = {
    id: group.id,
    name: group.name,
    notice: group.notice,
    weekStart,
    currentUserId: session.user.id,
    isMember,
    myRole,
    members: group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      displayName: m.user.displayName,
      username: m.user.username,
      characters: m.user.characters.map((c) => ({
        id: c.id,
        name: c.name,
        characterClass: c.characterClass,
        itemLevel: Number(c.itemLevel),
        raidSelections: c.raidSelections.map((r) => ({
          id: r.id,
          raidName: r.raidName,
          isCompleted: r.isCompleted,
          weekStart: r.weekStart,
        })),
      })),
    })),
    runs: group.runs.map((r) => ({
      id: r.id,
      raidName: r.raidName,
      note: r.note,
      members: r.members.map((rm) => ({
        id: rm.id,
        userId: rm.userId,
        characterName: rm.characterName,
        itemLevel: Number(rm.itemLevel),
        displayName: rm.user.displayName,
      })),
      attendances: r.attendances.map((a) => ({
        id: a.id,
        userId: a.userId,
        status: a.status,
        displayName: a.user.displayName,
      })),
    })),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {group.members.length}명 · 이번 주 파티 {group.runs.length}개
          </p>
        </div>
        <WeekLabel weekStart={weekStart} />
      </div>

      <GroupDetailClient group={groupData} />
    </div>
  )
}
