import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertCustomerUserSchema, type CustomerUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserSettingsProps {
    user: CustomerUser;
}

export default function UserSettings({ user }: UserSettingsProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(insertCustomerUserSchema.partial()),
        defaultValues: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest(
                "PUT",
                `/api/customers/${user.customer_id}/users/${user.id}`,
                data
            );
            return res.json();
        },
        onSuccess: () => {
            // Invalidate both the specific user query and the list query
            queryClient.invalidateQueries({ queryKey: ["/api/customers", user.customer_id, "users"] });
            toast({
                title: "Profile updated",
                description: "Your profile settings have been updated successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(data: any) {
        updateMutation.mutate(data);
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">
                    Manage your personal information and account security.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update your name and contact details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
