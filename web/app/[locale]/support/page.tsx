"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone, Building2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState<"customer" | "vendor">("customer");

    return (
        <div className="p-8 lg:p-16 max-w-6xl mx-auto min-h-screen">
            <header className="mb-16 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-serif font-bold text-5xl text-[#1a1a1a] mb-4"
                >
                    How can we help?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-[#666]"
                >
                    Connect with our support team or explore partnership opportunities.
                </motion.p>
            </header>

            <div className="flex justify-center mb-12">
                <div className="bg-white p-1 rounded-xl border border-[#e5e0d8] inline-flex">
                    <TabButton
                        active={activeTab === "customer"}
                        onClick={() => setActiveTab("customer")}
                        label="Customer Support"
                        icon={<MessageSquare size={18} />}
                    />
                    <TabButton
                        active={activeTab === "vendor"}
                        onClick={() => setActiveTab("vendor")}
                        label="Vendor & Partners"
                        icon={<Building2 size={18} />}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-3xl border border-[#e5e0d8] shadow-sm"
                >
                    <h2 className="font-serif font-bold text-2xl mb-6">
                        {activeTab === "customer" ? "Send us a message" : "Partner with ModernReader"}
                    </h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <InputGroup label="First Name" placeholder="Jane" />
                            <InputGroup label="Last Name" placeholder="Doe" />
                        </div>
                        <InputGroup label="Email Address" placeholder="jane@example.com" type="email" />
                        {activeTab === "vendor" && (
                            <InputGroup label="Company / Organization" placeholder="Acme Publishing" />
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider">Message</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl bg-[#fdfbf7] border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0 transition-all min-h-[150px] resize-none"
                                placeholder={activeTab === "customer" ? "Describe your issue..." : "Tell us about your content or technology..."}
                            />
                        </div>
                        <button className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Send size={20} />
                            Send Message
                        </button>
                    </form>
                </motion.div>

                {/* Info & FAQ */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="bg-[#1a1a1a] text-[#fdfbf7] p-8 rounded-3xl">
                        <h3 className="font-serif font-bold text-xl mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <ContactItem icon={<Mail />} text="support@modernreader.com" />
                            <ContactItem icon={<Phone />} text="+886 (02) 2345-6789" />
                            <ContactItem icon={<Building2 />} text="No. 1, University Rd, Tainan City, Taiwan" />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-[#e5e0d8]">
                        <h3 className="font-serif font-bold text-xl mb-4">
                            {activeTab === "customer" ? "Common Questions" : "Partnership Benefits"}
                        </h3>
                        <ul className="space-y-4">
                            {activeTab === "customer" ? (
                                <>
                                    <FAQItem q="How do I reset my biometric ID?" />
                                    <FAQItem q="Can I download podcasts for offline use?" />
                                    <FAQItem q="Is the haptic feedback safe for children?" />
                                </>
                            ) : (
                                <>
                                    <FAQItem q="DRM Integration API Documentation" />
                                    <FAQItem q="Content Revenue Sharing Model" />
                                    <FAQItem q="Hardware Certification Program" />
                                </>
                            )}
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${active ? "bg-[#1a1a1a] text-white shadow-md" : "text-[#666] hover:bg-[#f0ebe4]"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function InputGroup({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl bg-[#fdfbf7] border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0 transition-all"
            />
        </div>
    );
}

function ContactItem({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            {icon}
            <span>{text}</span>
        </div>
    );
}

function FAQItem({ q }: { q: string }) {
    return (
        <li className="flex items-center gap-3 text-[#666] hover:text-[#1a1a1a] cursor-pointer transition-colors group">
            <div className="w-6 h-6 rounded-full bg-[#f0ebe4] flex items-center justify-center text-[#1a1a1a] group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors">?</div>
            {q}
        </li>
    );
}
