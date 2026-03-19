"use client"

import { useState } from "react"
import { RAID_GROUPS, getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"

interface RaidEditorProps {
  characterId: string
  itemLevel: number
  weekStart: string
  currentRaids: string[]
  onSave: (raids: string[]) => void
  onCancel: () => void
}

export function RaidEditor({
  characterId,
  itemLevel,
  weekStart,
  currentRaids,
  onSave,
  onCancel,
}: RaidEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentRaids))
  const [isSaving, setIsSaving] = useState(false)

  // Top MAX_GOLD_RAIDS by gold value among selected
  const goldRaidNames = new Set(
    [...selected]
      .map((name) => ({ name, gold: getRaidGold(name) }))
      .sort((a, b) => b.gold - a.gold)
      .slice(0, MAX_GOLD_RAIDS)
      .map((r) => r.name)
  )

  // Selecting a raid deselects all others in the same group (radio within group)
  function toggleRaid(groupName: string, raidName: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      const groupRaidNames = RAID_GROUPS[groupName].raids.map((r) => r.name)
      if (next.has(raidName)) {
        // Deselect
        next.delete(raidName)
      } else {
        // Select: remove all other raids in this group first
        groupRaidNames.forEach((r) => next.delete(r))
        next.add(raidName)
      }
      return next
    })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const raids = [...selected]
      const res = await fetch(`/api/characters/${characterId}/raids`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raids, weekStart }),
      })
      if (res.ok) {
        onSave(raids)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-850 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-400">
        레이드 선택
        <span className="ml-2 text-gray-600 font-normal">골드 상위 {MAX_GOLD_RAIDS}개 적용</span>
      </p>

      <div className="space-y-2">
        {Object.entries(RAID_GROUPS).map(([groupName, groupData]) => {
          const eligibleRaids = groupData.raids.filter((r) => itemLevel >= r.minLevel)
          if (eligibleRaids.length === 0) return null

          // Which raid in this group is currently selected (if any)
          const selectedInGroup = eligibleRaids.find((r) => selected.has(r.name))

          return (
            <div key={groupName}>
              <p className="text-xs text-gray-500 font-medium mb-1">{groupName}</p>
              <div className="flex flex-col gap-0.5">
                {eligibleRaids.map((raid) => {
                  const isChecked = selected.has(raid.name)
                  const isGoldRaid = goldRaidNames.has(raid.name)
                  // Locked if another raid in same group is selected
                  const isLocked = !isChecked && selectedInGroup !== undefined

                  return (
                    <label
                      key={raid.name}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1 transition-colors",
                        isLocked
                          ? "opacity-35 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-800"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() => !isLocked && toggleRaid(groupName, raid.name)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={cn("text-sm flex-1", isLocked ? "text-gray-600" : "text-white")}>
                        {raid.name}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isChecked && isGoldRaid ? "text-yellow-400 font-medium" : "text-gray-600"
                      )}>
                        {raid.gold.toLocaleString()}g
                        {isChecked && isGoldRaid && <span className="ml-0.5">★</span>}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}
