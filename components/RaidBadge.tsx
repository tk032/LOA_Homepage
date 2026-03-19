import { getRaidGroup, RAID_GROUP_COLORS } from "@/lib/raids"
import { cn } from "@/lib/utils"

interface RaidBadgeProps {
  raidName: string
  className?: string
}

export function RaidBadge({ raidName, className }: RaidBadgeProps) {
  const group = getRaidGroup(raidName)
  const colors = group
    ? RAID_GROUP_COLORS[group]
    : { bg: "bg-gray-700/40", text: "text-gray-300", border: "border-gray-600/50" }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {raidName}
    </span>
  )
}
