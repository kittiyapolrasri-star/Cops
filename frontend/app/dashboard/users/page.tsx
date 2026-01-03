'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { userApi, organizationApi } from '@/lib/api';
import {
    User,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Edit,
    Shield,
    BadgeCheck,
    Loader,
    X,
    Save
} from 'lucide-react';
import Image from 'next/image';

interface UserData {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    rank: string;
    position?: string;
    role: string;
    station?: { name: string };
    isActive: boolean;
    avatar?: string;
}

export default function UsersPage() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial load
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await userApi.getAll();
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await userApi.delete(id);
            fetchUsers(); // Refresh list
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 text-white">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage personnel access and roles</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition shadow-lg shadow-emerald-900/20"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New User</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800/50 text-gray-400 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">Officer</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Station</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading personnel data...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No users found matches your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-800/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                                    {u.avatar ? (
                                                        <Image src={u.avatar} alt={u.username} width={40} height={40} className="object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{u.rank} {u.firstName} {u.lastName}</p>
                                                    <p className="text-xs text-gray-500">@{u.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'HQ' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                    u.role === 'COMMANDER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                {u.role === 'HQ' && <Shield className="w-3 h-3" />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {u.station?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            <span className="text-gray-400">{u.isActive ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="p-2 hover:bg-rose-900/30 rounded-lg text-gray-400 hover:text-rose-400 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        rank: '',
        role: 'PATROL',
        stationId: '' // In real app, fetch stations dynamically
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userApi.create(formData);
            alert('User created successfully!');
            onSuccess();
        } catch (err) {
            alert('Failed to create user. Check if username exists.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Add New Personnel</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                            <input
                                required
                                className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">Rank</label>
                            <input
                                required
                                placeholder="ex. Pol.Lt."
                                className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                value={formData.rank}
                                onChange={e => setFormData({ ...formData, rank: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                            <input
                                required
                                className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                        <input
                            required
                            className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                        <select
                            className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="PATROL">PATROL (สายตรวจ)</option>
                            <option value="STATION">STATION (สถานี)</option>
                            <option value="HQ">HQ (ส่วนกลาง)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
