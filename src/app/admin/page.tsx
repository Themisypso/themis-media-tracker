import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Users, Shield, Quote, Layers, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-purple/15 border border-accent-purple/30">
                    <Shield size={20} className="text-accent-purple" />
                </div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-text-primary">Admin Dashboard</h1>
                    <p className="text-sm text-text-secondary">Logged in as <span className="text-accent-cyan">{session?.user?.email}</span> · role: <span className="text-accent-purple font-medium">{session?.user?.role}</span></p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/users" className="glass-card p-6 rounded-2xl border border-border hover:border-accent-purple/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-purple/10 border border-accent-purple/20 group-hover:bg-accent-purple/20 transition-colors">
                            <Users size={18} className="text-accent-purple" />
                        </div>
                    </div>
                    <h3 className="font-display font-semibold text-text-primary mb-1">Manage Users</h3>
                    <p className="text-sm text-text-secondary">View, edit roles, reset passwords or delete users.</p>
                </Link>

                <Link href="/admin/quotes" className="glass-card p-6 rounded-2xl border border-border hover:border-[#facc15]/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#facc15]/10 border border-[#facc15]/20 group-hover:bg-[#facc15]/20 transition-colors">
                            <Quote size={18} className="text-[#facc15]" />
                        </div>
                    </div>
                    <h3 className="font-display font-semibold text-text-primary mb-1">Manage Quotes</h3>
                    <p className="text-sm text-text-secondary">Delete quotes or feature them on the homepage.</p>
                </Link>

                <Link href="/admin/lists" className="glass-card p-6 rounded-2xl border border-border hover:border-accent-cyan/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20 group-hover:bg-accent-cyan/20 transition-colors">
                            <Layers size={18} className="text-accent-cyan" />
                        </div>
                    </div>
                    <h3 className="font-display font-semibold text-text-primary mb-1">Manage Lists</h3>
                    <p className="text-sm text-text-secondary">Delete lists or feature them on the homepage.</p>
                </Link>

                <Link href="/admin/footer" className="glass-card p-6 rounded-2xl border border-border hover:border-emerald-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                            <Settings size={18} className="text-emerald-500" />
                        </div>
                    </div>
                    <h3 className="font-display font-semibold text-text-primary mb-1">Manage Footer</h3>
                    <p className="text-sm text-text-secondary">Edit the global footer links dynamically.</p>
                </Link>
            </div>
        </div>
    );
}
