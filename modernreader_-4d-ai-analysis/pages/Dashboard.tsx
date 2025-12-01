import React, { useState, useEffect } from 'react';
import { ReaderIcon, UploadIcon, CameraIcon, ResumeIcon } from '../components/icons';
import { ReaderSession } from '../types';

const ActionCard: React.FC<{ title: string; description: string; href: string; icon: React.ReactNode }> = ({ title, description, href, icon }) => (
    <a 
        href={href}
        className="block p-6 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-700/60 hover:border-purple-500 transition-all transform hover:-translate-y-1"
    >
        <div className="flex items-center mb-3">
            <div className="p-2 bg-gray-700 rounded-full mr-4">
                {icon}
            </div>
            <h5 className="text-xl font-bold tracking-tight text-gray-100">{title}</h5>
        </div>
        <p className="font-normal text-gray-400">{description}</p>
    </a>
);

const PartnerCard: React.FC<{ name: string; description: string; }> = ({ name, description }) => (
    <div className="p-4 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg">
        <h6 className="font-semibold text-cyan-400">{name}</h6>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
);


export default function Dashboard() {
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        try {
            const savedSession = localStorage.getItem('modernReader-session');
            if (savedSession) {
                const sessionData: ReaderSession = JSON.parse(savedSession);
                if (sessionData.inputText && sessionData.inputText.length > 0) {
                    setHasSession(true);
                }
            }
        } catch (e) {
            console.error("Failed to parse saved session", e);
            setHasSession(false);
        }
    }, []);


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-100">Dashboard</h1>
                    <p className="text-lg text-gray-400 mt-2">Welcome to your AI-powered analysis command center.</p>
                </header>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">Start New Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hasSession && (
                            <ActionCard 
                                title="Resume Last Session"
                                description="Jump back into your last analysis exactly where you left off."
                                href="#/reader"
                                icon={<ResumeIcon className="w-6 h-6 text-green-400" />}
                            />
                        )}
                        <ActionCard 
                            title="Reader Studio"
                            description="Paste text, upload files, or use your camera in our dedicated analysis workspace."
                            href="#/reader"
                            icon={<ReaderIcon className="w-6 h-6 text-purple-400" />}
                        />
                         <ActionCard 
                            title="Quick Upload"
                            description="Jump right to the file uploader in the Reader Studio to begin your analysis."
                            href="#/reader?mode=file"
                            icon={<UploadIcon className="w-6 h-6 text-cyan-400" />}
                        />
                         <ActionCard 
                            title="Live Scan"
                            description="Instantly start scanning text from a physical document using your device's camera."
                            href="#/reader?mode=camera"
                            icon={<CameraIcon className="w-6 h-6 text-yellow-400" />}
                        />
                    </div>
                </section>
                
                <section>
                    <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">Partner Integrations</h2>
                     <p className="text-md text-gray-500 mb-6 max-w-3xl">Connect ModernReader to your favorite tools. Our platform is built to be extensible, allowing for seamless integration with a growing list of services.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <PartnerCard name="Connect to Notion (Coming Soon)" description="Automatically sync your analysis results to your Notion workspaces." />
                        <PartnerCard name="Import from Google Drive (Coming Soon)" description="Analyze documents directly from your Google Drive account." />
                        <PartnerCard name="Zotero Integration (Planned)" description="Link with your academic library for enhanced research capabilities." />
                    </div>
                </section>
            </div>
        </div>
    );
}