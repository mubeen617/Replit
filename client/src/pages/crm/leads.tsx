import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Package, 
  Download, 
  Plus, 
  Filter,
  Search,
  MapPin,
  Calendar
} from "lucide-react";

interface Lead {
  id: string;
  leadNumber: number;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate?: string;
  customerRate?: string;
  vehicleType?: string;
  transportType?: string;
  status: string;
  priority: string;
  assignedUserId?: string;
  notes?: string;
  source?: string;
}

interface LeadsProps {
  customer: any;
  userType: "customer" | "user";
}

export default function Leads({ customer, userType }: LeadsProps) {
  const { toast } = useToast();
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const customerId = customer?.id;

  const { data: leads = [], isLoading: leadsLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads", customerId],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/users", customerId],
  });

  const fetchLeadsMutation = useMutation({
    mutationFn: async ({ endpoint, key }: { endpoint: string; key: string }) => {
      return await apiRequest(`/api/crm/leads/${customerId}/fetch`, "POST", {
        apiEndpoint: endpoint,
        apiKey: key,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Leads fetched successfully from external API.",
      });
      setIsApiDialogOpen(false);
      setApiEndpoint("");
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", customerId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leads from API.",
        variant: "destructive",
      });
    },
  });

  const handleFetchLeads = () => {
    if (!apiEndpoint.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API endpoint URL.",
        variant: "destructive",
      });
      return;
    }
    fetchLeadsMutation.mutate({ endpoint: apiEndpoint, key: apiKey });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "booked":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadNumber?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Shipping Leads</h1>
        <p className="text-gray-600 mt-1">Manage and distribute vehicle shipping leads to your broker agents</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search leads by origin, destination, vehicle type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
          </select>
          
          {userType === "customer" && (
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
          )}
          
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Shipping Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} of {leads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                {leads.length === 0 ? "No leads available" : "No leads match your filters"}
              </h3>
              <p className="text-sm mb-4">
                {leads.length === 0 
                  ? "Use the 'Fetch Leads' button to import vehicle shipping leads from external APIs"
                  : "Try adjusting your search terms or filters"
                }
              </p>
              {leads.length === 0 && userType === "customer" && (
                <Button onClick={() => setIsApiDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Fetch Your First Leads
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead #</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">#{lead.leadNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{lead.origin}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-600">{lead.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(lead.pickupDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{lead.vehicleType || 'Any Vehicle'}</TableCell>
                      <TableCell>{lead.transportType || 'Open'}</TableCell>
                      <TableCell>{lead.customerRate ? `$${lead.customerRate}` : 'TBD'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.assignedUserId ? (
                          <span className="text-sm text-gray-600">
                            {users.find((u: any) => u.id === lead.assignedUserId)?.firstName || 'Unknown'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">View</Button>
                          {userType === "customer" && (
                            <Button variant="ghost" size="sm">Assign</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}