"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BIOMETRIC_META, buildGrowthCurve } from "@/lib/data"
import type { BiometricKey } from "@/lib/types"

export function GrowthChart({
  metric,
  week,
  value,
}: {
  metric: BiometricKey
  week: number
  value: number
}) {
  const data = useMemo(
    () => buildGrowthCurve(metric, week, value),
    [metric, week, value],
  )
  const meta = BIOMETRIC_META[metric]

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            type="number"
            domain={[12, 40]}
            ticks={[12, 16, 20, 24, 28, 32, 36, 40]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            stroke="var(--border)"
            label={{
              value: "هفته بارداری",
              position: "insideBottom",
              offset: -2,
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            stroke="var(--border)"
            width={48}
            label={{
              value: meta.unit,
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
              color: "var(--card-foreground)",
            }}
            labelFormatter={(w) => `هفته ${w}`}
            formatter={(val, name) => [`${Math.round(Number(val))} ${meta.unit}`, name]}
          />
          <Line
            type="monotone"
            dataKey="p95"
            name="95th centile"
            stroke="var(--chart-2)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p50"
            name="50th centile"
            stroke="var(--chart-2)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p5"
            name="5th centile"
            stroke="var(--chart-2)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <Scatter
            dataKey="measured"
            name="This visit"
            fill="var(--chart-1)"
            shape="circle"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
