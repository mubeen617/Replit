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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  MoreHorizontal,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Package,
} from "lucide-react";
import type { Customer, CustomerUser, Dispatch } from "@shared/schema";

interface CRMDispatchProps {
  user: Customer | CustomerUser;
  userType: "customer" | "user";
}

export default function CRMDispatch({ user, userType }: CRMDispatchProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [isDispatchDetailOpen, setIsDispatchDetailOpen] = useState(false);
  const [isEditCarrierOpen, setIsEditCarrierOpen] = useState(false);

  const userId = userType === "customer" ? (user as Customer).id : (user as CustomerUser).customerId;
  const agentId = userType === "user" ? (user as CustomerUser).id : null;

  const { data: dispatches = [], isLoading } = useQuery<Dispatch[]>({
    queryKey: ["/api/crm/dispatch", userId],
  });

  const updateDispatchMutation = useMutation({
    mutationFn: async ({ dispatchId, data }: { dispatchId: string; data: any }) => {
      return await apiRequest("PATCH", `/api/crm/dispatch/${dispatchId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Dispatch Updated",
        description: "Dispatch information has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dispatch", userId] });
      setIsEditCarrierOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update dispatch",
        variant: "destructive",
      });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (dispatchId: string) => {
      return await apiRequest("POST", `/api/crm/dispatch/${dispatchId}/complete`);
    },
    onSuccess: () => {
      toast({
        title: "Shipment Completed",
        description: "Dispatch has been marked as completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dispatch", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as completed",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ dispatchId, status }: { dispatchId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/crm/dispatch/${dispatchId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Dispatch status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dispatch", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "in_transit": return "bg-orange-100 text-orange-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned": return <Clock className="h-4 w-4" />;
      case "in_transit": return <Truck className="h-4 w-4" />;
      case "delivered": return <Package className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleUpdateCarrier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    const formData = new FormData(e.currentTarget);
    const carrierData = {
      carrierName: formData.get("carrierName") as string,
      carrierPhone: formData.get("carrierPhone") as string,
      carrierEmail: formData.get("carrierEmail") as string,
      driverName: formData.get("driverName") as string,
      driverPhone: formData.get("driverPhone") as string,
      truckInfo: formData.get("truckInfo") as string,
      notes: formData.get("notes") as string,
    };

    updateDispatchMutation.mutate({
      dispatchId: selectedDispatch.id,
      data: carrierData,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-gray-600 mt-1">Track active shipments and carrier assignments</p>
        </div>
      </div>

      {/* Dispatch Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Active Dispatches</span>
          </CardTitle>
          <CardDescription>
            Monitor vehicle shipments in progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading dispatches...</div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No dispatches available</h3>
              <p className="mb-6">Dispatches will appear here when orders are ready for shipping</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispatch #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Carrier Info</TableHead>
                    <TableHead>Driver Info</TableHead>
                    <TableHead>Pickup/Delivery</TableHead>
                    <TableHead>Final Tariff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dispatch) => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="font-medium" data-testid={`text-dispatch-number-${dispatch.id}`}>
                        {dispatch.dispatchNumber}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {dispatch.orderId?.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        {dispatch.carrierName ? (
                          <div className="space-y-1">
                            <div className="font-medium">{dispatch.carrierName}</div>
                            {dispatch.carrierPhone && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                <span>{dispatch.carrierPhone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {dispatch.driverName ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium">{dispatch.driverName}</span>
                            </div>
                            {dispatch.driverPhone && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                <span>{dispatch.driverPhone}</span>
                              </div>
                            )}
                            {dispatch.truckInfo && (
                              <div className="text-xs text-gray-500">{dispatch.truckInfo}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {dispatch.pickupDate && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>Pickup: {new Date(dispatch.pickupDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {dispatch.deliveryDate && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>Delivery: {new Date(dispatch.deliveryDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {dispatch.actualPickupDate && (
                            <div className="text-xs text-green-600">
                              Picked up: {new Date(dispatch.actualPickupDate).toLocaleDateString()}
                            </div>
                          )}
                          {dispatch.actualDeliveryDate && (
                            <div className="text-xs text-green-600">
                              Delivered: {new Date(dispatch.actualDeliveryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dispatch.finalTotalTariff ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">${dispatch.finalTotalTariff}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              C: ${dispatch.finalCarrierFees || '0'} • B: ${dispatch.finalBrokerFees || '0'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(dispatch.status || 'assigned')}
                          <Badge className={getStatusBadgeColor(dispatch.status || 'assigned')}>
                            {(dispatch.status || 'assigned').replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-dispatch-actions-${dispatch.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDispatch(dispatch);
                                setIsDispatchDetailOpen(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDispatch(dispatch);
                                setIsEditCarrierOpen(true);
                              }}
                              data-testid={`action-edit-carrier-${dispatch.id}`}
                            >
                              Edit Carrier Info
                            </DropdownMenuItem>
                            
                            {dispatch.status === 'assigned' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ 
                                  dispatchId: dispatch.id, 
                                  status: 'in_transit' 
                                })}
                                data-testid={`action-mark-in-transit-${dispatch.id}`}
                              >
                                Mark In Transit
                              </DropdownMenuItem>
                            )}
                            
                            {dispatch.status === 'in_transit' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ 
                                  dispatchId: dispatch.id, 
                                  status: 'delivered' 
                                })}
                                data-testid={`action-mark-delivered-${dispatch.id}`}
                              >
                                Mark Delivered
                              </DropdownMenuItem>
                            )}
                            
                            {dispatch.status === 'delivered' && (
                              <DropdownMenuItem 
                                onClick={() => markCompletedMutation.mutate(dispatch.id)}
                                data-testid={`action-mark-completed-${dispatch.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem>
                              Update Pickup Date
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Update Delivery Date
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

      {/* Dispatch Detail Dialog */}
      <Dialog open={isDispatchDetailOpen} onOpenChange={setIsDispatchDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispatch Details</DialogTitle>
            <DialogDescription>
              Complete dispatch information and tracking details
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispatch && (
            <div className="space-y-6">
              {/* Dispatch Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dispatch Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Dispatch Number</Label>
                      <p className="font-medium">{selectedDispatch.dispatchNumber}</p>
                    </div>
                    <div>
                      <Label>Order ID</Label>
                      <p className="font-medium">{selectedDispatch.orderId}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(selectedDispatch.status || 'assigned')}>
                          {(selectedDispatch.status || 'assigned').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Created Date</Label>
                      <p className="font-medium">
                        {selectedDispatch.createdAt && new Date(selectedDispatch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Final Carrier Fees:</Label>
                      <span className="font-medium">${selectedDispatch.finalCarrierFees || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <Label>Final Broker Fees:</Label>
                      <span className="font-medium">${selectedDispatch.finalBrokerFees || '0'}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg">
                      <Label>Final Total:</Label>
                      <span className="font-bold">${selectedDispatch.finalTotalTariff || '0'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Carrier and Driver Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Carrier Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Carrier Name</Label>
                      <p className="font-medium">{selectedDispatch.carrierName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <Label>Carrier Phone</Label>
                      <p className="font-medium">{selectedDispatch.carrierPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Carrier Email</Label>
                      <p className="font-medium">{selectedDispatch.carrierEmail || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Driver Name</Label>
                      <p className="font-medium">{selectedDispatch.driverName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <Label>Driver Phone</Label>
                      <p className="font-medium">{selectedDispatch.driverPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Truck Information</Label>
                      <p className="font-medium">{selectedDispatch.truckInfo || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shipment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDispatch.pickupDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">Scheduled Pickup</p>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedDispatch.pickupDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedDispatch.actualPickupDate && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">Actual Pickup</p>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedDispatch.actualPickupDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedDispatch.deliveryDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">Scheduled Delivery</p>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedDispatch.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedDispatch.actualDeliveryDate && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">Actual Delivery</p>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedDispatch.actualDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedDispatch.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedDispatch.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDispatchDetailOpen(false)}>
              Close
            </Button>
            {selectedDispatch?.status === 'delivered' && (
              <Button onClick={() => selectedDispatch && markCompletedMutation.mutate(selectedDispatch.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Carrier Dialog */}
      <Dialog open={isEditCarrierOpen} onOpenChange={setIsEditCarrierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Carrier Information</DialogTitle>
            <DialogDescription>
              Update carrier and driver details for this dispatch
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispatch && (
            <form onSubmit={handleUpdateCarrier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carrierName">Carrier Name</Label>
                  <Input
                    id="carrierName"
                    name="carrierName"
                    defaultValue={selectedDispatch.carrierName || ''}
                    placeholder="ABC Transport"
                  />
                </div>
                <div>
                  <Label htmlFor="carrierPhone">Carrier Phone</Label>
                  <Input
                    id="carrierPhone"
                    name="carrierPhone"
                    defaultValue={selectedDispatch.carrierPhone || ''}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="carrierEmail">Carrier Email</Label>
                  <Input
                    id="carrierEmail"
                    name="carrierEmail"
                    type="email"
                    defaultValue={selectedDispatch.carrierEmail || ''}
                    placeholder="carrier@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    name="driverName"
                    defaultValue={selectedDispatch.driverName || ''}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="driverPhone">Driver Phone</Label>
                  <Input
                    id="driverPhone"
                    name="driverPhone"
                    defaultValue={selectedDispatch.driverPhone || ''}
                    placeholder="(555) 987-6543"
                  />
                </div>
                <div>
                  <Label htmlFor="truckInfo">Truck Information</Label>
                  <Input
                    id="truckInfo"
                    name="truckInfo"
                    defaultValue={selectedDispatch.truckInfo || ''}
                    placeholder="2019 Freightliner - Plate ABC123"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedDispatch.notes || ''}
                  placeholder="Additional notes about the carrier or shipment..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditCarrierOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDispatchMutation.isPending}>
                  {updateDispatchMutation.isPending && (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  Update Carrier
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}