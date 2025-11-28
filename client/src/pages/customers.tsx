import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { CreateCustomerModal } from "@/components/create-customer-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Users, Trash2 } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch customers with pagination & search
  const { data: customersData, isLoading: customersLoading } = useQuery<{
    customers: Customer[];
    total: number;
  }>({
    queryKey: ["customers", { search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
      });
      const res = await apiRequest("GET", `/api/customers?${params.toString()}`);
      return await res.json();
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const customers = customersData?.customers || [];
  const total = customersData?.total || 0;

  const handleDelete = (customer: Customer) => {
    if (
      confirm(
        `Are you sure you want to delete ${customer.name}? This will also delete all associated users.`
      )
    ) {
      deleteMutation.mutate(customer.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const columns = [
    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {getInitials(customer.name)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-secondary-900">
                {customer.name}
              </div>
              <div className="text-sm text-secondary-500">
                {customer.domain}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "admin_name",
      header: "Admin Contact",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original;
        return (
          <div>
            <div className="text-sm text-secondary-900">{customer.admin_name}</div>
            <div className="text-sm text-secondary-500">{customer.admin_email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original;
        return <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original;
        return customer.created_at
          ? new Date(customer.created_at).toLocaleDateString()
          : "N/A";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Customer } }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Eye size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Users size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(customer)}
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
          title="Customer Management"
          breadcrumb="Customers"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2" size={16} />
              Add Customer
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto bg-secondary-50 p-6">
          <div className="bg-white rounded-xl shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Customer Organizations
                </h3>
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
                      size={16}
                    />
                    <Input
                      placeholder="Search customers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  {/* Filter */}
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DataTable columns={columns} data={customers} loading={customersLoading} />
            {/* Pagination */}
            <div className="bg-white px-6 py-3 border-t border-secondary-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary-700">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 10, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> customers
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-secondary-700">Page {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * 10 >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <CreateCustomerModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      </div>
    </div>
  );
}
