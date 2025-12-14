import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  LogOut,
  User,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import type { CustomerUser } from "@shared/schema";

interface CRMUserDashboardProps {
  user: CustomerUser;
  onLogout: () => void;
}

export default function CRMUserDashboard({ user, onLogout }: CRMUserDashboardProps) {
  const { data: loads = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/user-loads", user.id],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/crm/user-stats", user.id],
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-transit": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "medium": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {user.first_name}
                </h1>
                <p className="text-sm text-gray-600">Vehicle Broker Agent Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{user.role}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Leads</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Currently working
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booked</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Lead conversion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Leads */}
        <Card>
          <CardHeader>
            <CardTitle>My Vehicle Shipping Leads</CardTitle>
            <CardDescription>
              Your assigned vehicle shipping leads and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">No leads assigned</h3>
                <p className="mb-6">You don't have any vehicle shipping leads assigned at the moment</p>
                <div className="text-sm text-gray-400">
                  Contact your broker manager for lead assignments
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead #</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Customer Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.map((load: any) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">#{load.public_id}</TableCell>
                      <TableCell>{load.origin}</TableCell>
                      <TableCell>{load.destination}</TableCell>
                      <TableCell>
                        {new Date(load.pickup_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(load.delivery_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(load.status)}>
                          {load.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(load.priority)}
                          <span className="capitalize">{load.priority}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Find Vehicle Carriers</CardTitle>
              <CardDescription>
                Search for available vehicle transport carriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Truck className="h-4 w-4 mr-2" />
                Search Vehicle Carriers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quote Calculator</CardTitle>
              <CardDescription>
                Calculate rates and margins for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Calculate Rate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Manager</CardTitle>
              <CardDescription>
                Get help from your broker manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Contact Manager
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}