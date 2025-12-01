import { Share2 } from "lucide-react";
import { PersonaType, PERSONAS } from "@/lib/personas";

interface Message {
    role: string;
    content: string;
}

interface AIChatPanelProps {
    messages: Message[];
    inputValue: string;
    setInputValue: (val: string) => void;
    isTyping: boolean;
    onSendMessage: (e: React.FormEvent) => void;
    selectedPersona: PersonaType;
    setSelectedPersona: (val: PersonaType) => void;
}

export default function AIChatPanel({
    messages,
    inputValue,
    setInputValue,
    isTyping,
    onSendMessage,
    selectedPersona,
    setSelectedPersona
}: AIChatPanelProps) {
    return (
        <div className="flex-1 p-6 flex flex-col min-h-0">
            {/* Persona Selector */}
            <div className="mb-4">
                <label className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2 block">AI Persona</label>
                <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value as PersonaType)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                >
                    {PERSONAS.map((persona) => (
                        <option key={persona.id} value={persona.id}>
                            {persona.name}
                        </option>
                    ))}
                </select>
            </div>

            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-[#e5e0d8]'}`} />
                Discussion
            </h2>

            <div className="flex-1 bg-white rounded-xl border border-[#e5e0d8] p-4 mb-4 overflow-y-auto text-sm space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'ai' ? 'bg-[#1a1a1a] text-white' : 'bg-[#e5e0d8] text-[#666]'}`}>
                            {msg.role === 'ai' ? 'AI' : 'ME'}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'ai' ? 'bg-[#fdfbf7] border border-[#e5e0d8] text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold">AI</div>
                        <div className="bg-[#fdfbf7] border border-[#e5e0d8] p-3 rounded-2xl flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={onSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask the Wisdom Keeper about this story..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm focus:outline-none focus:border-[#1a1a1a]"
                    aria-label="Chat message"
                />
                <button type="submit" className="p-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black transition-colors" aria-label="Send message">
                    <Share2 size={18} />
                </button>
            </form>
        </div>
    );
}
