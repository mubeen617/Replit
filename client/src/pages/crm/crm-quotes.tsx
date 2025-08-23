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
  FileText,
  MoreHorizontal,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Car,
  Plus,
  Send,
} from "lucide-react";
import type { Customer, CustomerUser, Quote } from "@shared/schema";

interface CRMQuotesProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user";
}

export default function CRMQuotes({ user, userType }: CRMQuotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isQuoteDetailOpen, setIsQuoteDetailOpen] = useState(false);

  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customerId;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/crm/quotes", userId, agentId],
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest(`/api/crm/quotes/${quoteId}/convert-to-order`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Quote Converted",
        description: "Quote has been converted to an order",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quote",
        variant: "destructive",
      });
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest(`/api/crm/quotes/${quoteId}/send`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Quote Sent",
        description: "Quote has been sent to the customer",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send quote",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">Manage customer quotes and proposals</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-create-quote">
            <Plus className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </div>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Active Quotes</span>
          </CardTitle>
          <CardDescription>
            Customer quotes awaiting approval or response
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading quotes...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No quotes available</h3>
              <p className="mb-6">Create quotes from leads to send to customers</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Quote
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Lead Info</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium" data-testid={`text-quote-id-${quote.id}`}>
                        {quote.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">Lead #{quote.leadId?.substring(0, 8)}</div>
                          <div className="text-sm text-gray-500">
                            Pickup: {quote.pickupAddress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{quote.pickupPersonName}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{quote.pickupPersonPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-lg">${quote.totalTariff}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Carrier: ${quote.carrierFees} • Broker: ${quote.brokerFees}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>
                            {quote.validUntil 
                              ? new Date(quote.validUntil).toLocaleDateString()
                              : 'No expiry'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(quote.status || 'draft')}>
                          {quote.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-quote-actions-${quote.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedQuote(quote);
                                setIsQuoteDetailOpen(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem 
                                onClick={() => sendQuoteMutation.mutate(quote.id)}
                                data-testid={`action-send-quote-${quote.id}`}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send to Customer
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'accepted' && (
                              <DropdownMenuItem 
                                onClick={() => convertToOrderMutation.mutate(quote.id)}
                                data-testid={`action-convert-to-order-${quote.id}`}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Convert to Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              Edit Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Cancel Quote
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

      {/* Quote Detail Dialog */}
      <Dialog open={isQuoteDetailOpen} onOpenChange={setIsQuoteDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
            <DialogDescription>
              Complete quote information and customer details
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Quote Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quote Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Quote ID</Label>
                      <p className="font-medium">{selectedQuote.id}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(selectedQuote.status || 'draft')}>
                          {selectedQuote.status || 'draft'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <p className="text-2xl font-bold text-green-600">${selectedQuote.totalTariff}</p>
                    </div>
                    <div>
                      <Label>Valid Until</Label>
                      <p className="font-medium">
                        {selectedQuote.validUntil 
                          ? new Date(selectedQuote.validUntil).toLocaleDateString()
                          : 'No expiry date'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Carrier Fees:</Label>
                      <span className="font-medium">${selectedQuote.carrierFees}</span>
                    </div>
                    <div className="flex justify-between">
                      <Label>Broker Fees:</Label>
                      <span className="font-medium">${selectedQuote.brokerFees}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg">
                      <Label>Total:</Label>
                      <span className="font-bold">${selectedQuote.totalTariff}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pickup Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Contact Person</Label>
                      <p className="font-medium">{selectedQuote.pickupPersonName}</p>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <p className="font-medium">{selectedQuote.pickupPersonPhone}</p>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <p className="font-medium">{selectedQuote.pickupAddress}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Drop-off Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Contact Person</Label>
                      <p className="font-medium">{selectedQuote.dropoffPersonName}</p>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <p className="font-medium">{selectedQuote.dropoffPersonPhone}</p>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <p className="font-medium">{selectedQuote.dropoffAddress}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Terms and Conditions */}
              {selectedQuote.specialTerms && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Special Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedQuote.specialTerms}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDetailOpen(false)}>
              Close
            </Button>
            {selectedQuote?.status === 'draft' && (
              <Button onClick={() => selectedQuote && sendQuoteMutation.mutate(selectedQuote.id)}>
                <Send className="h-4 w-4 mr-2" />
                Send to Customer
              </Button>
            )}
            {selectedQuote?.status === 'accepted' && (
              <Button onClick={() => selectedQuote && convertToOrderMutation.mutate(selectedQuote.id)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}