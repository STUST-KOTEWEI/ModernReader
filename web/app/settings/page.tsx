"use client";

import { useState } from "react";
import { Type, Volume2, Shield, Smartphone, LogOut } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-8 lg:p-12 max-w-4xl mx-auto">
            <header className="mb-12">
                <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Settings</h1>
                <p className="text-[#666]">Manage your preferences and device configuration.</p>
            </header>

            <div className="space-y-8">
                {/* Reading Preferences */}
                <Section title="Reading Experience" icon={<Type size={20} />}>
                    <ToggleRow label="Dark Mode" description="Switch to dark E-Ink theme" />
                    <ToggleRow label="Haptic Feedback" description="Enable tactile sensations" defaultChecked />
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <div className="font-medium text-[#1a1a1a]">Font Size</div>
                            <div className="text-sm text-[#666]">Adjust text size for reading</div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f0ebe4] p-1 rounded-lg">
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white transition-colors text-sm">A</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-lg font-bold">A</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white transition-colors text-xl font-bold">A</button>
                        </div>
                    </div>
                </Section>

                {/* Audio & AI */}
                <Section title="Audio & AI" icon={<Volume2 size={20} />}>
                    <ToggleRow label="Auto-Generate Podcasts" description="Create summaries for new books" />
                    <ToggleRow label="Voice Commands" description="Enable 'Hey Elder' wake word" defaultChecked />
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <div className="font-medium text-[#1a1a1a]">AI Persona Voice</div>
                            <div className="text-sm text-[#666]">Default voice for the assistant</div>
                        </div>
                        <select className="bg-[#fdfbf7] border border-[#e5e0d8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]">
                            <option>Elder (Male)</option>
                            <option>Elder (Female)</option>
                            <option>Modern (Neutral)</option>
                        </select>
                    </div>
                </Section>

                {/* Account */}
                <Section title="Account & Security" icon={<Shield size={20} />}>
                    <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-[#fdfbf7] -mx-4 px-4 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#e5e0d8] rounded-full flex items-center justify-center text-[#666]">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-[#1a1a1a]">Device Management</div>
                                <div className="text-sm text-[#666]">Manage authorized devices (2/3)</div>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-[#1a1a1a]">Manage</div>
                    </div>
                    <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-[#fdfbf7] -mx-4 px-4 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                <LogOut size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-red-600">Sign Out</div>
                                <div className="text-sm text-red-400">Log out of all devices</div>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm">
            <h2 className="font-serif font-bold text-lg mb-6 flex items-center gap-2 pb-4 border-b border-[#e5e0d8]">
                {icon} {title}
            </h2>
            <div className="divide-y divide-[#f0ebe4]">
                {children}
            </div>
        </section>
    );
}

function ToggleRow({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked);

    return (
        <div className="flex items-center justify-between py-4">
            <div>
                <div className="font-medium text-[#1a1a1a]">{label}</div>
                <div className="text-sm text-[#666]">{description}</div>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? "bg-[#1a1a1a]" : "bg-[#e5e0d8]"}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
            </button>
        </div>
    );
}
