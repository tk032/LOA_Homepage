"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RaidBadge } from "@/components/RaidBadge"
import { RAID_GROUPS, RAID_GROUP_COLORS, getRaidGold, getRaidGroup, isRaidBound } from "@/lib/raids"
import { Trash2, Plus, UserPlus, UserMinus, Pencil, X, Wand2 } from "lucide-react"

interface RaidSelection {
  id: string
  raidName: string
  isCompleted: boolean
  weekStart: string
}

interface Character {
  id: string
  name: string
  characterClass: string
  itemLevel: number
  raidSelections: RaidSelection[]
}

interface Member {
  id: string
  userId: string
  role: string
  displayName: string
  username: string
  characters: Character[]
}

interface RunMember {
  id: string
  userId: string
  characterName: string
  itemLevel: number
  displayName: string
}

interface RunAttendance {
  id: string
  userId: string
  status: string
  displayName: string
}

interface Run {
  id: string
  raidName: string
  note: string
  members: RunMember[]
  attendances: RunAttendance[]
}

interface GroupData {
  id: string
  name: string
  notice: string
  weekStart: string
  currentUserId: string
  isMember: boolean
  myRole: string | null
  members: Member[]
  runs: Run[]
}

interface GroupDetailClientProps {
  group: GroupData
}

// Auto-party suggestion type
interface SuggestedParty {
  members: { userId: string; characterName: string; itemLevel: number; displayName: string }[]
}

export function GroupDetailClient({ group: initialGroup }: GroupDetailClientProps) {
  const router = useRouter()
  const [group, setGroup] = useState<GroupData>(initialGroup)
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberUsername, setAddMemberUsername] = useState("")
  const [addMemberError, setAddMemberError] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  const [showAddRun, setShowAddRun] = useState(false)
  const [newRunRaid, setNewRunRaid] = useState("")
  const [newRunNote, setNewRunNote] = useState("")
  const [selectedRunMembers, setSelectedRunMembers] = useState<
    { userId: string; characterName: string; itemLevel: number }[]
  >([])
  const [addRunError, setAddRunError] = useState("")
  const [addingRun, setAddingRun] = useState(false)

  // Notice state
  const [editingNotice, setEditingNotice] = useState(false)
  const [noticeText, setNoticeText] = useState(group.notice)
  const [savingNotice, setSavingNotice] = useState(false)

  // Auto party state
  const [showAutoParty, setShowAutoParty] = useState(false)
  const [autoPartyRaid, setAutoPartyRaid] = useState("")
  const [suggestedParties, setSuggestedParties] = useState<SuggestedParty[]>([])
  const [creatingAutoParties, setCreatingAutoParties] = useState(false)
  const [autoPartyError, setAutoPartyError] = useState("")

  const encodedName = encodeURIComponent(group.name)

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!addMemberUsername.trim()) return
    setAddingMember(true)
    setAddMemberError("")

    try {
      const res = await fetch(`/api/groups/${encodedName}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: addMemberUsername.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAddMemberError(data.error ?? "멤버 추가 중 오류가 발생했습니다.")
        return
      }

      setAddMemberUsername("")
      setShowAddMember(false)
      router.refresh()
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("정말로 이 멤버를 제거하시겠습니까?")) return

    const res = await fetch(`/api/groups/${encodedName}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      setGroup((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.userId !== userId),
      }))
    }
  }

  function toggleRunMember(userId: string, characterName: string, itemLevel: number) {
    setSelectedRunMembers((prev) => {
      const exists = prev.find((m) => m.userId === userId && m.characterName === characterName)
      if (exists) {
        return prev.filter((m) => !(m.userId === userId && m.characterName === characterName))
      }
      return [...prev, { userId, characterName, itemLevel }]
    })
  }

  async function handleAddRun(e: React.FormEvent) {
    e.preventDefault()
    if (!newRunRaid || selectedRunMembers.length === 0) {
      setAddRunError("레이드와 멤버를 선택해주세요.")
      return
    }
    setAddingRun(true)
    setAddRunError("")

    try {
      const res = await fetch(`/api/groups/${encodedName}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidName: newRunRaid,
          members: selectedRunMembers,
          note: newRunNote,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAddRunError(data.error ?? "파티 생성 중 오류가 발생했습니다.")
        return
      }

      setGroup((prev) => ({
        ...prev,
        runs: [
          ...prev.runs,
          {
            id: data.id,
            raidName: data.raidName,
            note: data.note,
            attendances: [],
            members: data.members.map((rm: { id: string; userId: string; characterName: string; itemLevel: number; user: { displayName: string } }) => ({
              id: rm.id,
              userId: rm.userId,
              characterName: rm.characterName,
              itemLevel: rm.itemLevel,
              displayName: rm.user.displayName,
            })),
          },
        ],
      }))
      setNewRunRaid("")
      setNewRunNote("")
      setSelectedRunMembers([])
      setShowAddRun(false)
    } finally {
      setAddingRun(false)
    }
  }

  async function handleDeleteRun(runId: string) {
    if (!confirm("이 파티를 삭제하시겠습니까?")) return

    const res = await fetch(`/api/groups/${encodedName}/runs/${runId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setGroup((prev) => ({
        ...prev,
        runs: prev.runs.filter((r) => r.id !== runId),
      }))
    }
  }

  // Notice handlers
  async function handleSaveNotice() {
    setSavingNotice(true)
    try {
      const res = await fetch(`/api/groups/${encodedName}/notice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice: noticeText }),
      })
      if (res.ok) {
        setGroup((prev) => ({ ...prev, notice: noticeText }))
        setEditingNotice(false)
      }
    } finally {
      setSavingNotice(false)
    }
  }

  function handleCancelNotice() {
    setNoticeText(group.notice)
    setEditingNotice(false)
  }

  // Internal attendance upsert helper
  async function upsertAttendance(runId: string, status: "attending" | "absent") {
    const res = await fetch(`/api/runs/${runId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGroup((prev) => ({
        ...prev,
        runs: prev.runs.map((run) => {
          if (run.id !== runId) return run
          const existing = run.attendances.find((a) => a.userId === updated.userId)
          if (existing) {
            return {
              ...run,
              attendances: run.attendances.map((a) =>
                a.userId === updated.userId ? { ...a, status: updated.status } : a
              ),
            }
          } else {
            return {
              ...run,
              attendances: [
                ...run.attendances,
                {
                  id: updated.id,
                  userId: updated.userId,
                  status: updated.status,
                  displayName: updated.user.displayName,
                },
              ],
            }
          }
        }),
      }))
    }
  }

  // Toggle attendance (toggle button in the per-member row)
  async function handleAttendance(runId: string, currentStatus: string) {
    const newStatus = currentStatus === "attending" ? "absent" : "attending"
    await upsertAttendance(runId, newStatus)
  }

  // Set attendance directly (quick action buttons)
  async function handleAttendanceSet(runId: string, status: "attending" | "absent") {
    await upsertAttendance(runId, status)
  }

  // Auto party logic
  function computeAutoParties(raidName: string): SuggestedParty[] {
    const allRaids = Object.values(RAID_GROUPS).flatMap((g) => g.raids)
    const raidInfo = allRaids.find((r) => r.name === raidName)
    if (!raidInfo) return []

    // Collect eligible characters (highest ilvl per member)
    const eligible: { userId: string; characterName: string; itemLevel: number; displayName: string }[] = []
    for (const member of group.members) {
      const bestChar = member.characters
        .filter((c) => c.itemLevel >= raidInfo.minLevel)
        .sort((a, b) => b.itemLevel - a.itemLevel)[0]
      if (bestChar) {
        eligible.push({
          userId: member.userId,
          characterName: bestChar.name,
          itemLevel: bestChar.itemLevel,
          displayName: member.displayName,
        })
      }
    }

    // Sort by ilvl desc
    eligible.sort((a, b) => b.itemLevel - a.itemLevel)

    // Split into groups of partySize
    const parties: SuggestedParty[] = []
    for (let i = 0; i < eligible.length; i += raidInfo.partySize) {
      parties.push({ members: eligible.slice(i, i + raidInfo.partySize) })
    }
    return parties
  }

  function handleAutoPartyRaidChange(raidName: string) {
    setAutoPartyRaid(raidName)
    setAutoPartyError("")
    if (raidName) {
      setSuggestedParties(computeAutoParties(raidName))
    } else {
      setSuggestedParties([])
    }
  }

  async function handleCreateAutoParties() {
    if (!autoPartyRaid || suggestedParties.length === 0) return
    setCreatingAutoParties(true)
    setAutoPartyError("")
    try {
      for (const party of suggestedParties) {
        const res = await fetch(`/api/groups/${encodedName}/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raidName: autoPartyRaid,
            members: party.members.map((m) => ({
              userId: m.userId,
              characterName: m.characterName,
              itemLevel: m.itemLevel,
            })),
            note: "자동 편성",
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setAutoPartyError(data.error ?? "파티 생성 중 오류가 발생했습니다.")
          return
        }
        setGroup((prev) => ({
          ...prev,
          runs: [
            ...prev.runs,
            {
              id: data.id,
              raidName: data.raidName,
              note: data.note,
              attendances: [],
              members: data.members.map((rm: { id: string; userId: string; characterName: string; itemLevel: number; user: { displayName: string } }) => ({
                id: rm.id,
                userId: rm.userId,
                characterName: rm.characterName,
                itemLevel: rm.itemLevel,
                displayName: rm.user.displayName,
              })),
            },
          ],
        }))
      }
      setShowAutoParty(false)
      setAutoPartyRaid("")
      setSuggestedParties([])
    } finally {
      setCreatingAutoParties(false)
    }
  }

  // All raid names flat list
  const allRaids = Object.values(RAID_GROUPS).flatMap((g) => g.raids)

  return (
    <div className="space-y-4">
      {/* Notice section */}
      {(group.notice || group.myRole === "leader") && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 px-4 py-3">
          {editingNotice ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-300 text-sm font-semibold">📢 그룹 공지 수정</span>
              </div>
              <textarea
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100 placeholder-amber-600 focus:border-amber-500 focus:outline-none resize-none"
                placeholder="그룹 공지를 입력하세요..."
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600">{noticeText.length}/200</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNotice}
                    disabled={savingNotice}
                    className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs px-3"
                  >
                    {savingNotice ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelNotice}
                    className="text-amber-400 hover:text-amber-200 h-7 text-xs px-3"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </div>
          ) : group.notice ? (
            <div className="flex items-start gap-2">
              <span className="text-amber-300 shrink-0">📢</span>
              <p className="text-sm text-amber-200 flex-1 whitespace-pre-wrap">{group.notice}</p>
              {group.myRole === "leader" && (
                <button
                  onClick={() => { setNoticeText(group.notice); setEditingNotice(true) }}
                  className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
                  aria-label="공지 수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            // Empty notice, leader only
            <button
              onClick={() => { setNoticeText(""); setEditingNotice(true) }}
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              공지 추가
            </button>
          )}
        </div>
      )}

      <Tabs defaultValue="parties" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <TabsTrigger value="parties" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-500 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            파티 편성
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-500 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
            멤버 현황
          </TabsTrigger>
        </TabsList>

        {/* PARTIES TAB */}
        <TabsContent value="parties" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => { setShowAutoParty(!showAutoParty); setShowAddRun(false) }}
              size="sm"
              variant="outline"
              className="border-purple-700 text-purple-300 hover:bg-purple-900/20 hover:text-purple-200 dark:border-purple-700"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              자동 편성
            </Button>
            <Button
              onClick={() => { setShowAddRun(!showAddRun); setShowAutoParty(false) }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              파티 추가
            </Button>
          </div>

          {/* Auto Party Modal */}
          {showAutoParty && (
            <Card className="bg-gray-900 border-purple-800/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    자동 파티 편성
                  </CardTitle>
                  <button onClick={() => { setShowAutoParty(false); setAutoPartyRaid(""); setSuggestedParties([]) }} className="text-gray-500 hover:text-gray-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">레이드 선택</label>
                  <select
                    value={autoPartyRaid}
                    onChange={(e) => handleAutoPartyRaidChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">레이드를 선택하세요</option>
                    {Object.entries(RAID_GROUPS).map(([groupName, groupData]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupData.raids.map((raid) => (
                          <option key={raid.name} value={raid.name}>
                            {raid.name} (최소 {raid.minLevel} / {raid.partySize}인)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {autoPartyRaid && suggestedParties.length === 0 && (
                  <p className="text-sm text-gray-400">조건을 충족하는 멤버가 없습니다.</p>
                )}

                {suggestedParties.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300 font-medium">
                      {suggestedParties.length}개 파티 편성 제안:
                    </p>
                    {suggestedParties.map((party, idx) => (
                      <div key={idx} className="rounded-lg border border-purple-800/40 bg-purple-900/10 p-3">
                        <p className="text-xs text-purple-400 mb-2 font-medium">파티 {idx + 1}</p>
                        <div className="space-y-1">
                          {party.members.map((m, mIdx) => (
                            <div key={m.userId} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 w-4 text-right text-xs">{mIdx + 1}</span>
                              <span className="text-white font-medium">{m.characterName}</span>
                              <span className="text-blue-400 text-xs ml-auto">{m.itemLevel.toLocaleString()}</span>
                              <span className="text-gray-500 text-xs">{m.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {autoPartyError && <p className="text-sm text-red-400">{autoPartyError}</p>}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateAutoParties}
                        disabled={creatingAutoParties}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {creatingAutoParties ? "생성 중..." : "이 편성으로 생성"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowAutoParty(false); setAutoPartyRaid(""); setSuggestedParties([]) }}
                        className="text-gray-400 hover:text-white"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {showAddRun && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base">새 파티 편성</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRun} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">레이드 선택</label>
                    <select
                      value={newRunRaid}
                      onChange={(e) => setNewRunRaid(e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">레이드를 선택하세요</option>
                      {Object.entries(RAID_GROUPS).map(([groupName, groupData]) => (
                        <optgroup key={groupName} label={groupName}>
                          {groupData.raids.map((raid) => (
                            <option key={raid.name} value={raid.name}>
                              {raid.name} (최소 {raid.minLevel} / {raid.partySize}인)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">메모 (선택)</label>
                    <input
                      type="text"
                      value={newRunNote}
                      onChange={(e) => setNewRunNote(e.target.value)}
                      placeholder="파티 메모"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      멤버 선택 ({selectedRunMembers.length}명 선택됨)
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {group.members.map((member) =>
                        member.characters.map((char) => {
                          const isSelected = selectedRunMembers.some(
                            (m) => m.userId === member.userId && m.characterName === char.name
                          )
                          const selectedRaid = newRunRaid
                            ? allRaids.find((r) => r.name === newRunRaid)
                            : null
                          const meetsLevel = !selectedRaid || char.itemLevel >= selectedRaid.minLevel

                          return (
                            <label
                              key={`${member.userId}-${char.name}`}
                              className={`flex items-center gap-3 rounded-lg border p-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-blue-600 bg-blue-900/20"
                                  : meetsLevel
                                  ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                                  : "border-gray-800 bg-gray-800/50 opacity-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleRunMember(member.userId, char.name, char.itemLevel)
                                }
                                disabled={!meetsLevel}
                                className="accent-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-white">{char.name}</span>
                                <span className="text-xs text-gray-400 ml-2">{char.characterClass}</span>
                              </div>
                              <span className="text-xs text-blue-400 shrink-0">
                                {char.itemLevel.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {member.displayName}
                              </span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {addRunError && <p className="text-sm text-red-400">{addRunError}</p>}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={addingRun}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {addingRun ? "생성 중..." : "파티 생성"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddRun(false)
                        setAddRunError("")
                        setSelectedRunMembers([])
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {group.runs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-10 text-center">
              <p className="text-gray-400 text-sm">이번 주 파티가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.runs.map((run) => {
                const myAttendance = run.attendances.find((a) => a.userId === group.currentUserId)
                const attendingCount = run.attendances.filter((a) => a.status === "attending").length
                const absentCount = run.attendances.filter((a) => a.status === "absent").length
                const pendingCount = group.members.length - run.attendances.filter((a) => a.status !== "pending").length

                return (
                  <Card key={run.id} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <RaidBadge raidName={run.raidName} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRun(run.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {run.note && (
                        <p className="text-xs text-gray-400 mt-1">{run.note}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Members list */}
                      <div className="space-y-1">
                        {run.members.map((rm, idx) => (
                          <div key={rm.id} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 w-4 text-right text-xs">{idx + 1}</span>
                            <span className="text-white font-medium">{rm.characterName}</span>
                            <span className="text-blue-400 text-xs ml-auto">{rm.itemLevel.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs">{rm.displayName}</span>
                          </div>
                        ))}
                      </div>

                      {/* Attendance section */}
                      <Separator className="bg-gray-800" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">출석 현황</span>
                          <span className="text-xs text-gray-500">
                            ✅ {attendingCount}명 / ❌ {absentCount}명 / ⏳ {pendingCount}명
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.members.map((member) => {
                            const attendance = run.attendances.find((a) => a.userId === member.userId)
                            const status = attendance?.status ?? "pending"
                            const isMe = member.userId === group.currentUserId
                            return (
                              <div key={member.userId} className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">{member.displayName}</span>
                                <div className="flex items-center gap-1.5">
                                  <span>
                                    {status === "attending" ? "✅" : status === "absent" ? "❌" : "⏳"}
                                  </span>
                                  <span className={
                                    status === "attending" ? "text-green-400" :
                                    status === "absent" ? "text-red-400" :
                                    "text-gray-500"
                                  }>
                                    {status === "attending" ? "참석" : status === "absent" ? "불참" : "미응답"}
                                  </span>
                                  {isMe && (
                                    <button
                                      onClick={() => handleAttendance(run.id, status)}
                                      className={`ml-1 rounded px-1.5 py-0.5 text-xs transition-colors ${
                                        status === "attending"
                                          ? "bg-red-900/40 text-red-400 hover:bg-red-900/60"
                                          : "bg-green-900/40 text-green-400 hover:bg-green-900/60"
                                      }`}
                                    >
                                      {status === "attending" ? "불참으로" : "참석으로"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Quick action for current user if not responded */}
                        {group.isMember && (!myAttendance || myAttendance.status === "pending") && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAttendanceSet(run.id, "attending")}
                              className="flex-1 rounded py-1 text-xs bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors border border-green-800/40"
                            >
                              ✅ 참석
                            </button>
                            <button
                              onClick={() => handleAttendanceSet(run.id, "absent")}
                              className="flex-1 rounded py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors border border-red-800/40"
                            >
                              ❌ 불참
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              size="sm"
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              멤버 초대
            </Button>
          </div>

          {showAddMember && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-4">
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <input
                    type="text"
                    value={addMemberUsername}
                    onChange={(e) => setAddMemberUsername(e.target.value)}
                    placeholder="초대할 사용자 아이디"
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={addingMember}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {addingMember ? "추가 중..." : "초대"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowAddMember(false); setAddMemberError("") }}
                    className="text-gray-400 hover:text-white"
                  >
                    취소
                  </Button>
                </form>
                {addMemberError && (
                  <p className="text-sm text-red-400 mt-2">{addMemberError}</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {group.members.map((member) => {
              const totalRaids = member.characters.reduce(
                (sum, c) => sum + c.raidSelections.length,
                0
              )
              const completedRaids = member.characters.reduce(
                (sum, c) => sum + c.raidSelections.filter((r) => r.isCompleted).length,
                0
              )
              const progressPct = totalRaids > 0 ? Math.round((completedRaids / totalRaids) * 100) : 0

              return (
                <Card key={member.id} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{member.displayName}</span>
                        <span className="text-xs text-gray-500">@{member.username}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          member.role === "leader"
                            ? "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50"
                            : "bg-gray-800 text-gray-400"
                        }`}>
                          {member.role === "leader" ? "리더" : "멤버"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {completedRaids}/{totalRaids}
                        </span>
                        {group.myRole === "leader" && member.userId !== group.currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="h-6 w-6 p-0 text-gray-600 hover:text-red-400"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {totalRaids > 0 && (
                      <Progress value={progressPct} className="h-1.5 bg-gray-700 mt-1" />
                    )}
                  </CardHeader>
                  {member.characters.length > 0 && (
                    <CardContent className="pt-0 space-y-3">
                      <Separator className="bg-gray-800" />
                      {member.characters.map((char) => (
                        <div key={char.id} className="rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden">
                          {/* Character header */}
                          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{char.name}</span>
                              <span className="text-xs text-gray-500">{char.characterClass}</span>
                            </div>
                            <span className="text-xs font-medium text-blue-400">{char.itemLevel.toLocaleString()}</span>
                          </div>
                          {/* Raids */}
                          {char.raidSelections.length > 0 ? (
                            <div className="px-3 py-2 flex flex-col gap-1">
                              {[...char.raidSelections]
                                .sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName))
                                .map((r) => {
                                const raidGroup = getRaidGroup(r.raidName)
                                const textColor = raidGroup ? RAID_GROUP_COLORS[raidGroup]?.text : "text-gray-200"
                                const gold = getRaidGold(r.raidName)
                                return (
                                  <div
                                    key={r.raidName}
                                    className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs ${
                                      r.isCompleted
                                        ? "border-gray-700/40 bg-gray-800/40"
                                        : "border-slate-700/60 bg-slate-800/60"
                                    }`}
                                  >
                                    <span className={r.isCompleted ? "line-through text-gray-600" : `font-medium ${textColor ?? "text-gray-200"}`}>
                                      {r.raidName}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {gold > 0 && (
                                        <span className={
                                          r.isCompleted
                                            ? isRaidBound(r.raidName) ? "text-violet-800" : "text-gray-700"
                                            : isRaidBound(r.raidName) ? "text-violet-400" : "text-yellow-500"
                                        }>
                                          {gold.toLocaleString()}g
                                        </span>
                                      )}
                                      {r.isCompleted && (
                                        <span className="text-green-600">✓</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="px-3 py-2 text-xs text-gray-600">레이드 없음</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
