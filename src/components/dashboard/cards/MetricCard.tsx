"use client";
import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import PeriodDropdown from "@/components/dashboard/ui/PeriodDropdown";
import { MetricCardProps } from "@/types/dashboard";

export default function MetricCard({
  icon,
  title,
  value,
  change,
  isPositive,
  period,
  onPeriodChange,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-blue-50">{icon}</div>
        <PeriodDropdown selectedPeriod={period} onPeriodChange={onPeriodChange} />
      </div>
      <h3 className="text-[13px] font-medium text-gray-600">{title}</h3>
      <div className="mt-1 text-[22px] leading-[26px] font-bold text-gray-900">
        {value}
      </div>
      <div className={`mt-1 inline-flex items-center text-[12px] ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {change}
      </div>
    </div>
  );
}
