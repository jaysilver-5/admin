"use client";
import * as React from "react";
import { Car, DollarSign, ShoppingCart, Store, UserCheck, Users } from "lucide-react";
import StatCard from "@/components/dashboard/cards/StatCard";
import MetricCard from "@/components/dashboard/cards/MetricCard";
import DonutChart from "@/components/dashboard/charts/DonutChart";
import { apiFetch, formatNaira } from "@/lib/api";
import { fetchFinanceSummary } from "@/lib/finance";

export default function HomeTab() {
  const [chartPeriod, setChartPeriod] = React.useState("This Month");
  const [metricPeriods, setMetricPeriods] = React.useState({
    washOrders: "This Week",
    revenue: "This Week",
    complaints: "This Week",
    volume: "This Week",
  });

  const [metrics, setMetrics] = React.useState<any | null>(null);
  const [finance, setFinance] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleMetricPeriodChange = (k: string, p: string) =>
    setMetricPeriods((prev) => ({ ...prev, [k]: p }));

  React.useEffect(() => {
    let alive = true;
    Promise.all([apiFetch<any>("/admin/dashboard/metrics"), fetchFinanceSummary({})])
      .then(([data, financeData]) => { if (alive) { setMetrics(data); setFinance(financeData); } })
      .catch((err) => { if (alive) setError(err?.message || "Unable to load dashboard metrics"); });
    return () => { alive = false; };
  }, []);

  const users = metrics?.users ?? 0;
  const merchants = metrics?.merchants ?? 0;
  const riders = metrics?.riders ?? 0;
  const activeOrders = metrics?.orders?.active ?? 0;
  const completedOrders = metrics?.orders?.completed ?? 0;
  const cancelledOrders = metrics?.orders?.cancelled ?? 0;
  const todayOrders = metrics?.orders?.today ?? 0;
  const revenue = finance?.netPlatformRevenue ?? 0;
  const openComplaints = metrics?.support?.openComplaints ?? 0;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          icon={<Users className="w-6 h-6 text-emerald-600" />}
          title="Total Users"
          total={users.toLocaleString()}
          active={users.toLocaleString()}
          activePercentage=""
          inactive="0"
          inactivePercentage=""
          isPositive
        />
        <StatCard
          icon={<Store className="w-6 h-6 text-emerald-600" />}
          title="Total Merchants"
          total={merchants.toLocaleString()}
          active={(merchants - (metrics?.pendingApprovals?.merchants ?? 0)).toLocaleString()}
          activePercentage=""
          inactive={(metrics?.pendingApprovals?.merchants ?? 0).toLocaleString()}
          inactivePercentage=""
          isPositive
        />
        <StatCard
          icon={<Car className="w-6 h-6 text-emerald-600" />}
          title="Total Riders"
          total={riders.toLocaleString()}
          active={(riders - (metrics?.pendingApprovals?.riders ?? 0)).toLocaleString()}
          activePercentage=""
          inactive={(metrics?.pendingApprovals?.riders ?? 0).toLocaleString()}
          inactivePercentage=""
          isPositive
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Total wash orders"
          value={(activeOrders + completedOrders + cancelledOrders).toLocaleString()}
          change=""
          isPositive
          period={metricPeriods.washOrders}
          onPeriodChange={(p) => handleMetricPeriodChange("washOrders", p)}
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Net platform revenue"
          value={formatNaira(revenue)}
          change={finance ? `${finance.changes?.netPlatformRevenue >= 0 ? "+" : ""}${Number(finance.changes?.netPlatformRevenue || 0).toFixed(1)}%` : ""}
          isPositive
          period={metricPeriods.revenue}
          onPeriodChange={(p) => handleMetricPeriodChange("revenue", p)}
        />
        <MetricCard
          icon={<UserCheck className="w-6 h-6" />}
          title="Total complaint"
          value={openComplaints.toLocaleString()}
          change=""
          isPositive
          period={metricPeriods.complaints}
          onPeriodChange={(p) => handleMetricPeriodChange("complaints", p)}
        />
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Volume"
          value={todayOrders.toLocaleString()}
          change=""
          isPositive
          period={metricPeriods.volume}
          onPeriodChange={(p) => handleMetricPeriodChange("volume", p)}
        />
      </div>

      <DonutChart period={chartPeriod} onPeriodChange={setChartPeriod} completed={completedOrders} cancelled={cancelledOrders} />
    </div>
  );
}
