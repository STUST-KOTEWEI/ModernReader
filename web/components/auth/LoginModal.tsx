"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { X, Mail, Lock, Fingerprint, Mic, ArrowRight, ScanFace } from 'lucide-react';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type LoginStep = "menu" | "credentials" | "biometric" | "success";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [step, setStep] = useState<LoginStep>("menu");
    const [loginType, setLoginType] = useState<"google" | "demo">("demo");
    const [name, setName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [captchaQuestion] = useState(() => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        return { num1, num2, answer: num1 + num2 };
    });

    // ... captcha setup ...

    // Reset state when opening
    useEffect(() => {
        if (!isOpen) {
            // Reset when closed, not when opened to avoid render loop
            const timer = setTimeout(() => {
                setStep("menu");
                setEmail("");
                setPassword("");
                setName("");
                setIsRegistering(false);
                setIsScanning(false);
                setCaptchaAnswer("");
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartLogin = (type: "google" | "demo") => {
        setLoginType(type);
        if (type === "demo") {
            // Only autofill if not trying to register manual account
            // Actually, keep it simple: clear for everything except specific demo click
            setEmail("");
            setPassword("");
        }
        setStep("credentials");
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (res.ok) {
                alert("Account created! Logging you in...");
                setIsRegistering(false);
                // Proceed to Login simulation
                handleCredentialsSubmit(e);
            } else {
                const data = await res.json();
                alert(data.message || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            alert("Registration error");
        }
    };

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Verify CAPTCHA only if we are logging in (we skipped it for register UI for simplicity)
        if (!isRegistering) {
            if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
                alert("CAPTCHA incorrect! Please try again.");
                setCaptchaAnswer("");
                return;
            }
        }

        setStep("biometric");
    };

    const handleBiometricComplete = async () => {
        setIsScanning(true);
        // Simulate scanning delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Perform actual login with CAPTCHA
        const result = await signIn("credentials", {
            loginType: loginType === "google" ? "google" : undefined,
            username: "demo", // Always use demo creds for the backend mock
            password: "demo",
            captcha: "correct", // Pass verification flag
            redirect: false
        });

        if (result?.error) {
            alert(result.error);
            setIsScanning(false);
            setStep("credentials");
            return;
        }

        setStep("success");
        setTimeout(() => {
            onClose();
            window.location.href = "/profile";
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#e5e0d8] relative min-h-[400px] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#f0ebe4] rounded-full transition-colors z-10">
                    <X size={20} className="text-[#666]" />
                </button>

                <div className="flex-1 p-8 flex flex-col justify-center">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: MENU */}
                        {step === "menu" && (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-[#fdfbf7] font-serif font-bold text-3xl mx-auto mb-6 shadow-lg">
                                    M
                                </div>
                                <h2 className="font-serif font-bold text-2xl text-[#1a1a1a] mb-2">Welcome Back</h2>
                                <p className="text-[#666] mb-8">Sign in to access your library.</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleStartLogin("google")}
                                        className="w-full bg-white border border-[#e5e0d8] hover:border-[#1a1a1a] hover:bg-[#fdfbf7] text-[#1a1a1a] font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200"
                                    >
                                        <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
                                        <span>Continue with Google</span>
                                    </button>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5e0d8]"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-[#999]">Or</span></div>
                                    </div>

                                    <button
                                        onClick={() => handleStartLogin("demo")}
                                        className="w-full bg-[#1a1a1a] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg"
                                    >
                                        <span>Try Demo Account</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: CREDENTIALS (LOGIN / REGISTER) */}
                        {step === "credentials" && (
                            <motion.div
                                key="credentials"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="font-serif font-bold text-2xl text-[#1a1a1a] mb-6 text-center">
                                    {isRegistering ? "Create Account" : (loginType === "google" ? "Sign in with Google" : "Login")}
                                </h2>

                                <form onSubmit={isRegistering ? handleRegisterSubmit : handleCredentialsSubmit} className="space-y-4">

                                    {isRegistering && (
                                        <div>
                                            <label className="block text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Full Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-all"
                                                    placeholder="Your Name"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 text-[#999]" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-all"
                                                placeholder="name@example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#666] uppercase tracking-wider mb-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-[#999]" size={18} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* CAPTCHA - Only for Login to match backend logic, or skip for simplicity in UX if verified earlier */}
                                    {!isRegistering && (
                                        <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#e5e0d8]">
                                            <label className="block text-xs font-bold text-[#666] uppercase tracking-wider mb-2">
                                                Security Check: {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                                            </label>
                                            <input
                                                type="number"
                                                value={captchaAnswer}
                                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-all"
                                                placeholder="Your answer"
                                                required
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-[#1a1a1a] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all mt-6"
                                    >
                                        <span>{isRegistering ? "Create Account" : "Continue"}</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </form>

                                <div className="mt-4 text-center space-y-2">
                                    <button
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="text-sm font-medium text-[#1a1a1a] hover:underline"
                                    >
                                        {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                                    </button>
                                    <button onClick={() => setStep("menu")} className="block w-full text-xs text-[#666] hover:underline">
                                        Back to Menu
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: BIOMETRIC */}
                        {step === "biometric" && (
                            <BiometricStep onComplete={handleBiometricComplete} isScanning={isScanning} />
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Fingerprint size={40} />
                                </div>
                                <h2 className="font-serif font-bold text-2xl text-[#1a1a1a] mb-2">Authenticated</h2>
                                <p className="text-[#666]">Welcome back, Kaleb.</p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function BiometricStep({ onComplete, isScanning }: { onComplete: () => void; isScanning: boolean }) {
    const [scanType, setScanType] = useState<"face" | "voice">("face");

    useEffect(() => {
        if (!isScanning) {
            // Auto-start scanning simulation or wait for user? 
            // Let's wait for user to click "Verify"
        }
    }, [isScanning]);

    return (
        <motion.div
            key="biometric"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
        >
            <div className="mb-8 relative h-32 flex items-center justify-center">
                {/* Scanning Animation */}
                {isScanning && (
                    <motion.div
                        className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
                <div className={clsx(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                    isScanning ? "bg-blue-50 text-blue-600" : "bg-[#fdfbf7] text-[#1a1a1a] border-2 border-[#e5e0d8]"
                )}>
                    {scanType === "face" ? <ScanFace size={48} /> : <Mic size={48} />}
                </div>
            </div>

            <h2 className="font-serif font-bold text-xl text-[#1a1a1a] mb-2">
                {isScanning ? "Verifying Identity..." : "Security Check"}
            </h2>
            <p className="text-[#666] text-sm mb-8">
                {isScanning ? "Analyzing biometric data..." : "Please verify your identity to continue."}
            </p>

            {!isScanning && (
                <div className="space-y-3">
                    <div className="flex gap-2 justify-center mb-6">
                        <button
                            onClick={() => setScanType("face")}
                            className={clsx("p-3 rounded-xl border transition-all", scanType === "face" ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e5e0d8] text-[#666]")}
                        >
                            <ScanFace size={20} />
                        </button>
                        <button
                            onClick={() => setScanType("voice")}
                            className={clsx("p-3 rounded-xl border transition-all", scanType === "voice" ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e5e0d8] text-[#666]")}
                        >
                            <Mic size={20} />
                        </button>
                    </div>
                    <button
                        onClick={onComplete}
                        className="w-full bg-[#1a1a1a] text-white font-medium py-3 px-4 rounded-xl hover:bg-black transition-all"
                    >
                        Start Verification
                    </button>
                </div>
            )}
        </motion.div>
    )
}
