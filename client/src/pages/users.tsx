import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load customers for the selector
  const { data: customersData, isLoading: customersLoading } = useQuery<{ customers: Customer[]; total: number }>(
    {
      queryKey: ["customers"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/api/customers");
        return await res.json();
      },
      placeholderData: (previousData) => previousData,
    }
  );

  // Load users for the selected customer
  const { data: usersData, isLoading: usersLoading } = useQuery<CustomerUser[]>(
    {
      queryKey: ["users", selectedCustomer, { search }],
      enabled: !!selectedCustomer,
      queryFn: async () => {
        const params = new URLSearchParams({ search });
        const res = await apiRequest("GET", `/api/customers/${selectedCustomer}/users?${params.toString()}`);
        return await res.json();
      },
      placeholderData: (previousData) => previousData,
    }
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${selectedCustomer}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", selectedCustomer] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const handleDelete = (user: CustomerUser) => {
    if (confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "user":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase();

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
                <span className="text-primary-600 font-medium text-sm">{getInitials(user.first_name, user.last_name)}</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-secondary-900">{user.first_name} {user.last_name}</div>
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
        return <Badge className={getRoleColor(user.role)}>{user.role}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return <Badge className={getStatusColor(user.status)}>{user.status}</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: CustomerUser } }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm"><Edit size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} disabled={deleteMutation.isPending}><Trash2 size={16} /></Button>
          </div>
        );
      },
    },
  ];

  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;

  return (
    <div className="flex h-screen bg-secondary-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="User Management"
          breadcrumb="Users"
          action={selectedCustomer && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2" size={16} />Add User
            </Button>
          )}
        />
        <main className="flex-1 overflow-y-auto bg-secondary-50 p-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">Customer Users</h3>
                <div className="flex items-center space-x-3">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-60"><SelectValue placeholder="Select customer..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c: Customer) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={16} />
                      <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-60" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {selectedCustomer ? (
              <DataTable columns={columns} data={usersData || []} loading={usersLoading} />
            ) : (
              <div className="p-12 text-center"><p className="text-secondary-500">Select a customer to view their users</p></div>
            )}
          </div>
        </main>
        {selectedCustomer && (
          <CreateUserModal open={showCreateModal} onOpenChange={setShowCreateModal} customerId={selectedCustomer} />
        )}
      </div>
    </div>
  );
}
