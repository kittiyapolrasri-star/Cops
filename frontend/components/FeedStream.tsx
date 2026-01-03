'use client';

import { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Camera, Clock } from 'lucide-react';

interface FeedItem {
    id: string;
    type: 'checkin' | 'incident' | 'patrol_start' | 'patrol_end';
    user: { rank: string; firstName: string; lastName: string };
    timestamp: Date;
    data?: any;
}

// Demo feed data
const demoFeed: FeedItem[] = [
    {
        id: '1',
        type: 'checkin',
        user: { rank: 'ด.ต.', firstName: 'สมศักดิ์', lastName: 'ยุทธการ' },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        data: { location: 'ซอยเปลี่ยว ม.3' },
    },
    {
        id: '2',
        type: 'incident',
        user: { rank: 'ส.ต.อ.', firstName: 'สมหญิง', lastName: 'ปฏิบัติการ' },
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        data: { type: 'PREVENTION', description: 'ตรวจพบกลุ่มวัยรุ่นมั่วสุม ได้ไล่ให้กลับบ้านแล้ว' },
    },
    {
        id: '3',
        type: 'patrol_start',
        user: { rank: 'จ.ส.ต.', firstName: 'สมชาย', lastName: 'รักษ์ดี' },
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
        id: '4',
        type: 'checkin',
        user: { rank: 'ส.ต.อ.', firstName: 'สมหญิง', lastName: 'ปฏิบัติการ' },
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        data: { location: 'ตลาดสดหนองแค' },
    },
    {
        id: '5',
        type: 'incident',
        user: { rank: 'ด.ต.', firstName: 'สมศักดิ์', lastName: 'ยุทธการ' },
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        data: { type: 'SUPPRESSION', description: 'ตรวจยึดยาบ้า 5 เม็ด จากผู้ต้องหา 1 ราย' },
    },
];

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'เมื่อสักครู่';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
}

function FeedItemCard({ item }: { item: FeedItem }) {
    const getIcon = () => {
        switch (item.type) {
            case 'checkin':
                return <MapPin className="w-5 h-5 text-blue-500" />;
            case 'incident':
                return item.data?.type === 'SUPPRESSION'
                    ? <AlertTriangle className="w-5 h-5 text-red-500" />
                    : <Camera className="w-5 h-5 text-yellow-500" />;
            case 'patrol_start':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'patrol_end':
                return <Clock className="w-5 h-5 text-gray-500" />;
            default:
                return null;
        }
    };

    const getMessage = () => {
        switch (item.type) {
            case 'checkin':
                return `เช็คอินที่ ${item.data?.location || 'ไม่ระบุ'}`;
            case 'incident':
                return item.data?.description || 'รายงานเหตุการณ์';
            case 'patrol_start':
                return 'เริ่มออกลาดตระเวน';
            case 'patrol_end':
                return 'สิ้นสุดการลาดตระเวน';
            default:
                return '';
        }
    };

    const getBgColor = () => {
        switch (item.type) {
            case 'incident':
                return item.data?.type === 'SUPPRESSION'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default:
                return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <div className={`p-4 border-b ${getBgColor()} transition hover:bg-gray-50 dark:hover:bg-gray-750`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {getIcon()}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.user.rank} {item.user.firstName} {item.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        {getMessage()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(item.timestamp)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function FeedStream() {
    const [feed, setFeed] = useState<FeedItem[]>(demoFeed);

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {feed.map((item) => (
                <FeedItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}
