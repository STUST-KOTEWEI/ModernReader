"use client";

import { Award, BookOpen, Clock, User, Briefcase, Heart, Globe, Target } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import HyReadConnect from "@/components/profile/HyReadConnect";
import type { OccupationType, ReadingGoalType } from "@/types/user";
import { useSession } from "next-auth/react"; // Import useSession

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

const CULTURAL_PREFERENCES = [ // New cultural preferences list
    'Taiwanese', 'Hakka', 'Min-nan', 'Western', 'East Asian',
    'Southeast Asian', 'European', 'African', 'Latin American'
];

import { useGamification } from '@/hooks/useGamification'; // Import the hook
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { data: session, status } = useSession(); // Get session
    const { logActivity } = useGamification(); // Use the hook
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [occupation, setOccupation] = useState<string>('Student');
    const [gender, setGender] = useState<string>('Prefer not to say');
    const [age, setAge] = useState<number>(25);
    const [selectedInterests, setSelectedInterests] = useState<string[]>(['Technology', 'Self-Help']);
    const [selectedGoals, setSelectedGoals] = useState<string[]>(['Professional Development']);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Chinese']);
    const [selectedCulturalPreferences, setSelectedCulturalPreferences] = useState<string[]>([]);
    const [points, setPoints] = useState(0); // New state for points
    const [level, setLevel] = useState(1); // New state for level

    useEffect(() => {
        const fetchProfile = async () => {
            if (status !== 'authenticated') {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/v1/users/me', {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}` // Use access token
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch profile.');
                }
                const data = await response.json();
                setOccupation(data.occupation || 'Student');
                setGender(data.gender || 'Prefer not to say');
                setAge(data.age || 25);
                setSelectedInterests(data.interests || ['Technology', 'Self-Help']);
                setSelectedGoals(data.readingGoals || ['Professional Development']);
                setSelectedLanguages(data.preferredLanguages || ['English', 'Chinese']);
                setSelectedCulturalPreferences(data.cultural_preferences || []); // Load new field
                setPoints(data.points || 0);
                setLevel(data.level || 1);
            } catch (err: any) {
                setError(err.message);
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [session, status]);

    const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSaveProfile = async () => {
        if (status !== 'authenticated') {
            alert('Please sign in to save your profile.');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const profileData = {
                occupation,
                gender,
                age,
                interests: selectedInterests,
                readingGoals: selectedGoals,
                preferredLanguages: selectedLanguages,
                cultural_preferences: selectedCulturalPreferences, // Save new field
            };

            const response = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to save profile.');
            }

            alert('✅ Profile saved successfully!');
            logActivity('PROFILE_UPDATED'); // Log activity
        } catch (err: any) {
            setError(err.message);
            console.error('Error saving profile:', err);
            alert(`❌ Error saving profile: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 lg:p-12 flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 lg:p-12 text-center text-red-600">
                <p>Error: {error}</p>
                <p>Please try again or ensure you are logged in.</p>
            </div>
        );
    }

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
                <p className="text-sm text-[#666] mb-4">Select topics you&apos;re interested in (helps with recommendations)</p>
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

            {/* Cultural Preferences */}
            <section className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl mb-6 flex items-center gap-2">
                    <Globe size={24} /> Cultural Preferences
                </h2>
                <p className="text-sm text-[#666] mb-4">Select cultural contexts you are interested in</p>
                <div className="flex flex-wrap gap-2">
                    {CULTURAL_PREFERENCES.map(culture => (
                        <button
                            key={culture}
                            onClick={() => toggleSelection(culture, selectedCulturalPreferences, setSelectedCulturalPreferences)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCulturalPreferences.includes(culture)
                                ? 'bg-[#1a1a1a] text-white'
                                : 'bg-[#f0ebe4] text-[#666] hover:bg-[#e5e0d8]'
                                }`}
                        >
                            {culture}
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
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Profile'}
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
