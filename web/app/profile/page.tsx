"use client";

import { Award, BookOpen, Clock, User, Briefcase, Heart, Globe, Target } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import HyReadConnect from "@/components/profile/HyReadConnect";
import type { OccupationType, ReadingGoalType } from "@/types/user";

const OCCUPATIONS: OccupationType[] = [
    'Software Engineer', 'Teacher', 'Student', 'Doctor', 'Nurse',
    'Business Professional', 'Artist', 'Writer', 'Researcher',
    'Entrepreneur', 'Retired', 'Other'
];

const READING_GOALS: ReadingGoalType[] = [
    'Professional Development', 'Entertainment', 'Learning New Skills',
    'Personal Growth', 'Academic Study', 'Language Learning', 'Relaxation'
];

const INTERESTS = [
    'Technology', 'Science', 'Business', 'Self-Help', 'Fiction',
    'History', 'Psychology', 'Philosophy', 'Art', 'Travel',
    'Health', 'Cooking', 'Sports', 'Music', 'Politics'
];

const LANGUAGES = [
    'English', 'Chinese', 'Spanish', 'French', 'German',
    'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian'
];

export default function ProfilePage() {
    const [occupation, setOccupation] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).occupation || 'Student';
                } catch { return 'Student'; }
            }
        }
        return 'Student';
    });

    const [gender, setGender] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).gender || 'Prefer not to say';
                } catch { return 'Prefer not to say'; }
            }
        }
        return 'Prefer not to say';
    });

    const [age, setAge] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).age || 25;
                } catch { return 25; }
            }
        }
        return 25;
    });

    const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).interests || ['Technology', 'Self-Help'];
                } catch { return ['Technology', 'Self-Help']; }
            }
        }
        return ['Technology', 'Self-Help'];
    });

    const [selectedGoals, setSelectedGoals] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).readingGoals || ['Professional Development'];
                } catch { return ['Professional Development']; }
            }
        }
        return ['Professional Development'];
    });

    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                try {
                    return JSON.parse(saved).preferredLanguages || ['English', 'Chinese'];
                } catch { return ['English', 'Chinese']; }
            }
        }
        return ['English', 'Chinese'];
    });

    const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    // Save profile to localStorage
    const handleSaveProfile = () => {
        const profile = {
            occupation,
            gender,
            age,
            interests: selectedInterests,
            readingGoals: selectedGoals,
            preferredLanguages: selectedLanguages,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('userProfile', JSON.stringify(profile));
        alert('✅ Profile saved successfully!');
    };

    return (
        <div className="p-8 lg:p-12 max-w-6xl mx-auto">
            <header className="mb-12 flex items-center gap-6">
                <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-3xl font-serif font-bold shadow-xl">
                    {gender === 'Male' ? '👨' : gender === 'Female' ? '👩' : '👤'}
                </div>
                <div>
                    <h1 className="font-serif font-bold text-3xl text-[#1a1a1a] mb-1">Your Profile</h1>
                    <p className="text-[#666]">Personalize your reading experience</p>
                </div>
            </header>

            {/* Personal Information */}
            <section className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                    <User size={24} /> Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Occupation */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">
                            <Briefcase size={16} className="inline mr-1" /> Occupation
                        </label>
                        <select
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                        >
                            {OCCUPATIONS.map(occ => (
                                <option key={occ} value={occ}>{occ}</option>
                            ))}
                        </select>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(parseInt(e.target.value))}
                            min="13"
                            max="120"
                            className="w-full px-4 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                        />
                    </div>
                </div>
            </section>

            {/* Reading Interests */}
            <section className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                    <Heart size={24} /> Reading Interests
                </h2>
                <p className="text-sm text-[#666] mb-4">Select topics you're interested in (helps with recommendations)</p>
                <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                        <button
                            key={interest}
                            onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedInterests.includes(interest)
                                ? 'bg-[#1a1a1a] text-white'
                                : 'bg-[#f0ebe4] text-[#666] hover:bg-[#e5e0d8]'
                                }`}
                        >
                            {interest}
                        </button>
                    ))}
                </div>
            </section>

            {/* Reading Goals */}
            <section className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                    <Target size={24} /> Reading Goals
                </h2>
                <p className="text-sm text-[#666] mb-4">What do you want to achieve through reading?</p>
                <div className="flex flex-wrap gap-2">
                    {READING_GOALS.map(goal => (
                        <button
                            key={goal}
                            onClick={() => toggleSelection(goal, selectedGoals, setSelectedGoals)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGoals.includes(goal)
                                ? 'bg-[#1a1a1a] text-white'
                                : 'bg-[#f0ebe4] text-[#666] hover:bg-[#e5e0d8]'
                                }`}
                        >
                            {goal}
                        </button>
                    ))}
                </div>
            </section>

            {/* Preferred Languages */}
            <section className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                    <Globe size={24} /> Preferred Languages
                </h2>
                <p className="text-sm text-[#666] mb-4">Languages you can read or want to learn</p>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang}
                            onClick={() => toggleSelection(lang, selectedLanguages, setSelectedLanguages)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLanguages.includes(lang)
                                ? 'bg-[#1a1a1a] text-white'
                                : 'bg-[#f0ebe4] text-[#666] hover:bg-[#e5e0d8]'
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </section>

            {/* HyRead Integration */}
            <div className="mb-8">
                <HyReadConnect />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<BookOpen />} label="Books Read" value="42" />
                <StatCard icon={<Clock />} label="Reading Time" value="128h" />
                <StatCard icon={<Award />} label="Badges" value="15" />
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                <Link href="/" className="px-6 py-3 rounded-xl border border-[#e5e0d8] text-[#666] hover:bg-[#fdfbf7] transition-colors">
                    Cancel
                </Link>
                <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white hover:bg-black transition-colors font-medium"
                >
                    Save Profile
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-[#fdfbf7] rounded-xl flex items-center justify-center text-[#1a1a1a]">
                {icon}
            </div>
            <div>
                <div className="font-bold text-2xl text-[#1a1a1a]">{value}</div>
                <div className="text-xs text-[#666] uppercase tracking-wider font-medium">{label}</div>
            </div>
        </div>
    )
}
