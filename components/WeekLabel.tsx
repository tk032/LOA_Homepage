import { Calendar } from "lucide-react"

interface WeekLabelProps {
  weekStart: string
}

export function WeekLabel({ weekStart }: WeekLabelProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Calendar className="h-4 w-4" />
      <span>이번 주: {weekStart}</span>
    </div>
  )
}
