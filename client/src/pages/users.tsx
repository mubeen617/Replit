import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { CreateUserModal } from "@/components/create-user-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import type { Customer, CustomerUser } from "@shared/schema";

export default function Users() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: customersData } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/customers", selectedCustomer, "users", search],
    enabled: isAuthenticated && !!selectedCustomer,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${selectedCustomer}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const customers = customersData?.customers || [];

  const handleDelete = (user: CustomerUser) => {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "user": return "bg-blue-100 text-blue-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const columns = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {getInitials(user.firstName, user.lastName)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-secondary-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-secondary-500">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return (
          <Badge className={getRoleColor(user.role)}>
            {user.role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return (
          <Badge className={getStatusColor(user.status)}>
            {user.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return new Date(user.createdAt).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex h-screen bg-secondary-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="User Management"
          breadcrumb="Users"
          action={
            selectedCustomer ? (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2" size={16} />
                Add User
              </Button>
            ) : null
          }
        />

        <main className="flex-1 overflow-y-auto bg-secondary-50 p-6">
          <div className="bg-white rounded-xl shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">Customer Users</h3>
                <div className="flex items-center space-x-3">
                  {/* Customer Selection */}
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: Customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  {selectedCustomer && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={16} />
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 w-60"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedCustomer ? (
              <DataTable
                columns={columns}
                data={users || []}
                loading={usersLoading}
              />
            ) : (
              <div className="p-12 text-center">
                <p className="text-secondary-500">Select a customer to view their users</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedCustomer && (
        <CreateUserModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          customerId={selectedCustomer}
        />
      )}
    </div>
  );
}
