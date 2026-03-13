"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Trash2, Loader2, Database, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

type MediaItem = {
    id: string;
    mediaId: string;
    type: string;
    title: string;
    status: string;
    user: { name: string; email: string };
};

export default function AdminMediaPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-accent-cyan" />
            </div>
        }>
            <AdminMediaContent />
        </Suspense>
    )
}

function AdminMediaContent() {
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');

    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMedia = useCallback(async () => {
        try {
            const url = targetUserId ? `/api/admin/media?userId=${targetUserId}` : `/api/admin/media`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch media");
            const data = await response.json();
            setMedia(data);
        } catch {
            toast.error("Failed to load media items");
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this media item? This will remove it from the user's library.")) return;
        try {
            const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete media");
            toast.success("Media item deleted successfully");
            fetchMedia();
        } catch {
            toast.error("Failed to delete media");
        }
    };

    const filteredMedia = media.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-accent-cyan" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Database size={22} className="text-accent-pink" />
                    <h1 className="text-2xl font-display font-bold text-text-primary">
                        {targetUserId ? 'User Media Library' : 'All Tracked Media'}
                    </h1>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-bg-secondary border border-border text-text-muted">
                        {filteredMedia.length} items
                    </span>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search media, user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-xl text-sm focus:border-accent-cyan outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="glass-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase tracking-wider border-b border-border bg-bg-secondary/50">
                            <tr>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Owner</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredMedia.map((item) => (
                                <tr key={item.id} className="hover:bg-bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-text-primary max-w-[250px] truncate" title={item.title}>
                                        {item.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-bg-secondary text-xs uppercase font-semibold text-text-secondary tracking-wider">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-text-primary text-xs">{item.user.name || 'Unknown'}</span>
                                            <span className="text-text-muted text-[10px]">{item.user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg text-text-secondary hover:text-accent-pink hover:bg-accent-pink/10 transition-colors"
                                            title="Delete Media from Database"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredMedia.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">No media items found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
