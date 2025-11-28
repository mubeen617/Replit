// CRM Layout component with role‑based navigation
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  FileText,
  ClipboardList,
  Truck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  DollarSign,
} from "lucide-react";
import type { Customer, CustomerUser } from "@shared/schema";

interface CRMLayoutProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user"; // "customer" = admin, "user" = regular user
  onLogout: () => void;
  children: React.ReactNode;
}

export default function CRMLayout({ user, userType, onLogout, children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Base navigation visible to everyone
  const navigation = [
    {
      name: "Dashboard",
      href: "/crm/dashboard",
      icon: LayoutDashboard,
      description: "Overview & stats",
    },
    {
      name: "Leads",
      href: "/crm/leads",
      icon: Package,
      description: "Manage leads",
    },
  ];

  // Admin‑only items
  if (userType === "customer") {
    navigation.push({
      name: "Team",
      href: "/crm/team",
      icon: Users,
      description: "Broker agents",
    });
    navigation.push({
      name: "Reports",
      href: "/crm/reports",
      icon: BarChart3,
      description: "Analytics & reports",
    });
  }

  // Regular‑user items
  if (userType === "user") {
    navigation.push({
      name: "Quotes",
      href: "/crm/quotes",
      icon: FileText,
      description: "Manage quotes",
    });
    navigation.push({
      name: "Orders",
      href: "/crm/orders",
      icon: ClipboardList,
      description: "Manage orders",
    });
    navigation.push({
      name: "Dispatch",
      href: "/crm/dispatch",
      icon: Truck,
      description: "Manage dispatches",
    });
  }

  const getInitials = (u: Customer | CustomerUser) => {
    if (userType === "customer") {
      const c = u as Customer;
      return c.adminName ? c.adminName.split(" ").map((n) => n[0]).join("").toUpperCase() : "CM";
    }
    const cu = u as CustomerUser;
    return `${cu.firstName?.[0] || ""}${cu.lastName?.[0] || ""}`.toUpperCase() || "CU";
  };

  const getUserDisplayName = (u: Customer | CustomerUser) => {
    if (userType === "customer") {
      const c = u as Customer;
      return c.adminName || "Customer Manager";
    }
    const cu = u as CustomerUser;
    return `${cu.firstName} ${cu.lastName}`;
  };

  const getUserRole = (u: Customer | CustomerUser) => {
    if (userType === "customer") {
      return "Broker Manager";
    }
    const cu = u as CustomerUser;
    return cu.role === "admin" ? "Broker Admin" : "Broker Agent";
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? "flex" : "hidden lg:flex"} flex-col h-full`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vehicle CRM</h2>
              <p className="text-xs text-gray-600">Brokerage System</p>
            </div>
          </div>
          {mobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            location === item.href || (item.href === "/crm/dashboard" && location === "/crm");
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer group ${isActive
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                onClick={() => mobile && setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"}`}
                />
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 truncate">{getUserDisplayName(user)}</div>
                <div className="text-xs text-gray-500">{getUserRole(user)}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-white lg:shadow-sm">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">Vehicle CRM</span>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}