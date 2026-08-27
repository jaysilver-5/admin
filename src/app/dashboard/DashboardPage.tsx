"use client";
import * as React from "react";
import {
  Home,
  Users,
  Store,
  Car,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Bell,
  LifeBuoy,
  Search as SearchIcon,
  Landmark,
  ArrowDownToLine,
  ShieldCheck,
  ScrollText,
} from "lucide-react";

import Sidebar from "@/components/dashboard/layout/Sidebar";
import MobileTabs from "@/components/dashboard/layout/MobileTabs";

import HomeTab from "./tabs/HomeTab";
import UserManagementTab from "./tabs/UserManagementTab";
import MerchantManagementTab from "./tabs/MerchantManagementTab";
import RiderManagementTab from "./tabs/RiderManagementTab";
import PriceManagementTab from "./tabs/PriceManagementTab";
import OrderManagementTab from "./tabs/OrderManagementTab";
import ReferralTab from "./tabs/ReferralTab";
import SendNotificationsTab from "./tabs/SendNotificationsTab";
import SupportTab from "./tabs/SupportTab";
import FinanceTab from "./tabs/FinanceTab";
import WithdrawalsTab from "./tabs/WithdrawalsTab";
import AdminTeamTab from "./tabs/AdminTeamTab";
import AuditLogTab from "./tabs/AuditLogTab";
import {
  AdminContext,
  clearSession,
  getAdminContext,
  getAuthUser,
  requireAdminSession,
} from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  {
    slug: "overview",
    name: "Overview",
    permission: "dashboard.read",
    icon: <Home className="w-4 h-4" />,
    component: HomeTab,
  },
  {
    slug: "finance",
    name: "Revenue & Finance",
    permission: "finance.read",
    icon: <Landmark className="w-4 h-4" />,
    component: FinanceTab,
  },
  {
    slug: "withdrawals",
    name: "Withdrawals",
    permission: "withdrawals.read",
    icon: <ArrowDownToLine className="w-4 h-4" />,
    component: WithdrawalsTab,
  },
  {
    slug: "users",
    name: "Users",
    permission: "users.read",
    icon: <Users className="w-4 h-4" />,
    component: UserManagementTab,
  },
  {
    slug: "merchants",
    name: "Merchants",
    permission: "merchants.read",
    icon: <Store className="w-4 h-4" />,
    component: MerchantManagementTab,
  },
  {
    slug: "riders",
    name: "Riders",
    permission: "riders.read",
    icon: <Car className="w-4 h-4" />,
    component: RiderManagementTab,
  },
  {
    slug: "orders",
    name: "Orders",
    permission: "orders.read",
    icon: <ShoppingCart className="w-4 h-4" />,
    component: OrderManagementTab,
  },
  {
    slug: "pricing",
    name: "Pricing",
    permission: "pricing.read",
    icon: <DollarSign className="w-4 h-4" />,
    component: PriceManagementTab,
  },
  {
    slug: "referrals",
    name: "Referrals",
    permission: "referrals.read",
    icon: <UserCheck className="w-4 h-4" />,
    component: ReferralTab,
  },
  {
    slug: "notifications",
    name: "Notifications",
    permission: "notifications.read",
    icon: <Bell className="w-4 h-4" />,
    component: SendNotificationsTab,
  },
  {
    slug: "support",
    name: "Support",
    permission: "support.read",
    icon: <LifeBuoy className="w-4 h-4" />,
    component: SupportTab,
  },
  {
    slug: "admin-team",
    name: "Admin Team",
    permission: "admins.manage",
    icon: <ShieldCheck className="w-4 h-4" />,
    component: AdminTeamTab,
  },
  {
    slug: "audit-log",
    name: "Audit Log",
    permission: "audit.read",
    icon: <ScrollText className="w-4 h-4" />,
    component: AuditLogTab,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = React.useState(false);
  const [admin, setAdmin] = React.useState<AdminContext | null>(null);
  const [accessError, setAccessError] = React.useState<string | null>(null);
  const user = getAuthUser();

  React.useEffect(() => {
    if (!requireAdminSession()) {
      router.replace("/auth/signin");
      return;
    }
    getAdminContext()
      .then((context) => {
        setAdmin(context);
        setChecked(true);
      })
      .catch((error) => {
        setAccessError(
          error?.message || "Unable to load administrator permissions",
        );
        setChecked(true);
      });
  }, [router]);

  const visibleTabs = TABS.filter((tab) =>
    admin?.permissions.includes(tab.permission),
  );
  const activeSlug = pathname.split("/").filter(Boolean).at(-1) || "overview";
  const activeTab =
    visibleTabs.find((tab) => tab.slug === activeSlug) || visibleTabs[0];
  const ActiveView = activeTab?.component;

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] grid place-items-center text-sm text-gray-500">
        Checking admin session…
      </div>
    );
  }

  if (accessError || !admin || !ActiveView) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] grid place-items-center px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
          <h1 className="font-semibold text-slate-950">
            Admin access unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {accessError ||
              "This account has no assigned administrative capabilities."}
          </p>
          <button
            onClick={() => {
              clearSession();
              router.replace("/auth/signin");
            }}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Fixed Sidebar */}
      <Sidebar
        items={visibleTabs.map(({ name, icon }) => ({ name, icon }))}
        active={activeTab.name}
        onSelect={(name) => {
          const tab = visibleTabs.find((item) => item.name === name);
          if (tab) router.push(`/dashboard/${tab.slug}`);
        }}
      />

      {/* Header sits at content edge and spans full width */}
      <header className="sticky top-0 z-30 bg-white lg:pl-[280px]">
        <div className="pl-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-[320px] bg-[#F2F3F480] relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search"
                className="block w-full pl-11 pr-3 py-2.5 text-[14px] placeholder:text-[#ABB1BA] rounded-xl focus:ring-1 bg-[#F2F3F480]"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                <Bell className="h-6 w-6" />
              </button>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/auth/signin");
                }}
                className="w-9 h-9 rounded-full bg-orange-500 grid place-items-center"
                title="Sign out"
              >
                <span className="text-white text-[13px] font-medium">
                  {String(
                    admin.displayName || user?.email || user?.phone || "A",
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content column (aligned with header start) */}
      <div className="lg:pl-[280px]">
        <MobileTabs
          items={visibleTabs.map(({ name, icon }) => ({ name, icon }))}
          active={activeTab.name}
          onSelect={(name) => {
            const tab = visibleTabs.find((item) => item.name === name);
            if (tab) router.push(`/dashboard/${tab.slug}`);
          }}
        />

        <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
          {activeTab.slug === "overview" ? (
            <HomeTab permissions={admin.permissions} />
          ) : activeTab.slug === "withdrawals" ? (
            <WithdrawalsTab permissions={admin.permissions} />
          ) : (
            <ActiveView />
          )}
        </main>
      </div>
    </div>
  );
}
