import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  DollarSign, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
  userType: "customer" | "user";
  userName?: string;
}

const customerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/crm/dashboard" },
  { icon: Package, label: "Vehicle Leads", href: "/crm/leads" },
  { icon: Users, label: "Broker Agents", href: "/crm/agents" },
  { icon: Truck, label: "Carriers", href: "/crm/carriers" },
  { icon: DollarSign, label: "Financial", href: "/crm/financial" },
  { icon: BarChart3, label: "Reports", href: "/crm/reports" },
  { icon: Settings, label: "Settings", href: "/crm/settings" },
];

const agentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/crm/dashboard" },
  { icon: Package, label: "My Leads", href: "/crm/my-leads" },
  { icon: Truck, label: "Find Carriers", href: "/crm/carriers" },
  { icon: DollarSign, label: "My Commissions", href: "/crm/commissions" },
  { icon: Settings, label: "Profile", href: "/crm/profile" },
];

function Sidebar({ onLogout, userType, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  
  const navItems = userType === "customer" ? customerNavItems : agentNavItems;

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-lg text-gray-900">VehicleCRM</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && userName && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{userType === "customer" ? "Manager" : "Agent"}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed ? "px-2" : "px-3",
                  isActive ? "bg-primary-50 text-primary-700 border-primary-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;