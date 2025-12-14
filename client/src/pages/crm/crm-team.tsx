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
  Users,
  Plus,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { Customer, CustomerUser } from "@shared/schema";

interface CRMTeamProps {
  user: Customer;
  userType: "customer";
}

export default function CRMTeam({ user }: CRMTeamProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery<CustomerUser[]>({
    queryKey: ["/api/crm/users", user.id],
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/customer-users", userData);
    },
    onSuccess: () => {
      toast({
        title: "User Added",
        description: "New broker agent has been added to your team",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/users", user.id] });
      setIsAddUserOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/customer-users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "Broker agent has been removed from your team",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/users", user.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return await apiRequest("PATCH", `/api/customer-users/${userId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "Broker agent information has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/users", user.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const userData = {
      customerId: user.id,
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
      status: "active",
    };

    addUserMutation.mutate(userData);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this broker agent?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    updateUserMutation.mutate({
      userId,
      data: { role: newRole },
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your vehicle broker agents and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-broker">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Broker Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Broker Agent</DialogTitle>
                <DialogDescription>
                  Create a new broker agent account for your team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      required
                      data-testid="input-first-name"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      required
                      data-testid="input-last-name"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    data-testid="input-email"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    data-testid="input-password"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select name="role" defaultValue="user">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Broker Admin</SelectItem>
                      <SelectItem value="user">Broker Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addUserMutation.isPending} data-testid="button-save-broker">
                    {addUserMutation.isPending && (
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    Add Broker Agent
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Average success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Broker Agents</span>
          </CardTitle>
          <CardDescription>
            Manage your vehicle broker agents and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading team members...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No broker agents yet</h3>
              <p className="mb-6">Start by adding your first vehicle broker agent</p>
              <Button onClick={() => setIsAddUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Broker Agent
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium" data-testid={`text-member-name-${member.id}`}>
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Broker Agent
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role === 'admin' ? 'Broker Admin' :
                            member.role === 'user' ? 'Broker Agent' :
                              'Viewer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>
                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">85%</div>
                          <div className="text-xs text-gray-500">Success rate</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-member-actions-${member.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(member)}>
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member.id, member.role === 'admin' ? 'user' : 'admin')}
                              data-testid={`action-change-role-${member.id}`}
                            >
                              {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => updateUserMutation.mutate({
                                userId: member.id,
                                data: { status: member.status === 'active' ? 'inactive' : 'active' }
                              })}
                            >
                              {member.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              Reset Password
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(member.id)}
                              data-testid={`action-delete-member-${member.id}`}
                            >
                              Remove from Team
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