"use client"

import { getRaidGold, getRaidGroup, RAID_GROUP_COLORS, isRaidBound } from "@/lib/raids"

interface RaidSelection {
  raidName: string
  isCompleted: boolean
  isGoldTarget: boolean
}

interface CharacterGoldProps {
  name: string
  itemLevel: number
  isGoldCharacter: boolean
  raidSelections: RaidSelection[]
}

interface GoldSummaryProps {
  characters: CharacterGoldProps[]
}

export function GoldSummary({ characters }: GoldSummaryProps) {
  // Only gold characters contribute to summary
  const goldChars = characters.filter((c) => c.isGoldCharacter)
  if (goldChars.length === 0 && characters.length === 0) return null

  let totalEarned = 0
  let totalPotential = 0

  const perChar = goldChars.map((char) => {
    const goldRaids = char.raidSelections.filter((r) => r.isGoldTarget)
    const earned = goldRaids.filter((r) => r.isCompleted).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const potential = goldRaids.reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const earnedBound = goldRaids.filter((r) => r.isCompleted && isRaidBound(r.raidName)).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const potentialBound = goldRaids.filter((r) => isRaidBound(r.raidName)).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    totalEarned += earned
    totalPotential += potential
    return { ...char, goldRaids, earned, potential, earnedBound, potentialBound }
  })

  if (perChar.length === 0) return null

  const overallPct = totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 gap-3">
        <h2 className="text-sm font-semibold text-white shrink-0">주간 골드 현황</h2>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-1.5 w-20 sm:w-28 rounded-full bg-gray-700 overflow-hidden shrink-0">
            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-sm font-bold text-yellow-400 shrink-0">{totalEarned.toLocaleString()}g</span>
          <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">/ {totalPotential.toLocaleString()}g</span>
        </div>
      </div>

      {/* Desktop: 3-column table layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[160px_1fr_180px] text-xs text-gray-600 border-b border-gray-800/60 px-4 py-1.5">
          <span>캐릭터</span>
          <span className="pl-14">레이드</span>
          <span className="text-right">골드</span>
        </div>
        <div className="divide-y divide-gray-800/60">
          {perChar.map((char) => {
            const pct = char.potential > 0 ? Math.round((char.earned / char.potential) * 100) : 0
            return (
              <div key={char.name} className="grid grid-cols-[160px_1fr_180px] items-center px-4 py-3 gap-0">
                <div className="min-w-0 pr-4 border-r border-gray-800">
                  <p className="text-sm font-medium text-white truncate">{char.name}</p>
                  <p className="text-xs text-gray-500">{char.itemLevel.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 pl-14 pr-4 flex-wrap border-r border-gray-800">
                  {char.goldRaids.length === 0 ? (
                    <span className="text-xs text-gray-600">—</span>
                  ) : (
                    char.goldRaids.map((raid) => {
                      const group = getRaidGroup(raid.raidName)
                      const textColor = group ? RAID_GROUP_COLORS[group]?.text : "text-gray-200"
                      if (raid.isCompleted) {
                        return (
                          <span key={raid.raidName} className="inline-flex rounded-md border border-gray-700/40 bg-gray-800/40 px-2 py-1 text-xs text-gray-600 line-through">
                            {raid.raidName}
                          </span>
                        )
                      }
                      return (
                        <span key={raid.raidName} className={`inline-flex rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-xs font-semibold ${textColor ?? "text-gray-200"}`}>
                          {raid.raidName}
                        </span>
                      )
                    })
                  )}
                </div>
                <div className="pl-2 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-yellow-400">{(char.earned - char.earnedBound).toLocaleString()}g</span>
                      {char.earnedBound > 0 && (
                        <span className="text-sm font-semibold text-violet-400">+{char.earnedBound.toLocaleString()}g</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden flex">
                    {char.potential > 0 && (
                      <>
                        <div className="h-full bg-yellow-400 transition-all" style={{ width: `${Math.round(((char.earned - char.earnedBound) / char.potential) * 100)}%` }} />
                        <div className="h-full bg-violet-400 transition-all" style={{ width: `${Math.round((char.earnedBound / char.potential) * 100)}%` }} />
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

      {/* Mobile: card layout per character */}
      <div className="sm:hidden divide-y divide-gray-800/60">
        {perChar.map((char) => {
          const pct = char.potential > 0 ? Math.round((char.earned / char.potential) * 100) : 0
          return (
            <div key={char.name} className="px-4 py-3 space-y-2">
              {/* Name + gold */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{char.name}</p>
                  <p className="text-xs text-gray-500">{char.itemLevel.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-sm font-semibold text-yellow-400">{(char.earned - char.earnedBound).toLocaleString()}g</span>
                    {char.earnedBound > 0 && (
                      <span className="text-xs font-semibold text-violet-400">+{char.earnedBound.toLocaleString()}g</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">/ {char.potential.toLocaleString()}g · {pct}%</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden flex">
                {char.potential > 0 && (
                  <>
                    <div className="h-full bg-yellow-400 transition-all" style={{ width: `${Math.round(((char.earned - char.earnedBound) / char.potential) * 100)}%` }} />
                    <div className="h-full bg-violet-400 transition-all" style={{ width: `${Math.round((char.earnedBound / char.potential) * 100)}%` }} />
                  </>
                )}
              </div>
              {/* Raid badges */}
              {char.goldRaids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {char.goldRaids.map((raid) => {
                    const group = getRaidGroup(raid.raidName)
                    const textColor = group ? RAID_GROUP_COLORS[group]?.text : "text-gray-200"
                    if (raid.isCompleted) {
                      return (
                        <span key={raid.raidName} className="inline-flex rounded-md border border-gray-700/40 bg-gray-800/40 px-2 py-0.5 text-xs text-gray-600 line-through">
                          {raid.raidName}
                        </span>
                      )
                    }
                    return (
                      <span key={raid.raidName} className={`inline-flex rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-xs font-semibold ${textColor ?? "text-gray-200"}`}>
                        {raid.raidName}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
