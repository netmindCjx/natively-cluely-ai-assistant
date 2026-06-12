import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Github, Twitter, Shield, Cpu, Database,
    Heart, Linkedin, Instagram, Mail, MicOff, Star, Bug, Globe, Sparkles, Zap, Camera, LayoutGrid, User
} from 'lucide-react';
import evinProfile from '../assets/evin.png';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { getPlatformShortcut } from '../utils/platformUtils';

interface AboutSectionProps { }

export const AboutSection: React.FC<AboutSectionProps> = () => {
    const { t } = useTranslation();
    const isLight = useResolvedTheme() === 'light';
    const donationClickTimeRef = useRef<number | null>(null);

    // Initial check for donation status not needed for visuals anymore (since we removed key input)
    // but we might want to hide the support button if donated? 
    // User said "wont show if the user open the donate button" -> this refers to the toaster.
    // For About section, usually validation/support button stays but maybe changes text?
    // I'll keep it as is, just the logic change.

    useEffect(() => {
        const handleFocus = async () => {
            if (donationClickTimeRef.current) {
                const elapsed = Date.now() - donationClickTimeRef.current;
                if (elapsed > 20000) { // 20 seconds
                    console.log("User returned after >20s. Marking as donated.");
                    await window.electronAPI?.setDonationComplete();
                    donationClickTimeRef.current = null; // Reset
                } else {
                    console.log("User returned too quickly (<20s). Not confirming donation.");
                    donationClickTimeRef.current = null;
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleOpenLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        e.preventDefault();

        // Special handling for donation link
        if (url.includes('buymeacoffee.com')) {
            donationClickTimeRef.current = Date.now();
        }

        // Use backend shell.openExternal
        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="space-y-6 animated fadeIn pb-10">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{t('about.title')}</h3>
                <p className="text-sm text-text-secondary">{t('about.tagline')}</p>
            </div>

            {/* What's New Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('about.whatsNew')}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle overflow-hidden">
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                <LayoutGrid size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.modesManager')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.modesManagerDescription')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                <User size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.customContext')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.customContextDescription')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.realTimePro')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.realTimeProDescription')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.sttStability')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.sttStabilityDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('about.howItWorks')}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle overflow-hidden">
                    <div className="p-3 border-b border-border-subtle bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.hybridIntelligence')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.hybridIntelligenceDescription')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-bg-card/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                <Database size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary mb-1">{t('about.localRag')}</h5>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {t('about.localRagDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('about.privacyData')}</h4>
                <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <Shield size={16} className="text-green-400 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-medium text-text-primary">{t('about.stealthControl')}</h5>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                {t('about.stealthControlDescription')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MicOff size={16} className="text-red-500 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-medium text-text-primary">{t('about.noRecording')}</h5>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                {t('about.noRecordingDescription')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>





            {/* Community Section */}
            <div>
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">{t('about.community')}</h4>
                <div className="space-y-4">
                    {/* 0. Official Website */}
                    <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm shadow-indigo-500/5">
                                <Globe size={18} className="opacity-80" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('about.officialWebsite')}</h5>
                            </div>
                        </div>
                        <a
                            href="https://natively.software"
                            onClick={(e) => handleOpenLink(e, "https://natively.software")}
                            className="whitespace-nowrap px-4 py-2 bg-text-primary hover:bg-white/90 text-bg-main text-xs font-bold rounded-lg transition-all shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                            <Globe size={14} />
                            {t('about.visitWebsite')}
                        </a>
                    </div>

                    {/* 1. Founder Profile */}
                    <div className="bg-bg-item-surface rounded-xl p-5">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={evinProfile} alt="Evin John" className="w-full h-full object-cover" />
                                </div>
                                <div className="pt-0.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="text-sm font-bold text-text-primary">Evin John</h5>
                                        <span className={`text-[10px] font-medium px-1.5 py-[1px] rounded-full ${isLight ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-yellow-400/10 text-yellow-200 border border-yellow-400/5'}`}>{t('about.creator')}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                                        {t('about.founderBio1')}
                                        <br />
                                        <span className="font-bold text-text-primary">Natively</span> {t('about.founderBio2')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pl-[60px]">
                                <a
                                    href="https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant"
                                    onClick={(e) => handleOpenLink(e, "https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant")}
                                    className="text-text-tertiary hover:text-text-primary transition-colors"
                                    title={t('about.github')}
                                >
                                    <Github size={18} />
                                </a>
                                <a
                                    href="https://x.com/evinjohnn"
                                    onClick={(e) => handleOpenLink(e, "https://x.com/evinjohnn")}
                                    className="text-text-tertiary hover:text-text-primary transition-colors"
                                    title={t('about.twitter')}
                                >
                                    <Twitter size={18} />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/evinjohn"
                                    onClick={(e) => handleOpenLink(e, "https://www.linkedin.com/in/evinjohn")}
                                    className="text-text-tertiary hover:text-text-primary transition-colors"
                                    title={t('about.linkedin')}
                                >
                                    <Linkedin size={18} />
                                </a>
                                <a
                                    href="https://www.instagram.com/evinjohnn/"
                                    onClick={(e) => handleOpenLink(e, "https://www.instagram.com/evinjohnn/")}
                                    className="text-text-tertiary hover:text-text-primary transition-colors"
                                    title={t('about.instagram')}
                                >
                                    <Instagram size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 2. Star & Report */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant"
                            onClick={(e) => handleOpenLink(e, "https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant")}
                            className="bg-bg-item-surface border border-border-subtle rounded-xl p-5 transition-all group flex items-center gap-4 h-full hover:bg-white/10"
                        >
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Star size={20} className="transition-all group-hover:fill-current" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('about.starOnGithub')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('about.starOnGithubDescription')}</p>
                            </div>
                        </a>

                        <a
                            href="https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant/issues"
                            onClick={(e) => handleOpenLink(e, "https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant/issues")}
                            className="bg-bg-item-surface border border-border-subtle rounded-xl p-5 transition-all group flex items-center gap-4 h-full hover:bg-white/10"
                        >
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Bug size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('about.reportIssue')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('about.reportIssueDescription')}</p>
                            </div>
                        </a>
                    </div>

                    {/* 3. Get in Touch */}
                    <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm shadow-blue-500/5">
                                <Mail size={18} className="opacity-80" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('about.getInTouch')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('about.getInTouchDescription')}</p>
                            </div>
                        </div>
                        <a
                            href="mailto:evinjohnignatious@gmail.com"
                            onClick={(e) => handleOpenLink(e, "mailto:evinjohnignatious@gmail.com")}
                            className="whitespace-nowrap px-4 py-2 bg-text-primary hover:bg-white/90 text-bg-main text-xs font-bold rounded-lg transition-all shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                            <Mail size={14} />
                            {t('about.contactMe')}
                        </a>
                    </div>

                    {/* 4. Support */}
                    <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-sm shadow-pink-500/5">
                                <Heart size={18} fill="currentColor" className="opacity-80" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">{t('about.supportDevelopment')}</h5>
                                <p className="text-xs text-text-secondary mt-0.5">{t('about.supportDevelopmentDescription')}</p>
                            </div>
                        </div>
                        <a
                            href="https://buymeacoffee.com/evinjohnn"
                            onClick={(e) => handleOpenLink(e, "https://buymeacoffee.com/evinjohnn")}
                            className="whitespace-nowrap px-4 py-2 bg-text-primary hover:bg-white/90 text-bg-main text-xs font-bold rounded-lg transition-all shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {t('about.supportProject')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Credits */}
            <div className="pt-4 border-t border-border-subtle">
                <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">{t('about.coreTechnology')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Groq', 'Gemini', 'OpenAI', 'Deepgram', 'ElevenLabs', 'Electron', 'React', 'Rust', 'Sharp', 'TypeScript', 'Tailwind CSS', 'Vite', 'Google Cloud', 'SQLite'].map(tech => (
                            <span key={tech} className="px-2.5 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] font-medium text-text-secondary">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};
