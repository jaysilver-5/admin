"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PeriodDropdown from "@/components/dashboard/ui/PeriodDropdown";

export default function DonutChart({
  period,
  onPeriodChange,
}: {
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const donut = [
    { name: "Completed", value: 94, raw: 547914, color: "#2563eb" },
    { name: "Cancelled", value: 81, raw: 547914, color: "#ea580c" },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
          <p className="text-sm font-medium">{d?.name}</p>
          <p className="text-sm text-gray-600">{d?.raw?.toLocaleString()} orders</p>
          <p className="text-sm text-gray-600">{d?.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-semibold text-gray-900">Real-time orders</h2>
        <PeriodDropdown selectedPeriod={period} onPeriodChange={onPeriodChange} />
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-8 xl:gap-12">
        <div className="w-full sm:w-[280px] h-[220px] sm:h-[240px] mx-auto xl:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donut}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                outerRadius={96}
                innerRadius={56}
                dataKey="value"
                stroke="none"
              >
                {donut.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6 xl:mt-4">
          {[
            { k: "Completed", c: "bg-blue-600", v: "94%" },
            { k: "Cancelled", c: "bg-orange-600", v: "81%" },
          ].map((r) => (
            <div key={r.k} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${r.c}`} />
              <div className="flex items-center gap-8">
                <span className="text-sm font-medium text-gray-900 w-[92px]">{r.k}</span>
                <span className="text-sm text-gray-500 w-[72px]">547,914</span>
                <span className="text-sm font-semibold text-emerald-600">{r.v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
