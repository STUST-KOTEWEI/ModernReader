"use client";

import { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { PERSONAS, type PersonaType, type CustomPersona, createCustomPersona } from '@/lib/personas';

interface PersonaManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPersona: (personaType: PersonaType, customPersona?: CustomPersona) => void;
    currentPersona: PersonaType;
}

export default function PersonaManager({ isOpen, onClose, onSelectPersona, currentPersona }: PersonaManagerProps) {
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [customEmoji, setCustomEmoji] = useState('🤖');
    const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([]);

    if (!isOpen) return null;

    const handleCreateCustom = () => {
        if (!customName || !customPrompt) return;

        const newPersona = createCustomPersona(customName, customPrompt, customEmoji);
        setCustomPersonas([...customPersonas, newPersona]);

        // Reset form
        setCustomName('');
        setCustomPrompt('');
        setCustomEmoji('🤖');
        setShowCustomForm(false);
    };

    const categories = [
        { id: 'wisdom', name: 'Wisdom', icon: '🧙‍♂️' },
        { id: 'education', name: 'Education', icon: '📚' },
        { id: 'creative', name: 'Creative', icon: '🎨' },
        { id: 'analytical', name: 'Analytical', icon: '🔬' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#e5e0d8] flex items-center justify-between">
                    <div>
                        <h2 className="font-serif font-bold text-2xl text-[#1a1a1a] flex items-center gap-2">
                            <Sparkles size={24} /> AI Personas
                        </h2>
                        <p className="text-sm text-[#666] mt-1">Choose or create your AI conversation partner</p>
                    </div>
                    <button onClick={onClose} className="text-[#666] hover:text-[#1a1a1a]">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Built-in Personas by Category */}
                    {categories.map(category => {
                        const personas = Object.values(PERSONAS).filter(p => p.category === category.id);
                        return (
                            <div key={category.id} className="mb-8">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span>{category.icon}</span> {category.name}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {personas.map(persona => (
                                        <button
                                            key={persona.id}
                                            onClick={() => {
                                                onSelectPersona(persona.id);
                                                onClose();
                                            }}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${currentPersona === persona.id
                                                    ? 'border-[#1a1a1a] bg-[#fdfbf7]'
                                                    : 'border-[#e5e0d8] hover:border-[#1a1a1a]'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-3xl">{persona.emoji}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold text-[#1a1a1a]">{persona.name}</div>
                                                    <div className="text-xs text-[#666] mt-1">{persona.description}</div>
                                                    <div className="text-xs text-[#999] mt-2 italic">{persona.tone}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Custom Personas */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span>⚙️</span> Custom Personas
                            </h3>
                            <button
                                onClick={() => setShowCustomForm(!showCustomForm)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black transition-colors text-sm"
                            >
                                <Plus size={16} /> Create Custom
                            </button>
                        </div>

                        {/* Custom Persona Form */}
                        {showCustomForm && (
                            <div className="bg-[#fdfbf7] p-6 rounded-xl border border-[#e5e0d8] mb-4">
                                <h4 className="font-bold mb-4">Create Your AI Assistant</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#666] mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="e.g., Business Coach, Study Buddy"
                                            className="w-full px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#666] mb-2">Emoji</label>
                                        <input
                                            type="text"
                                            value={customEmoji}
                                            onChange={(e) => setCustomEmoji(e.target.value)}
                                            placeholder="🤖"
                                            maxLength={2}
                                            className="w-20 px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0 text-center text-2xl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#666] mb-2">System Prompt</label>
                                        <textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="You are a helpful business coach. Provide actionable advice for entrepreneurs..."
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0 resize-none"
                                        />
                                        <p className="text-xs text-[#999] mt-1">
                                            Tip: Start with "You are..." and describe the AI's role, tone, and expertise
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateCustom}
                                            disabled={!customName || !customPrompt}
                                            className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Create Persona
                                        </button>
                                        <button
                                            onClick={() => setShowCustomForm(false)}
                                            className="px-4 py-2 border border-[#e5e0d8] rounded-lg hover:bg-[#fdfbf7] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Personas List */}
                        {customPersonas.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customPersonas.map(persona => (
                                    <button
                                        key={persona.id}
                                        onClick={() => {
                                            onSelectPersona('Custom', persona);
                                            onClose();
                                        }}
                                        className="p-4 rounded-xl border-2 border-[#e5e0d8] hover:border-[#1a1a1a] text-left transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-3xl">{persona.emoji}</span>
                                            <div className="flex-1">
                                                <div className="font-bold text-[#1a1a1a]">{persona.name}</div>
                                                <div className="text-xs text-[#666] mt-1 line-clamp-2">{persona.systemPrompt}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {customPersonas.length === 0 && !showCustomForm && (
                            <div className="text-center py-8 text-[#999]">
                                <p className="text-sm">No custom personas yet. Create one to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
