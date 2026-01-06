'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';

interface WebSocketMessage {
    type: 'SOS_ALERT' | 'PATROL_UPDATE' | 'INCIDENT' | 'NOTIFICATION';
    data: any;
    timestamp: string;
}

interface UseWebSocketOptions {
    onSOSAlert?: (data: any) => void;
    onPatrolUpdate?: (data: any) => void;
    onIncident?: (data: any) => void;
    onNotification?: (data: any) => void;
    autoReconnect?: boolean;
    reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { token } = useAuthStore();
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const {
        onSOSAlert,
        onPatrolUpdate,
        onIncident,
        onNotification,
        autoReconnect = true,
        reconnectInterval = 5000,
    } = options;

    const connect = useCallback(() => {
        if (!token) return;

        // Use environment variable or construct WebSocket URL
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
            `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

        try {
            wsRef.current = new WebSocket(`${wsUrl}?token=${token}`);

            wsRef.current.onopen = () => {
                console.log('🔌 WebSocket connected');
                setIsConnected(true);
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(message);

                    // Route to appropriate handler
                    switch (message.type) {
                        case 'SOS_ALERT':
                            onSOSAlert?.(message.data);
                            // Play alert sound
                            playAlertSound();
                            // Show browser notification
                            showBrowserNotification('🚨 SOS Alert!', message.data.message || 'New emergency alert');
                            break;
                        case 'PATROL_UPDATE':
                            onPatrolUpdate?.(message.data);
                            break;
                        case 'INCIDENT':
                            onIncident?.(message.data);
                            break;
                        case 'NOTIFICATION':
                            onNotification?.(message.data);
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);

                // Auto reconnect
                if (autoReconnect) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('🔄 Attempting to reconnect...');
                        connect();
                    }, reconnectInterval);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [token, onSOSAlert, onPatrolUpdate, onIncident, onNotification, autoReconnect, reconnectInterval]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const send = useCallback((type: string, data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        send,
        connect,
        disconnect,
    };
}

// Helper functions
function playAlertSound() {
    try {
        // Use Web Audio API for alert sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, 500);
    } catch (error) {
        console.log('Could not play alert sound:', error);
    }
}

function showBrowserNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'sos-alert',
            requireInteraction: true,
        });
    }
}

// Request notification permission
export function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            console.log('Notification permission:', permission);
        });
    }
}
