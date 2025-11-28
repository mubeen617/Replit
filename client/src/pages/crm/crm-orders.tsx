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
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  MoreHorizontal,
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Download,
  Signature,
} from "lucide-react";
import type { Customer, CustomerUser, Order } from "@shared/schema";

interface CRMOrdersProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user";
}

export default function CRMOrders({ user, userType }: CRMOrdersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customer_id;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/crm/orders", userId],
    queryFn: async () => {
      const response = await fetch(`/api/crm/orders/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });

  const sendContractMutation = useMutation({
    mutationFn: async ({ orderId, contract_type }: { orderId: string; contract_type: string }) => {
      return await apiRequest("POST", `/api/crm/orders/${orderId}/send-contract`, { contract_type });
    },
    onSuccess: () => {
      toast({
        title: "Contract Sent",
        description: "E-contract has been sent to the customer",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/orders", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send contract",
        variant: "destructive",
      });
    },
  });

  const convertToDispatchMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("POST", `/api/crm/orders/${orderId}/convert-to-dispatch`);
    },
    onSuccess: () => {
      toast({
        title: "Order Dispatched",
        description: "Order has been moved to dispatch",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/orders", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispatch order",
        variant: "destructive",
      });
    },
  });

  const markSignedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("POST", `/api/crm/orders/${orderId}/mark-signed`);
    },
    onSuccess: () => {
      toast({
        title: "Contract Signed",
        description: "Order has been marked as signed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/orders", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as signed",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending_signature": return "bg-yellow-100 text-yellow-800";
      case "signed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "change_requested": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_signature": return <Clock className="h-4 w-4" />;
      case "signed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <ArrowRight className="h-4 w-4" />;
      case "change_requested": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage active orders and contracts</p>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>Active Orders</span>
          </CardTitle>
          <CardDescription>
            Orders with contracts and customer signatures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No orders available</h3>
              <p className="mb-6">Orders will appear here when quotes are accepted and converted</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Contract Status</TableHead>
                    <TableHead>Signed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium" data-testid={`text-order-number-${order.public_id}`}>
                        {order.public_id}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {order.quote_id?.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.contract_type?.replace('_', ' ') || 'standard'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {order.contract_sent ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {order.contract_sent ? 'Sent' : 'Not sent'}
                          </span>
                        </div>
                        {order.contract_sent_at && (
                          <div className="text-xs text-gray-500">
                            {new Date(order.contract_sent_at).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.contract_signed ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-green-600">
                              <Signature className="h-4 w-4" />
                              <span className="text-sm font-medium">Signed</span>
                            </div>
                            {order.contract_signed_at && (
                              <div className="text-xs text-gray-500">
                                {new Date(order.contract_signed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status || 'pending_signature')}
                          <Badge className={getStatusBadgeColor(order.status || 'pending_signature')}>
                            {(order.status || 'pending_signature').replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-order-actions-${order.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsOrderDetailOpen(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>

                            {!order.contract_sent && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => sendContractMutation.mutate({
                                    orderId: order.id,
                                    contract_type: 'standard'
                                  })}
                                  data-testid={`action-send-contract-${order.id}`}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Contract
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => sendContractMutation.mutate({
                                    orderId: order.id,
                                    contract_type: 'with_cc'
                                  })}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send with CC
                                </DropdownMenuItem>
                              </>
                            )}

                            {order.contract_sent && !order.contract_signed && (
                              <DropdownMenuItem
                                onClick={() => markSignedMutation.mutate(order.id)}
                                data-testid={`action-mark-signed-${order.id}`}
                              >
                                <Signature className="h-4 w-4 mr-2" />
                                Mark as Signed
                              </DropdownMenuItem>
                            )}

                            {order.contract_signed && order.status === 'signed' && (
                              <DropdownMenuItem
                                onClick={() => convertToDispatchMutation.mutate(order.id)}
                                data-testid={`action-convert-to-dispatch-${order.id}`}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Move to Dispatch
                              </DropdownMenuItem>
                            )}

                            {order.contract_signed && (
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download Contract
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem>
                              Create Change Order
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Cancel Order
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

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete order information and contract status
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Order Number</Label>
                      <p className="font-medium">{selectedOrder.public_id}</p>
                    </div>
                    <div>
                      <Label>Quote ID</Label>
                      <p className="font-medium">{selectedOrder.quote_id}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(selectedOrder.status || 'pending_signature')}>
                          {(selectedOrder.status || 'pending_signature').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Created Date</Label>
                      <p className="font-medium">
                        {selectedOrder.created_at && new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Contract Type</Label>
                      <p className="font-medium capitalize">
                        {selectedOrder.contract_type?.replace('_', ' ') || 'standard'}
                      </p>
                    </div>
                    <div>
                      <Label>Contract Sent</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedOrder.contract_sent ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span>{selectedOrder.contract_sent ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedOrder.contract_sent_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Sent on {new Date(selectedOrder.contract_sent_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Contract Signed</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedOrder.contract_signed ? (
                          <Signature className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span>{selectedOrder.contract_signed ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedOrder.contract_signed_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Signed on {new Date(selectedOrder.contract_signed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Change Orders */}
              {selectedOrder.change_orders && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      {Array.isArray(selectedOrder.change_orders) && selectedOrder.change_orders.length > 0 ? (
                        <div className="space-y-2">
                          {(selectedOrder.change_orders as any[]).map((change: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium">{change.description}</p>
                              <p className="text-xs text-gray-400">{change.date}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        'No change orders'
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDetailOpen(false)}>
              Close
            </Button>
            {selectedOrder && !selectedOrder.contract_sent && (
              <Button onClick={() => sendContractMutation.mutate({
                orderId: selectedOrder.id,
                contract_type: 'standard'
              })}>
                <Send className="h-4 w-4 mr-2" />
                Send Contract
              </Button>
            )}
            {selectedOrder?.contract_signed && selectedOrder.status === 'signed' && (
              <Button onClick={() => selectedOrder && convertToDispatchMutation.mutate(selectedOrder.id)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Move to Dispatch
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}