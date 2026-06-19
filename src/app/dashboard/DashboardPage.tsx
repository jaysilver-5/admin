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
import { clearSession, getAuthUser, requireAdminSession } from "@/lib/api";
import { useRouter } from "next/navigation";

const TABS = [
  { name: "Home", icon: <Home className="w-4 h-4" />, component: HomeTab },
  { name: "User Management", icon: <Users className="w-4 h-4" />, component: UserManagementTab },
  { name: "Merchant Management", icon: <Store className="w-4 h-4" />, component: MerchantManagementTab },
  { name: "Rider Management", icon: <Car className="w-4 h-4" />, component: RiderManagementTab },
  { name: "Price Management", icon: <DollarSign className="w-4 h-4" />, component: PriceManagementTab },
  { name: "Order Management", icon: <ShoppingCart className="w-4 h-4" />, component: OrderManagementTab },
  { name: "Referral", icon: <UserCheck className="w-4 h-4" />, component: ReferralTab },
  { name: "Send Notifications", icon: <Bell className="w-4 h-4" />, component: SendNotificationsTab },
  { name: "Support", icon: <LifeBuoy className="w-4 h-4" />, component: SupportTab },
];

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = React.useState<string>("Home");
  const [checked, setChecked] = React.useState(false);
  const user = getAuthUser();

  React.useEffect(() => {
    if (!requireAdminSession()) {
      router.replace("/auth/signin");
      return;
    }
    setChecked(true);
  }, [router]);

  const ActiveView = (TABS.find((t) => t.name === active) || TABS[0]).component;

  if (!checked) {
    return <div className="min-h-screen bg-[#F7F8FA] grid place-items-center text-sm text-gray-500">Checking admin session…</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Fixed Sidebar */}
      <Sidebar
        items={TABS.map(({ name, icon }) => ({ name, icon }))}
        active={active}
        onSelect={setActive}
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
                onClick={() => { clearSession(); router.push("/auth/signin"); }}
                className="w-9 h-9 rounded-full bg-orange-500 grid place-items-center"
                title="Sign out"
              >
                <span className="text-white text-[13px] font-medium">{String(user?.email || user?.phone || "A").charAt(0).toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content column (aligned with header start) */}
      <div className="lg:pl-[280px]">
        <MobileTabs
          items={TABS.map(({ name, icon }) => ({ name, icon }))}
          active={active}
          onSelect={setActive}
        />

        <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
