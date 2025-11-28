import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  ExternalLink,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Car,
  Package,
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
  const [isConvertToQuoteOpen, setIsConvertToQuoteOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customer_id;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads", userId, agentId],
    queryFn: async () => {
      const url = agentId
        ? `/api/crm/user-loads/${agentId}`
        : `/api/crm/leads/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      return response.json();
    }
  });

  const { data: teamMembers = [] } = useQuery<CustomerUser[]>({
    queryKey: ["/api/crm/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/crm/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    },
    enabled: userType === "customer",
  });

  // Function to handle zipcode lookup and auto-fill location
  const handleZipcodeChange = async (zipcode: string, locationType: 'origin' | 'destination') => {
    if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
        if (response.ok) {
          const data = await response.json();
          const city = data.places[0]['place name'];
          const state = data.places[0]['state abbreviation'];
          const location = `${city}, ${state}`;

          // Update the corresponding location field
          const locationInput = document.getElementById(locationType) as HTMLInputElement;
          if (locationInput) {
            locationInput.value = location;
          }
        }
      } catch (error) {
        console.log('Zipcode lookup failed:', error);
      }
    }
  };

  const addLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch(`/api/crm/leads/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead Added",
        description: "New lead has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId, agentId] });
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

  const assignUserMutation = useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      const response = await fetch(`/api/crm/leads/${userId}/${leadId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedUserId: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Assigned",
        description: "Lead has been assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId, agentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign user",
        variant: "destructive",
      });
    },
  });

  const convertToQuoteMutation = useMutation({
    mutationFn: async ({ leadId, quoteData }: { leadId: string; quoteData: any }) => {
      const response = await fetch(`/api/crm/leads/${userId}/${leadId}/convert-to-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert lead to quote');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead Converted",
        description: "Lead has been converted to a quote and moved to Quotes page",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId, agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotes", userId] });
      setIsConvertToQuoteOpen(false);
      setLeadToConvert(null);
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
      const response = await fetch(`/api/crm/leads/${userId}/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiEndpoint: endpoint,
          apiKey: key,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads from external API');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Leads Fetched Successfully",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", userId, agentId] });
      setIsApiDialogOpen(false);
      setApiEndpoint("");
      setApiKey("");
    },
    onError: (error: any) => {
      toast({
        title: "External API Integration",
        description: "External API lead fetching will be implemented in the next phase",
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
      customer_id: userId,
      assigned_user_id: agentId || (formData.get("assignedUserId") as string) || null,
      contact_name: formData.get("contactName") as string,
      contact_email: formData.get("contactEmail") as string,
      contact_phone: formData.get("contactPhone") as string,
      origin: formData.get("origin") as string,
      origin_zipcode: formData.get("originZipcode") as string,
      destination: formData.get("destination") as string,
      destination_zipcode: formData.get("destinationZipcode") as string,
      pickup_date: formData.get("pickupDate") as string,
      vehicle_year: (formData.get("vehicleYear") as string) || null,
      vehicle_make: (formData.get("vehicleMake") as string) || null,
      vehicle_model: (formData.get("vehicleModel") as string) || null,
      vehicle_type: (formData.get("vehicleType") as string) || null,
      trailer_type: (formData.get("trailerType") as string) || "open",
      condition: (formData.get("condition") as string) || "run",
      priority: (formData.get("priority") as string) || "normal",
      carrier_fees: carrierFeesStr,
      broker_fees: brokerFeesStr,
      total_tariff: totalTariff,
      notes: (formData.get("notes") as string) || null,
      source: "manual",
      status: "lead",
      delivery_date: (formData.get("deliveryDate") as string) || null,
    };

    addLeadMutation.mutate(leadData);
  };

  const handleConvertToQuote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadToConvert) return;

    const formData = new FormData(e.currentTarget);
    const quoteData = {
      total_tariff: formData.get("totalTariff"),
      carrier_fees: formData.get("carrierFees"),
      broker_fees: formData.get("brokerFees"),
      valid_until: formData.get("validUntil"),
      pickup_details: null,
      dropoff_details: null,
    };

    convertToQuoteMutation.mutate({ leadId: leadToConvert.id, quoteData });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      case "converted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track potential customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsApiDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Import from API
          </Button>
          <Button onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recent Leads</span>
          </CardTitle>
          <CardDescription>
            A list of all leads in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No leads found</h3>
              <p className="mb-6">Get started by adding a new lead or importing from API</p>
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
                    <TableHead>Lead Number</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Tariff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.public_id || lead.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{lead.contact_name}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{lead.contact_phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{lead.contact_email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span>{lead.origin}</span>
                          </div>
                          <div className="pl-1 border-l-2 border-gray-200 ml-1.5 h-3"></div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span>{lead.destination}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{lead.vehicle_year} {lead.vehicle_make} {lead.vehicle_model}</div>
                          <div className="text-sm text-gray-500 capitalize">{lead.vehicle_type} • {lead.condition}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-lg">${lead.total_tariff}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Carrier: ${lead.carrier_fees} • Broker: ${lead.broker_fees}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(lead.status || 'new')}>
                          {lead.status || 'new'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setLeadToConvert(lead);
                              setIsConvertToQuoteOpen(true);
                            }}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Convert to Quote
                            </DropdownMenuItem>
                            {userType === "customer" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Assign to User
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {teamMembers.map((member) => (
                                    <DropdownMenuItem
                                      key={member.id}
                                      onClick={() => assignUserMutation.mutate({ leadId: lead.id, userId: member.id })}
                                    >
                                      {member.username}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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

      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter lead details manually.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Contact Details</h3>
                <div className="grid gap-3">
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
                          {(teamMembers as CustomerUser[]).map((member: CustomerUser) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.first_name} {member.last_name}
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="condition">Condition</Label>
                      <Select name="condition" defaultValue="run">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="run">Running</SelectItem>
                          <SelectItem value="inop">Inoperable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="originZipcode">Origin Zipcode</Label>
                      <Input
                        id="originZipcode"
                        name="originZipcode"
                        data-testid="input-origin-zipcode"
                        placeholder="90210"
                        onChange={(e) => handleZipcodeChange(e.target.value, 'origin')}
                      />
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
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="destinationZipcode">Destination Zipcode</Label>
                      <Input
                        id="destinationZipcode"
                        name="destinationZipcode"
                        data-testid="input-destination-zipcode"
                        placeholder="10001"
                        onChange={(e) => handleZipcodeChange(e.target.value, 'destination')}
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

                  <div>
                    <Label htmlFor="deliveryDate">Delivery Date (Optional)</Label>
                    <Input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      data-testid="input-delivery-date"
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

      {/* Convert to Quote Dialog */}
      <Dialog open={isConvertToQuoteOpen} onOpenChange={setIsConvertToQuoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert Lead to Quote</DialogTitle>
            <DialogDescription>
              Fill in the quote details for lead {leadToConvert?.public_id}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvertToQuote} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrierFees">Carrier Fees ($)</Label>
                <Input
                  id="carrierFees"
                  name="carrierFees"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brokerFees">Broker Fees ($)</Label>
                <Input
                  id="brokerFees"
                  name="brokerFees"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalTariff">Total Tariff ($)</Label>
              <Input
                id="totalTariff"
                name="totalTariff"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConvertToQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={convertToQuoteMutation.isPending}>
                {convertToQuoteMutation.isPending && (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                )}
                Convert to Quote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}