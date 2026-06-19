"use client";
import * as React from "react";
import { Car, DollarSign, ShoppingCart, Store, UserCheck, Users } from "lucide-react";
import StatCard from "@/components/dashboard/cards/StatCard";
import MetricCard from "@/components/dashboard/cards/MetricCard";
import DonutChart from "@/components/dashboard/charts/DonutChart";
import { apiFetch, formatNaira } from "@/lib/api";

export default function HomeTab() {
  const [chartPeriod, setChartPeriod] = React.useState("This Month");
  const [metricPeriods, setMetricPeriods] = React.useState({
    washOrders: "This Week",
    revenue: "This Week",
    complaints: "This Week",
    volume: "This Week",
  });

  const [metrics, setMetrics] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleMetricPeriodChange = (k: string, p: string) =>
    setMetricPeriods((prev) => ({ ...prev, [k]: p }));

  React.useEffect(() => {
    let alive = true;
    apiFetch<any>("/admin/dashboard/metrics")
      .then((data) => { if (alive) setMetrics(data); })
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
  const revenue = metrics?.finance?.monthlyRevenue ?? 0;
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
          activePercentage="+4.00%"
          inactive="0"
          inactivePercentage="+2.00%"
          isPositive
        />
        <StatCard
          icon={<Store className="w-6 h-6 text-emerald-600" />}
          title="Total Merchants"
          total={merchants.toLocaleString()}
          active={(merchants - (metrics?.pendingApprovals?.merchants ?? 0)).toLocaleString()}
          activePercentage="+4.00%"
          inactive={(metrics?.pendingApprovals?.merchants ?? 0).toLocaleString()}
          inactivePercentage="+2.00%"
          isPositive
        />
        <StatCard
          icon={<Car className="w-6 h-6 text-emerald-600" />}
          title="Total Riders"
          total={riders.toLocaleString()}
          active={(riders - (metrics?.pendingApprovals?.riders ?? 0)).toLocaleString()}
          activePercentage="+4.00%"
          inactive={(metrics?.pendingApprovals?.riders ?? 0).toLocaleString()}
          inactivePercentage="+2.00%"
          isPositive
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Total wash orders"
          value={(activeOrders + completedOrders + cancelledOrders).toLocaleString()}
          change="+20.00%"
          isPositive
          period={metricPeriods.washOrders}
          onPeriodChange={(p) => handleMetricPeriodChange("washOrders", p)}
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Revenue"
          value={formatNaira(revenue)}
          change="+9.00%"
          isPositive
          period={metricPeriods.revenue}
          onPeriodChange={(p) => handleMetricPeriodChange("revenue", p)}
        />
        <MetricCard
          icon={<UserCheck className="w-6 h-6" />}
          title="Total complaint"
          value={openComplaints.toLocaleString()}
          change="+20.00%"
          isPositive
          period={metricPeriods.complaints}
          onPeriodChange={(p) => handleMetricPeriodChange("complaints", p)}
        />
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Volume"
          value={todayOrders.toLocaleString()}
          change="+20.00%"
          isPositive
          period={metricPeriods.volume}
          onPeriodChange={(p) => handleMetricPeriodChange("volume", p)}
        />
      </div>

      <DonutChart period={chartPeriod} onPeriodChange={setChartPeriod} />
    </div>
  );
}
