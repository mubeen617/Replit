import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  Package,
  FileText,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import type { Customer, CustomerUser } from "@shared/schema";

interface CRMDashboardProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user";
}

export default function CRMDashboard({ user, userType }: CRMDashboardProps) {
  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customerId;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: stats } = useQuery<{
    totalLeads: number;
    activeQuotes: number;
    pendingOrders: number;
    inDispatch: number;
    completed: number;
    totalRevenue: number;
    monthlyRevenue: number;
    conversionRate: number;
    avgDealSize: number;
  }>({
    queryKey: ["/api/crm/dashboard-stats", userId, agentId],
  });

  const { data: recentActivity = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/recent-activity", userId, agentId],
  });

  const getDisplayName = () => {
    if (userType === "customer") {
      return (user as Customer).adminName || "Manager";
    } else {
      const customerUser = user as CustomerUser;
      return customerUser.firstName;
    }
  };

  const getUserRole = () => {
    if (userType === "customer") {
      return "Broker Manager";
    } else {
      const customerUser = user as CustomerUser;
      return customerUser.role === "admin" ? "Broker Admin" : "Broker Agent";
    }
  };

  const statsCards = [
    {
      title: "Active Leads",
      value: stats?.totalLeads || 0,
      icon: Package,
      color: "text-blue-600 bg-blue-100",
      description: "Vehicle shipping leads",
    },
    {
      title: "Quotes",
      value: stats?.activeQuotes || 0,
      icon: FileText,
      color: "text-green-600 bg-green-100",
      description: "Active quotes",
    },
    {
      title: "Orders",
      value: stats?.pendingOrders || 0,
      icon: ClipboardList,
      color: "text-orange-600 bg-orange-100",
      description: "Pending orders",
    },
    {
      title: "In Transit",
      value: stats?.inDispatch || 0,
      icon: Truck,
      color: "text-purple-600 bg-purple-100",
      description: "Dispatched shipments",
    },
  ];

  const performanceCards = [
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-100",
      description: "This month",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100",
      description: "Lead to order",
    },
    {
      title: "Avg Deal Size",
      value: `$${stats?.avgDealSize?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-100",
      description: "Per transaction",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: TrendingUp,
      color: "text-green-600 bg-green-100",
      description: "This month",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {getDisplayName()}!
          </h1>
          <p className="text-gray-600 mt-1">{getUserRole()} Dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Workflow Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceCards.map((card, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as you work with leads</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Add New Lead</p>
                    <p className="text-sm text-gray-500">Create a vehicle shipping lead</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Create Quote</p>
                    <p className="text-sm text-gray-500">Generate customer quote</p>
                  </div>
                </div>
              </div>
              
              {userType === "customer" && (
                <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Team</p>
                      <p className="text-sm text-gray-500">Add or manage broker agents</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">Analyze performance data</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}