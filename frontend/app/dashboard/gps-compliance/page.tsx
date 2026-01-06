'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    MapPin,
    AlertTriangle,
    ShieldCheck,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Navigation as NavigationIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

// Import map dynamically
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), {
    ssr: false,
    loading: () => <div className="h-[500px] bg-slate-100 flex items-center justify-center">Loading Map...</div>,
});

import { gpsComplianceApi } from '@/lib/api';

export default function GpsCompliancePage() {
    const [violations, setViolations] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [zones, setZones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [violationsData, statsData, zonesData] = await Promise.all([
                gpsComplianceApi.getViolations({ isAcknowledged: false }),
                gpsComplianceApi.getStats(),
                gpsComplianceApi.getDutyZones()
            ]);
            setViolations(violationsData.data || []);
            setStats(statsData.data);
            setZones(zonesData.data || []);
        } catch (error) {
            console.error('Failed to fetch GPS compliance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            await gpsComplianceApi.acknowledgeViolation(id);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to acknowledge violation:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACKNOWLEDGED':
                return <Badge variant="default" className="bg-green-600">Acknowledged</Badge>;
            case 'PENDING':
                return <Badge variant="destructive">Pending</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">GPS Compliance</h1>
                    <p className="text-muted-foreground">Monitor patrol discipline and duty zone adherence</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export Report</Button>
                    <Button>Configure Zones</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.complianceRate || '100'}%</div>
                        <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.activeViolations || 0}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Duty Zones</CardTitle>
                        <MapPin className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeZones || 0}</div>
                        <p className="text-xs text-muted-foreground">Zones monitored</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="map" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="map">Live Map</TabsTrigger>
                    <TabsTrigger value="violations">Violations List</TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="space-y-4">
                    <Card className="h-[600px] overflow-hidden border-0 shadow-lg">
                        <DashboardMap />
                        <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg shadow-md max-w-sm backdrop-blur-sm">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                Recent Alerts
                            </h3>
                            <div className="space-y-3">
                                {violations.slice(0, 3).map((v) => (
                                    <div key={v.id} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium">{v.type.replace('_', ' ')}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-muted-foreground text-xs mt-1">
                                            {v.user.rank} {v.user.firstName} {v.user.lastName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="violations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Violations</CardTitle>
                            <CardDescription>History of rule violations and system alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {violations.map((violation) => (
                                    <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${violation.type === 'OUT_OF_ZONE' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {violation.type === 'OUT_OF_ZONE' ? <MapPin className="h-5 w-5" /> : <NavigationIcon className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{violation.type.replace('_', ' ')}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <User className="h-3 w-3" />
                                                    {violation.user.rank} {violation.user.firstName} {violation.user.lastName}
                                                    <span className="mx-1">•</span>
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(violation.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(violation.status)}
                                            {violation.status === 'PENDING' && (
                                                <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(violation.id)}>
                                                    Acknowledge
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
