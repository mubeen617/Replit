import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Users, UserCheck, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalCustomers: number;
    activeUsers: number;
    pendingUsers: number;
    issues?: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const statsCards = [
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "bg-primary-100 text-primary-600"
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Pending",
      value: stats?.pendingUsers || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Issues",
      value: stats?.issues || 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600"
    }
  ];

  return (
    <div className="flex h-screen bg-secondary-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          breadcrumb="Dashboard"
        />
        
        <main className="flex-1 overflow-y-auto bg-secondary-50 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <Card key={index} className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                        <card.icon size={20} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-secondary-600">{card.title}</p>
                      <p className="text-2xl font-semibold text-secondary-900">
                        {statsLoading ? "..." : card.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Welcome Content */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Welcome to Server Panel</h3>
              <p className="text-secondary-600 mb-4">
                Use the navigation menu to manage your truck dispatching CRM customers and their users.
              </p>
              <div className="space-y-2 text-sm text-secondary-600">
                <p>• <strong>Customers:</strong> Manage customer organizations and their admin contacts</p>
                <p>• <strong>User Management:</strong> Manage users within each customer organization</p>
                <p>• <strong>Settings:</strong> Configure system settings and preferences</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
