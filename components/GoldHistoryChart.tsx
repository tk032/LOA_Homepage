"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface GoldHistoryEntry {
  weekStart: string
  earned: number
  potential: number
}

interface Props {
  data: GoldHistoryEntry[]
}

function weekLabel(weekStart: string): string {
  // weekStart is "YYYY-MM-DD", show as "M/D"
  const [, m, d] = weekStart.split("-")
  return `${parseInt(m)}/${parseInt(d)}`
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const earned = payload.find((p) => p.name === "earned")?.value ?? 0
  const potential = payload.find((p) => p.name === "potential")?.value ?? 0
  const pct = potential > 0 ? Math.round((earned / potential) * 100) : 0

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-yellow-400 font-medium">획득: {earned.toLocaleString()}g</p>
      <p className="text-gray-500">가능: {potential.toLocaleString()}g</p>
      <p className="text-gray-400 mt-1">{pct}% 달성</p>
    </div>
  )
}

export function GoldHistoryChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-500">
        데이터 없음
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: weekLabel(d.weekStart),
    // Gap bar = potential - earned (stacked remainder)
    gap: Math.max(0, d.potential - d.earned),
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: "#6b7280", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        {/* Stacked: earned + gap = potential */}
        <Bar dataKey="earned" stackId="a" radius={[0, 0, 4, 4]} name="earned">
          {chartData.map((entry, index) => {
            const pct = entry.potential > 0 ? entry.earned / entry.potential : 0
            const color =
              pct >= 0.9 ? "#eab308" : pct >= 0.5 ? "#f59e0b" : "#d97706"
            return <Cell key={index} fill={color} />
          })}
        </Bar>
        <Bar dataKey="gap" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} name="gap" />
      </BarChart>
    </ResponsiveContainer>
  )
}
