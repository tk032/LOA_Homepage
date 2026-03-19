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

  // Compute which selected raids count for gold (top MAX_GOLD_RAIDS by gold value)
  const goldRaidNames = new Set(
    [...selected]
      .map((name) => ({ name, gold: getRaidGold(name) }))
      .sort((a, b) => b.gold - a.gold)
      .slice(0, MAX_GOLD_RAIDS)
      .map((r) => r.name)
  )

  function toggleRaid(raidName: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(raidName)) {
        next.delete(raidName)
      } else {
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
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        레이드 선택
        <span className="ml-2 text-gray-500 normal-case">
          (골드 상위 {MAX_GOLD_RAIDS}개 적용)
        </span>
      </p>

      <div className="space-y-2">
        {Object.entries(RAID_GROUPS).map(([groupName, groupData]) => {
          const eligibleRaids = groupData.raids.filter(
            (r) => itemLevel >= r.minLevel
          )
          if (eligibleRaids.length === 0) return null

          return (
            <div key={groupName} className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">{groupName}</p>
              {eligibleRaids.map((raid) => {
                const isChecked = selected.has(raid.name)
                const isGoldRaid = goldRaidNames.has(raid.name)
                return (
                  <label
                    key={raid.name}
                    className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRaid(raid.name)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm text-white flex-1">
                      {raid.name}
                    </span>
                    <span
                      className={
                        isChecked && isGoldRaid
                          ? "text-xs font-medium text-yellow-400"
                          : "text-xs text-gray-500"
                      }
                    >
                      {raid.gold.toLocaleString()}g
                      {isChecked && isGoldRaid && (
                        <span className="ml-1 text-yellow-500">★</span>
                      )}
                    </span>
                  </label>
                )
              })}
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
