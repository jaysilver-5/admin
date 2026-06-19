"use client";
import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { StatCardProps } from "@/types/dashboard";

export default function StatCard({
  icon,
  title,
  total,
  active,
  activePercentage,
  inactive,
  inactivePercentage,
  isPositive,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-emerald-50">{icon}</div>
      </div>
      <h3 className="text-[13px] font-medium text-gray-600">{title}</h3>
      <div className="mt-1 mb-2 text-[22px] leading-[26px] font-bold text-gray-900">
        {total}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">{active}</span>
            <span className={`inline-flex items-center ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {activePercentage}
            </span>
          </div>
          <span className="text-gray-500">Active</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">{inactive}</span>
            <span className={`inline-flex items-center ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {inactivePercentage}
            </span>
          </div>
          <span className="text-gray-500">Inactive</span>
        </div>
      </div>
    </div>
  );
}
