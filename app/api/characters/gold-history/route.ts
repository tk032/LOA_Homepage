export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  // Get all raid selections for user's characters, last 8 distinct weeks
  const weekRows = await prisma.raidSelection.findMany({
    where: {
      character: { userId: session.user.id },
    },
    select: { weekStart: true },
    distinct: ["weekStart"],
    orderBy: { weekStart: "desc" },
    take: 8,
  })

  const weeks = weekRows.map((r) => r.weekStart).reverse() // asc order

  const result: { weekStart: string; earned: number; potential: number }[] = []

  for (const weekStart of weeks) {
    // Get all characters with their raid selections for this week
    const characters = await prisma.character.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        raidSelections: {
          where: { weekStart },
        },
      },
    })

    let earnedTotal = 0
    let potentialTotal = 0

    for (const char of characters) {
      const selections = char.raidSelections
      if (selections.length === 0) continue

      // Top MAX_GOLD_RAIDS by gold value
      const sorted = [...selections].sort(
        (a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName)
      )
      const goldRaids = sorted.slice(0, MAX_GOLD_RAIDS)
      const goldRaidNames = new Set(goldRaids.map((r) => r.raidName))

      for (const sel of selections) {
        if (!goldRaidNames.has(sel.raidName)) continue
        const gold = getRaidGold(sel.raidName)
        potentialTotal += gold
        if (sel.isCompleted) earnedTotal += gold
      }
    }

    result.push({ weekStart, earned: earnedTotal, potential: potentialTotal })
  }

  return NextResponse.json(result)
}
