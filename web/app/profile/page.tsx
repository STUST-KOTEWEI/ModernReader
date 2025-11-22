import { Smartphone, Tablet, Monitor, ShieldCheck, Fingerprint } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="p-8 lg:p-12 max-w-5xl mx-auto">
            <header className="mb-12 text-center">
                <div className="w-24 h-24 bg-[#1a1a1a] rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white font-serif font-bold">
                    K
                </div>
                <h1 className="font-serif font-bold text-3xl text-[#1a1a1a]">Kedewei</h1>
                <p className="text-[#666]">Premium Member • Since 2025</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <StatCard label="Books Read" value="12" />
                <StatCard label="Hours Listened" value="48.5" />
                <StatCard label="Words Learned" value="1,240" />
            </div>

            <div className="space-y-8">
                {/* Security Section */}
                <section className="bg-white p-8 rounded-2xl border border-[#e5e0d8] shadow-sm">
                    <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-green-600" /> Security & DRM
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[#fdfbf7] rounded-xl border border-[#e5e0d8]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg border border-[#e5e0d8]">
                                    <Fingerprint size={24} className="text-[#1a1a1a]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1a1a1a]">Biometric Auth (Layer 2)</h3>
                                    <p className="text-sm text-[#666]">FaceID & TouchID enabled</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</div>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#1a1a1a] mb-4 text-sm uppercase tracking-wider">Authorized Devices (2/3)</h3>
                            <div className="space-y-3">
                                <DeviceRow icon={<Smartphone size={20} />} name="iPhone 15 Pro" status="Current Device" />
                                <DeviceRow icon={<Tablet size={20} />} name="iPad Air" status="Last active: 2 days ago" />
                                <div className="p-4 border-2 border-dashed border-[#e5e0d8] rounded-xl flex items-center justify-center text-[#999] text-sm font-medium cursor-pointer hover:border-[#999] transition-colors">
                                    + Add New Device
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] text-center">
            <div className="font-serif font-bold text-4xl text-[#1a1a1a] mb-1">{value}</div>
            <div className="text-sm text-[#666] uppercase tracking-wider font-medium">{label}</div>
        </div>
    );
}

function DeviceRow({ icon, name, status }: { icon: React.ReactNode; name: string; status: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-[#e5e0d8] rounded-xl">
            <div className="flex items-center gap-4">
                <div className="text-[#666]">{icon}</div>
                <div>
                    <div className="font-bold text-[#1a1a1a]">{name}</div>
                    <div className="text-xs text-[#666]">{status}</div>
                </div>
            </div>
            <button className="text-red-500 text-sm font-medium hover:underline">Remove</button>
        </div>
    );
}
