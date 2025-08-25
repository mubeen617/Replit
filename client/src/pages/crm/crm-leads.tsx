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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  MoreHorizontal,
  Download,
  ExternalLink,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Car,
} from "lucide-react";
import type { Customer, CustomerUser, Lead } from "@shared/schema";

interface CRMLeadsProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user";
}

export default function CRMLeads({ user, userType }: CRMLeadsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customerId;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads", userId],
  });

  const { data: teamMembers = [] } = useQuery<CustomerUser[]>({
    queryKey: ["/api/crm/users", userId],
    enabled: userType === "customer",
  });

  const addLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      return await apiRequest("POST", "/api/crm/leads", leadData);
    },
    onSuccess: () => {
      toast({
        title: "Lead Added",
        description: "New lead has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId] });
      setIsAddLeadOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add lead",
        variant: "destructive",
      });
    },
  });

  const convertToQuoteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return await apiRequest("POST", `/api/crm/leads/${leadId}/convert-to-quote`);
    },
    onSuccess: () => {
      toast({
        title: "Lead Converted",
        description: "Lead has been converted to a quote",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead",
        variant: "destructive",
      });
    },
  });

  const fetchLeadsMutation = useMutation({
    mutationFn: async ({ endpoint, key }: { endpoint: string; key?: string }) => {
      return await apiRequest("POST", `/api/crm/leads/${userId}/fetch`, {
        apiEndpoint: endpoint,
        apiKey: key,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Leads Fetched Successfully",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId] });
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

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const carrierFeesStr = (formData.get("carrierFees") as string) || "0";
    const brokerFeesStr = (formData.get("brokerFees") as string) || "0";
    const carrierFees = parseFloat(carrierFeesStr) || 0;
    const brokerFees = parseFloat(brokerFeesStr) || 0;
    const totalTariff = (carrierFees + brokerFees).toString();

    const leadData = {
      customerId: userId,
      assignedUserId: agentId || (formData.get("assignedUserId") as string) || null,
      leadNumber: formData.get("leadNumber") as string,
      contactName: formData.get("contactName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactPhone: formData.get("contactPhone") as string,
      origin: formData.get("origin") as string,
      destination: formData.get("destination") as string,
      pickupDate: formData.get("pickupDate") as string,
      vehicleYear: (formData.get("vehicleYear") as string) || null,
      vehicleMake: (formData.get("vehicleMake") as string) || null,
      vehicleModel: (formData.get("vehicleModel") as string) || null,
      vehicleType: (formData.get("vehicleType") as string) || null,
      trailerType: (formData.get("trailerType") as string) || "open",
      carrierFees: carrierFeesStr,
      brokerFees: brokerFeesStr,
      totalTariff: totalTariff,
      notes: (formData.get("notes") as string) || null,
      source: "manual",
      status: "lead",
    };

    addLeadMutation.mutate(leadData);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "lead": return "bg-blue-100 text-blue-800";
      case "quote": return "bg-yellow-100 text-yellow-800";
      case "order": return "bg-purple-100 text-purple-800";
      case "dispatch": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Shipping Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track your vehicle shipping opportunities</p>
        </div>
        <div className="flex gap-2">
          {userType === "customer" && (
            <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Fetch Leads
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fetch Leads from API</DialogTitle>
                  <DialogDescription>
                    Connect to an external API to automatically import new vehicle shipping leads.
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
                    onClick={() => fetchLeadsMutation.mutate({ endpoint: apiEndpoint, key: apiKey })}
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
          
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-lead">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vehicle Shipping Lead</DialogTitle>
                <DialogDescription>
                  Create a new vehicle shipping lead with customer and vehicle details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lead Details */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Lead Information</h3>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="leadNumber">Lead Number *</Label>
                        <Input
                          id="leadNumber"
                          name="leadNumber"
                          required
                          data-testid="input-lead-number"
                          placeholder="L-2025-001"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactName">Contact Name *</Label>
                        <Input
                          id="contactName"
                          name="contactName"
                          required
                          data-testid="input-contact-name"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactEmail">Contact Email *</Label>
                        <Input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          required
                          data-testid="input-contact-email"
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone *</Label>
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          required
                          data-testid="input-contact-phone"
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      {userType === "customer" && (
                        <div>
                          <Label htmlFor="assignedUserId">Assign to Agent</Label>
                          <Select name="assignedUserId">
                            <SelectTrigger>
                              <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.firstName} {member.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle & Route Details */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Vehicle & Route</h3>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="vehicleYear">Year</Label>
                          <Input
                            id="vehicleYear"
                            name="vehicleYear"
                            placeholder="2020"
                            data-testid="input-vehicle-year"
                          />
                        </div>
                        <div>
                          <Label htmlFor="vehicleMake">Make</Label>
                          <Input
                            id="vehicleMake"
                            name="vehicleMake"
                            placeholder="Toyota"
                            data-testid="input-vehicle-make"
                          />
                        </div>
                        <div>
                          <Label htmlFor="vehicleModel">Model</Label>
                          <Input
                            id="vehicleModel"
                            name="vehicleModel"
                            placeholder="Camry"
                            data-testid="input-vehicle-model"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="vehicleType">Vehicle Type</Label>
                          <Select name="vehicleType">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sedan">Sedan</SelectItem>
                              <SelectItem value="suv">SUV</SelectItem>
                              <SelectItem value="truck">Truck</SelectItem>
                              <SelectItem value="motorcycle">Motorcycle</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="trailerType">Trailer Type</Label>
                          <Select name="trailerType" defaultValue="open">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Enclosed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="origin">Origin *</Label>
                        <Input
                          id="origin"
                          name="origin"
                          required
                          data-testid="input-origin"
                          placeholder="Los Angeles, CA"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="destination">Destination *</Label>
                        <Input
                          id="destination"
                          name="destination"
                          required
                          data-testid="input-destination"
                          placeholder="New York, NY"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="pickupDate">Pickup Date *</Label>
                        <Input
                          id="pickupDate"
                          name="pickupDate"
                          type="date"
                          required
                          data-testid="input-pickup-date"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carrierFees">Carrier Fees ($)</Label>
                      <Input
                        id="carrierFees"
                        name="carrierFees"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-carrier-fees"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brokerFees">Broker Fees ($)</Label>
                      <Input
                        id="brokerFees"
                        name="brokerFees"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-broker-fees"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes or special requirements..."
                    data-testid="input-notes"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddLeadOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addLeadMutation.isPending} data-testid="button-save-lead">
                    {addLeadMutation.isPending && (
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    Add Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Active Leads</span>
          </CardTitle>
          <CardDescription>
            {userType === "customer" 
              ? "Manage and distribute vehicle shipping leads to your team"
              : "Your assigned vehicle shipping leads"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No leads available</h3>
              <p className="mb-6">Start by adding your first vehicle shipping lead</p>
              <Button onClick={() => setIsAddLeadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead #</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Tariff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium" data-testid={`text-lead-number-${lead.id}`}>
                        {lead.leadNumber}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{lead.contactName}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{lead.contactEmail}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{lead.contactPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {lead.vehicleYear} {lead.vehicleMake} {lead.vehicleModel}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.vehicleType} • {lead.trailerType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="font-medium">{lead.origin}</div>
                            <div className="text-gray-500">→ {lead.destination}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(lead.pickupDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">${lead.totalTariff || '0'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          C: ${lead.carrierFees || '0'} • B: ${lead.brokerFees || '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(lead.status || 'lead')}>
                          {lead.status || 'lead'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {lead.source && lead.source !== 'manual' ? (
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
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${lead.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                              View Details
                            </DropdownMenuItem>
                            {lead.status === 'lead' && (
                              <DropdownMenuItem 
                                onClick={() => convertToQuoteMutation.mutate(lead.id)}
                                data-testid={`action-convert-to-quote-${lead.id}`}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Convert to Quote
                              </DropdownMenuItem>
                            )}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}