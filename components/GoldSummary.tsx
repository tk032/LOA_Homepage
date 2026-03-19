"use client"

import { getRaidGold, MAX_GOLD_RAIDS, getRaidGroup, RAID_GROUP_COLORS } from "@/lib/raids"

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
    totalEarned += earned
    totalPotential += potential
    return { ...char, goldRaids, earned, potential }
  })

  const overallPct = totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">주간 골드 현황</h2>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 rounded-full bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-sm font-bold text-yellow-400">{totalEarned.toLocaleString()}g</span>
          <span className="text-xs text-gray-500">/ {totalPotential.toLocaleString()}g</span>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {perChar.map((char) => (
          <div
            key={char.name}
            className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 space-y-1.5"
          >
            {/* Character name + gold */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-white truncate">{char.name}</span>
                <span className="text-xs text-gray-600 shrink-0">{char.itemLevel.toLocaleString()}</span>
              </div>
              <div className="shrink-0 text-xs">
                <span className="text-yellow-400 font-medium">{char.earned.toLocaleString()}</span>
                <span className="text-gray-600"> / {char.potential.toLocaleString()}g</span>
              </div>
            </div>

            {/* Raid chips */}
            <div className="flex flex-col gap-1">
              {char.goldRaids.length === 0 ? (
                <span className="text-xs text-gray-600">레이드 없음</span>
              ) : (
                char.goldRaids.map((raid) => {
                  const group = getRaidGroup(raid.raidName)
                  const colors = group ? RAID_GROUP_COLORS[group] : null
                  return (
                    <div
                      key={raid.raidName}
                      className={
                        raid.isCompleted
                          ? "flex items-center justify-between rounded border border-gray-800 bg-gray-800/40 px-2 py-0.5"
                          : `flex items-center justify-between rounded border px-2 py-0.5 ${colors?.border ?? "border-gray-600/50"} ${colors?.bg ?? "bg-gray-700/40"}`
                      }
                    >
                      <span className={
                        raid.isCompleted
                          ? "text-xs text-gray-600 line-through"
                          : `text-xs font-medium ${colors?.text ?? "text-gray-300"}`
                      }>
                        {raid.raidName}
                      </span>
                      <span className={
                        raid.isCompleted ? "text-xs text-gray-700" : "text-xs text-yellow-500"
                      }>
                        {getRaidGold(raid.raidName).toLocaleString()}g
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
