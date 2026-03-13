"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import { Pencil, Trash2, Loader2, Users, X } from "lucide-react";
import toast from "react-hot-toast";

type AdminUser = User & {
    _count: { mediaItems: number };
    steamId: string | null;
};

const ROLE_COLORS: Record<string, string> = {
    SUPERADMIN: 'bg-accent-pink/15 text-accent-pink border border-accent-pink/30',
    ADMIN: 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30',
    MODERATOR: 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30',
    USER: 'bg-bg-secondary text-text-secondary border border-border',
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editNewPassword, setEditNewPassword] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users");
            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();
            setUsers(data);
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete user");
            toast.success("User deleted successfully");
            fetchUsers();
        } catch {
            toast.error("Failed to delete user");
        }
    };

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditUsername((user as any).username || '');
        setEditNewPassword('');
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: editingUser.role,
                    name: editName,
                    username: editUsername || undefined,
                    newPassword: editNewPassword || undefined,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update user');
            }
            toast.success("User updated successfully");
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || "Failed to update user");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-accent-cyan" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Users size={22} className="text-accent-purple" />
                <h1 className="text-2xl font-display font-bold text-text-primary">Manage Users</h1>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-bg-secondary border border-border text-text-muted">{users.length} total</span>
            </div>

            <div className="glass-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase tracking-wider border-b border-border bg-bg-secondary/50">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Connections</th>
                                <th className="px-6 py-3">Library</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {(user.name || user.email)?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text-primary">{user.name || "—"}</p>
                                                <p className="text-xs text-text-muted">@{(user as any).username || "no username"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.steamId ? (
                                            <div className="flex items-center gap-1.5 text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded-md text-xs font-medium w-fit border border-accent-cyan/20">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png"
                                                    alt="Steam" className="w-3 h-3 object-contain filter invert brightness-0" />
                                                <span>{user.steamId}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={`/admin/media?userId=${user.id}`} className="hover:text-accent-cyan hover:underline decoration-accent-cyan/50 underline-offset-4 flex items-center gap-1.5 transition-colors">
                                            <span className="font-semibold text-text-primary">{user._count?.mediaItems ?? 0}</span>
                                            <span className="text-text-muted">items</span>
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-xs">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-1">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                                            title="Edit User"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-accent-pink hover:bg-accent-pink/10 transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-border shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-display font-bold text-text-primary">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Email (read-only)</label>
                                <input type="text" disabled value={editingUser.email} className="input-cyber w-full opacity-50 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="input-cyber w-full"
                                    placeholder="Display name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Username</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-lg bg-bg-secondary text-text-muted text-sm">@</span>
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="input-cyber flex-1 rounded-l-none"
                                        placeholder="username"
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">
                                    New Password <span className="text-text-muted normal-case font-normal">(leave empty to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    value={editNewPassword}
                                    onChange={e => setEditNewPassword(e.target.value)}
                                    className="input-cyber w-full"
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    className="input-cyber w-full"
                                >
                                    <option value="USER">USER</option>
                                    <option value="MODERATOR">MODERATOR</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SUPERADMIN">SUPERADMIN</option>
                                </select>
                            </div>

                            {editingUser.steamId && (
                                <div className="p-3 mt-4 rounded-xl border border-red-500/20 bg-red-500/5">
                                    <label className="block text-xs font-medium text-red-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                        <Trash2 size={14} /> Remove Integrations
                                    </label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm('Unlink Steam account for this user?')) return;
                                            try {
                                                const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ steamId: null })
                                                })
                                                if (!res.ok) throw new Error()
                                                toast.success('Steam unlinked')
                                                fetchUsers()
                                                setEditingUser({ ...editingUser, steamId: null })
                                            } catch {
                                                toast.error('Failed to unlink steam')
                                            }
                                        }}
                                        className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold transition-colors border border-red-500/20"
                                    >
                                        Unlink Steam ID: {editingUser.steamId}
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="btn-cyber text-sm px-4 py-2">Cancel</button>
                                <button type="submit" className="btn-primary text-sm px-4 py-2">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
