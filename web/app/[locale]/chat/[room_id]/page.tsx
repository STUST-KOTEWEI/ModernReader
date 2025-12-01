"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Message {
    user: string;
    text: string;
}

import { useGamification } from '@/hooks/useGamification';

function ChatRoomPage() {
    const { room_id } = useParams();
    const { data: session, status } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const websocketRef = useRef<WebSocket | null>(null);
    const { logActivity } = useGamification(); // Use the hook

    useEffect(() => {
        if (status !== 'authenticated' || !room_id || !session?.accessToken) {
            return;
        }

        const isSecure = window.location.protocol === 'https:';
        const wsProtocol = isSecure ? 'wss://' : 'ws://';
        const wsUrl = `${wsProtocol}${window.location.host}/api/v1/ws/chat/${room_id}?token=${session.accessToken}`;
        
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const messageData = JSON.parse(event.data);
                setMessages((prev) => [...prev, messageData]);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            console.log('WebSocket disconnected:', event.reason);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, [room_id, status, session]);

    const handleSendMessage = () => {
        if (input.trim() && websocketRef.current && isConnected) {
            websocketRef.current.send(input);
            logActivity('CHAT_MESSAGE_SENT'); // Log activity
            setInput('');
        }
    };

    if (status === 'loading') {
        return <div className="p-8 text-center">Loading session...</div>;
    }
    
    if (status !== 'authenticated') {
        return <div className="p-8 text-center">Please log in to join the chat.</div>;
    }

    return (
        <div className="flex flex-col h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">Chat Room: {room_id}</h1>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-lg">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <span className="font-bold">{msg.user}: </span>
                        <span>{msg.text}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 p-3 border rounded-lg"
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                    disabled={!isConnected}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !input.trim()}
                    className="bg-blue-600 text-white p-3 rounded-lg disabled:bg-gray-400"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}

export default ChatRoomPage;
