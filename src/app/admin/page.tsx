import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Users, LayoutDashboard } from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Admin Dashboard
                </h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/users" className="block">
                    <div className="rounded-xl border bg-white text-card-foreground shadow hover:shadow-md transition-shadow">
                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Manage Users</h3>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="p-6 pt-0">
                            <p className="text-xs text-muted-foreground">
                                View, edit roles, or delete users.
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
