import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  Users,
  Package,
  DollarSign,
  MoreHorizontal,
  Plus,
  LogOut,
  Settings,
  BarChart3,
  UserPlus,
  Download,
  ExternalLink,
} from "lucide-react";
import type { Customer, CustomerUser, Lead } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CRMAdminDashboardProps {
  customer: Customer;
  onLogout: () => void;
}

export default function CRMAdminDashboard({ customer, onLogout }: CRMAdminDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  const { data: users = [], isLoading } = useQuery<CustomerUser[]>({
    queryKey: ["/api/crm/users", customer.id],
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    activeLeads: number;
    totalCommission: number;
    conversionRate: number;
  }>({
    queryKey: ["/api/crm/admin-stats", customer.id],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads", customer.id],
  });

  const fetchLeadsMutation = useMutation({
    mutationFn: async ({ endpoint, key }: { endpoint: string; key?: string }) => {
      return await apiRequest(`/api/crm/leads/${customer.id}/fetch`, "POST", {
        apiEndpoint: endpoint,
        apiKey: key,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Leads Fetched Successfully",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/admin-stats"] });
      setIsApiDialogOpen(false);
      setApiEndpoint("");
      setApiKey("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Fetching Leads",
        description: error.message || "Failed to fetch leads from API",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/customer-users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleFetchLeads = () => {
    if (!apiEndpoint.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API endpoint",
        variant: "destructive",
      });
      return;
    }
    fetchLeadsMutation.mutate({ 
      endpoint: apiEndpoint.trim(), 
      key: apiKey.trim() || undefined 
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "user": return "bg-blue-100 text-blue-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
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
                  {customer.name}
                </h1>
                <p className="text-sm text-gray-600">Vehicle Broker Manager Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                Vehicle shipments available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission</CardTitle>
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
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Vehicle leads to bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Vehicle Shipping Leads</h2>
            <div className="flex gap-2">
              <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch Leads
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Fetch Leads from API</DialogTitle>
                    <DialogDescription>
                      Connect to an external API to automatically import new vehicle shipping leads into your system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="endpoint">API Endpoint URL</Label>
                      <Input
                        id="endpoint"
                        placeholder="https://api.vehicleshipping.com/leads"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apikey">API Key (Optional)</Label>
                      <Input
                        id="apikey"
                        type="password"
                        placeholder="Bearer token or API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApiDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleFetchLeads} 
                      disabled={fetchLeadsMutation.isPending}
                    >
                      {fetchLeadsMutation.isPending && (
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      )}
                      Fetch Leads
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Manage and distribute vehicle shipping leads to your broker agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="text-center py-8">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No vehicle shipping leads available</p>
                  <p className="text-sm">Use the "Fetch Leads" button to import vehicle shipping leads from external APIs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.slice(0, 10).map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.leadNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <span className="font-medium">{lead.origin}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span>{lead.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(lead.pickupDate).toLocaleDateString()}</TableCell>
                        <TableCell>{lead.vehicleType || 'Any Vehicle'}</TableCell>
                        <TableCell>{lead.customerRate ? `$${lead.customerRate}` : 'TBD'}</TableCell>
                        <TableCell>
                          <Badge className={`${
                            lead.status === 'available' ? 'bg-green-100 text-green-800' :
                            lead.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'booked' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.assignedUserId ? 'Assigned' : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            {lead.source ? (
                              <>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[100px]" title={lead.source}>
                                  {lead.source.replace(/^https?:\/\//, '').split('/')[0]}
                                </span>
                              </>
                            ) : (
                              'Manual'
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Assign to Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Vehicle Broker Agents</CardTitle>
                <CardDescription>
                  Manage your vehicle broker agents and their access levels
                </CardDescription>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Broker
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No vehicle broker agents yet</h3>
                <p className="mb-4">Start by adding your first vehicle broker agent</p>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Broker
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: CustomerUser) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}