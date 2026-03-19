export const RAID_GROUPS: Record<
  string,
  { raids: { name: string; minLevel: number; partySize: number }[] }
> = {
  "지평의 성당": {
    raids: [
      { name: "지평의 성당 3단계", minLevel: 1750, partySize: 4 },
      { name: "지평의 성당 2단계", minLevel: 1720, partySize: 4 },
      { name: "지평의 성당 1단계", minLevel: 1700, partySize: 4 },
    ],
  },
  세르카: {
    raids: [
      { name: "나메 세르카", minLevel: 1740, partySize: 4 },
      { name: "하드 세르카", minLevel: 1730, partySize: 4 },
      { name: "노말 세르카", minLevel: 1710, partySize: 4 },
    ],
  },
  종막: {
    raids: [
      { name: "종막 하드", minLevel: 1730, partySize: 8 },
      { name: "노말 종막", minLevel: 1710, partySize: 8 },
    ],
  },
  "4막": {
    raids: [
      { name: "4막 하드", minLevel: 1720, partySize: 8 },
      { name: "4막 노말", minLevel: 1700, partySize: 8 },
    ],
  },
  둠: {
    raids: [
      { name: "하르둠", minLevel: 1700, partySize: 8 },
      { name: "노르둠", minLevel: 1680, partySize: 8 },
    ],
  },
  브: {
    raids: [
      { name: "하브", minLevel: 1690, partySize: 8 },
      { name: "노브", minLevel: 1670, partySize: 8 },
    ],
  },
  기르: {
    raids: [
      { name: "하기르", minLevel: 1680, partySize: 8 },
      { name: "노기르", minLevel: 1660, partySize: 8 },
    ],
  },
}

/**
 * Returns the most recent Wednesday (KST, UTC+9) in "YYYY-MM-DD" format.
 */
export function getWeekStart(): string {
  // Get current time in KST
  const now = new Date()
  const kstOffset = 9 * 60 // minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const kstMs = utcMs + kstOffset * 60 * 1000
  const kst = new Date(kstMs)

  // day of week: 0=Sun, 1=Mon, ..., 3=Wed, ..., 6=Sat
  const day = kst.getDay()
  // How many days back to get to Wednesday?
  // Wed=3. If today is Wed, daysBack=0. If Thu=4, daysBack=1. etc.
  const daysBack = (day - 3 + 7) % 7

  const wednesday = new Date(kst)
  wednesday.setDate(kst.getDate() - daysBack)

  const yyyy = wednesday.getFullYear()
  const mm = String(wednesday.getMonth() + 1).padStart(2, "0")
  const dd = String(wednesday.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Returns the RAID_GROUPS key (group name) for a given raid name, or undefined.
 */
export function getRaidGroup(raidName: string): string | undefined {
  for (const [groupName, groupData] of Object.entries(RAID_GROUPS)) {
    if (groupData.raids.some((r) => r.name === raidName)) {
      return groupName
    }
  }
  return undefined
}

/**
 * Tailwind color classes per raid group.
 * Format: { bg, text, border } for badge styling
 */
export const RAID_GROUP_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "지평의 성당": {
    bg: "bg-red-900/40",
    text: "text-red-300",
    border: "border-red-700/50",
  },
  세르카: {
    bg: "bg-yellow-900/40",
    text: "text-yellow-300",
    border: "border-yellow-700/50",
  },
  종막: {
    bg: "bg-cyan-900/40",
    text: "text-cyan-300",
    border: "border-cyan-700/50",
  },
  "4막": {
    bg: "bg-blue-900/40",
    text: "text-blue-300",
    border: "border-blue-700/50",
  },
  둠: {
    bg: "bg-green-900/40",
    text: "text-green-300",
    border: "border-green-700/50",
  },
  브: {
    bg: "bg-purple-900/40",
    text: "text-purple-300",
    border: "border-purple-700/50",
  },
  기르: {
    bg: "bg-gray-700/40",
    text: "text-gray-300",
    border: "border-gray-600/50",
  },
}
