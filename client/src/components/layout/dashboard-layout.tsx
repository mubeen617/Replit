import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  userType: "customer" | "user";
  userName?: string;
}

export default function DashboardLayout({ 
  children, 
  onLogout, 
  userType, 
  userName 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} userType={userType} userName={userName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}