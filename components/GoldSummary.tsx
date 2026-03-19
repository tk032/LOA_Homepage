"use client"

import { getRaidGold, MAX_GOLD_RAIDS, getRaidGroup, RAID_GROUP_COLORS, isRaidBound } from "@/lib/raids"

interface RaidSelection {
  raidName: string
  isCompleted: boolean
}

interface CharacterGoldProps {
  name: string
  itemLevel: number
  raidSelections: RaidSelection[]
}

interface GoldSummaryProps {
  characters: CharacterGoldProps[]
}

function getGoldRaids(raidSelections: RaidSelection[]): RaidSelection[] {
  return [...raidSelections]
    .sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName))
    .slice(0, MAX_GOLD_RAIDS)
}

export function GoldSummary({ characters }: GoldSummaryProps) {
  if (characters.length === 0) return null

  let totalEarned = 0
  let totalPotential = 0

  const perChar = characters.map((char) => {
    const goldRaids = getGoldRaids(char.raidSelections)
    const earned = goldRaids.filter((r) => r.isCompleted).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const potential = goldRaids.reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const earnedBound = goldRaids.filter((r) => r.isCompleted && isRaidBound(r.raidName)).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const potentialBound = goldRaids.filter((r) => isRaidBound(r.raidName)).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    totalEarned += earned
    totalPotential += potential
    return { ...char, goldRaids, earned, potential, earnedBound, potentialBound }
  })

  const overallPct = totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">주간 골드 현황</h2>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 rounded-full bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-sm font-bold text-yellow-400">{totalEarned.toLocaleString()}g</span>
          <span className="text-xs text-gray-500">/ {totalPotential.toLocaleString()}g</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[160px_1fr_180px] text-xs text-gray-600 border-b border-gray-800/60 px-4 py-1.5">
        <span>캐릭터</span>
        <span className="pl-14">레이드</span>
        <span className="text-right">골드</span>
      </div>

      {/* One row per character */}
      <div className="divide-y divide-gray-800/60">
        {perChar.map((char) => {
          const pct = char.potential > 0 ? Math.round((char.earned / char.potential) * 100) : 0
          return (
            <div key={char.name} className="grid grid-cols-[160px_1fr_180px] items-center px-4 py-3 gap-0">
              {/* Section 1: Character */}
              <div className="min-w-0 pr-4 border-r border-gray-800">
                <p className="text-sm font-medium text-white truncate">{char.name}</p>
                <p className="text-xs text-gray-500">{char.itemLevel.toLocaleString()}</p>
              </div>

              {/* Section 2: Raids */}
              <div className="flex items-center gap-2 pl-14 pr-4 flex-wrap border-r border-gray-800">
                {char.goldRaids.length === 0 ? (
                  <span className="text-xs text-gray-600">—</span>
                ) : (
                  char.goldRaids.map((raid) => {
                    const group = getRaidGroup(raid.raidName)
                    const colors = group ? RAID_GROUP_COLORS[group] : null
                    if (raid.isCompleted) {
                      return (
                        <span key={raid.raidName} className="inline-flex rounded-md border border-gray-800 bg-gray-800/50 px-2 py-1 text-xs text-gray-600 line-through">
                          {raid.raidName}
                        </span>
                      )
                    }
                    return (
                      <span key={raid.raidName} className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${colors?.bg ?? "bg-gray-700/40"} ${colors?.text ?? "text-gray-200"} ${colors?.border ?? "border-gray-600/50"}`}>
                        {raid.raidName}
                      </span>
                    )
                  })
                )}
              </div>

              {/* Section 3: Gold + split progress bar */}
              <div className="pl-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-yellow-400">
                      {(char.earned - char.earnedBound).toLocaleString()}g
                    </span>
                    {char.earnedBound > 0 && (
                      <span className="text-sm font-semibold text-violet-400">
                        +{char.earnedBound.toLocaleString()}g
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{pct}%</span>
                </div>
                {/* Split bar: yellow = normal, violet = bound */}
                <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden flex">
                  {char.potential > 0 && (
                    <>
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${Math.round(((char.earned - char.earnedBound) / char.potential) * 100)}%` }}
                      />
                      <div
                        className="h-full bg-violet-400 transition-all"
                        style={{ width: `${Math.round((char.earnedBound / char.potential) * 100)}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>/ {char.potential.toLocaleString()}g</span>
                  {char.potentialBound > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
                      귀속
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
