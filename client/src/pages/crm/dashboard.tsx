import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Users, 
  DollarSign, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DashboardProps {
  customer: any;
  user: any;
  userType: "customer" | "user";
}

export default function Dashboard({ customer, user, userType }: DashboardProps) {
  const customerId = customer?.id || user?.customerId;

  const { data: stats } = useQuery<{
    totalUsers: number;
    activeLeads: number;
    totalCommission: number;
    conversionRate: number;
    recentLeads: number;
    completedLeads: number;
    pendingLeads: number;
  }>({
    queryKey: ["/api/crm/admin-stats", customerId],
  });

  const { data: recentLeads = [] } = useQuery({
    queryKey: ["/api/crm/leads", customerId],
  });

  const isManager = userType === "customer";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isManager ? "Manager Dashboard" : "Agent Dashboard"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isManager 
            ? `Welcome back, ${customer?.adminName || 'Manager'}` 
            : `Welcome back, ${user?.firstName || 'Agent'}`
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? "Active Leads" : "My Leads"}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vehicle shipments available
            </p>
          </CardContent>
        </Card>

        {isManager && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broker Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? "Total Revenue" : "My Commission"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalCommission || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Lead conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{stats?.completedLeads || 0} leads completed</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{stats?.pendingLeads || 0} leads pending</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{stats?.recentLeads || 0} new leads today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isManager ? (
              <>
                <Button className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View All Leads
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Agents
                </Button>
              </>
            ) : (
              <>
                <Button className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View My Leads
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Find Carriers
                </Button>
              </>
            )}
            <Button variant="secondary" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Leads Processed</span>
                  <span className="font-medium">{stats?.completedLeads || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((stats?.completedLeads || 0) * 10, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium">{stats?.conversionRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats?.conversionRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}