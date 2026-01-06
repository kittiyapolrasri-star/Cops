'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LayoutDashboard,
    Building2,
    MapPin,
    Shield,
    Search,
    Plus,
    MoreVertical,
    Users,
    Navigation,
    Home
} from 'lucide-react';
import { organizationApi } from '@/lib/api';

export default function OrganizationPage() {
    const [bureaus, setBureaus] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bureausData, statsData] = await Promise.all([
                organizationApi.getHierarchy(),
                organizationApi.getStats()
            ]);
            setBureaus(bureausData.data);
            setStats(statsData.data);
        } catch (error) {
            console.error('Failed to fetch organization data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterHierarchy = (items: any[]): any[] => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.provinces && filterHierarchy(item.provinces).length > 0)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
                    <p className="text-muted-foreground">Manage police organization hierarchy and stations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>Refresh</Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Unit
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bureaus</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.bureaus || 0}</div>
                        <p className="text-xs text-muted-foreground">Command centers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Provinces</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.provinces || 0}</div>
                        <p className="text-xs text-muted-foreground">Covered areas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.stations || 0}</div>
                        <p className="text-xs text-muted-foreground">Police stations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.users || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered personnel</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="hierarchy" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-2">
                    <Search className="text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search units..."
                        className="max-w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <TabsContent value="hierarchy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Structure</CardTitle>
                            <CardDescription>Hierarchical view of all units</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {bureaus.map((bureau) => (
                                    <div key={bureau.id} className="border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-5 w-5 text-blue-600" />
                                            <h3 className="font-semibold text-lg">{bureau.name} ({bureau.code})</h3>
                                        </div>

                                        <div className="ml-6 space-y-3 mt-3">
                                            {bureau.provinces?.map((province: any) => (
                                                <div key={province.id} className="border-l-2 border-slate-200 pl-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-4 w-4 text-green-600" />
                                                        <h4 className="font-medium">{province.name} ({province.code})</h4>
                                                    </div>

                                                    <div className="ml-4 grid gap-2">
                                                        {province.stations?.map((station: any) => (
                                                            <div key={station.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700">
                                                                <div className="flex items-center gap-2">
                                                                    <Home className="h-4 w-4 text-orange-500" />
                                                                    <span className="text-sm text-white">{station.name} ({station.code})</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {station.users?.length || 0} Officers
                                                                    </div>
                                                                    {station.latitude && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Navigation className="h-3 w-3" />
                                                                            Map Linked
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!province.stations || province.stations.length === 0) && (
                                                            <div className="text-sm text-muted-foreground italic ml-2">No stations</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!bureau.provinces || bureau.provinces.length === 0) && (
                                                <div className="text-sm text-muted-foreground italic ml-6">No provinces</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                List view implementation coming soon...
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
