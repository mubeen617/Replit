import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Truck, LayoutDashboard, Users, UserCog, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | null };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "User Management", href: "/users", icon: UserCog },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "SA";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mr-3">
            <Truck className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Server Panel</h2>
            <p className="text-xs text-secondary-600">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                      : "text-secondary-700 hover:bg-secondary-50"
                  }`}
                >
                  <item.icon className="mr-3" size={20} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-secondary-200 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-medium">
              {getInitials(user?.firstName, user?.lastName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : "Server Admin"
              }
            </p>
            <p className="text-xs text-secondary-600 truncate">
              {user?.email || "admin@example.com"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
