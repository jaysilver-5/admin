export interface User {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    walletBalance: number;
    lastLoginDate: string;
  }
  
  export interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    total: string;
    active: string;
    activePercentage: string;
    inactive: string;
    inactivePercentage: string;
    isPositive: boolean;
  }
  
  export interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    period: string;
    onPeriodChange: (period: string) => void;
  }
  
  export interface PeriodDropdownProps {
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    className?: string;
  }
  