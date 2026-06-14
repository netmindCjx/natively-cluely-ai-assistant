import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Upload, RefreshCw, Trash2, Pencil, Check, Globe, Building2, Search,
    Sparkles, Info, AlertCircle, Gift, CheckCircle, Star, Briefcase,
} from 'lucide-react';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { ProfileVisualizer, PremiumUpgradeModal } from '../premium';

// ---------------------------------------------------------------------------
// StarRating — renders filled/empty stars for culture ratings
// ---------------------------------------------------------------------------
const StarRating = ({ value, size = 11 }: { value: number; size?: number }) => {
    const clamped = Math.min(5, Math.max(0, value ?? 0));
    const rounded = Math.round(clamped * 2) / 2;
    const full = Math.floor(rounded);
    const half = rounded - full === 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: full }).map((_, i) => (
                <Star key={`f${i}`} size={size} className="text-yellow-400 fill-yellow-400" />
            ))}
            {half && <Star size={size} className="text-yellow-400 fill-yellow-400/40" />}
            {Array.from({ length: empty }).map((_, i) => (
                <Star key={`e${i}`} size={size} className="text-text-tertiary/25 fill-transparent" />
            ))}
        </span>
    );
};

const ProfileView: React.FC = () => {
    const { t } = useTranslation();
    const isLight = useResolvedTheme() === 'light';

    // Profile Engine State
    const [profileStatus, setProfileStatus] = useState<{
        hasProfile: boolean;
        profileMode: boolean;
        name?: string;
        role?: string;
        totalExperienceYears?: number;
    }>({ hasProfile: false, profileMode: false });
    const [profileUploading, setProfileUploading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileData, setProfileData] = useState<any>(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumPlan, setPremiumPlan] = useState<string>('');
    const [jdUploading, setJdUploading] = useState(false);
    const [jdError, setJdError] = useState('');
    const [jdText, setJdText] = useState('');
    const [jdInputMode, setJdInputMode] = useState<'paste' | 'file'>('paste');
    const [companyResearching, setCompanyResearching] = useState(false);
    const [companyDossier, setCompanyDossier] = useState<any>(null);
    const [companySearchQuotaExhausted, setCompanySearchQuotaExhausted] = useState(false);
    const [tavilyApiKey, setTavilyApiKey] = useState('');
    const [hasStoredTavilyKey, setHasStoredTavilyKey] = useState(false);
    const [tavilySaving, setTavilySaving] = useState(false);
    const [tavilyError, setTavilyError] = useState('');
    const [negotiationScript, setNegotiationScript] = useState<any>(null);
    const [negotiationGenerating, setNegotiationGenerating] = useState(false);
    const [negotiationError, setNegotiationError] = useState('');
    const [customNotes, setCustomNotes] = useState('');
    const [customNotesSaved, setCustomNotesSaved] = useState(false);
    const customNotesDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial data load
    useEffect(() => {
        window.electronAPI?.profileGetStatus?.().then(setProfileStatus).catch(() => { });
        window.electronAPI?.profileGetProfile?.().then(data => {
            setProfileData(data);
            if (data?.negotiationScript) setNegotiationScript(data.negotiationScript);
        }).catch(() => { });
        window.electronAPI?.profileGetNotes?.().then(res => {
            if (res?.success) setCustomNotes(res.content ?? '');
        }).catch(() => { });

        if (window.electronAPI?.licenseGetDetails) {
            window.electronAPI.licenseGetDetails().then((details) => {
                setIsPremium(details.isPremium);
                if (details.plan) setPremiumPlan(details.plan);
            }).catch(() => { });
        } else {
            window.electronAPI?.licenseCheckPremium?.().then(setIsPremium).catch(() => { });
        }

        // @ts-ignore — fetch tavily key presence via stored credentials
        window.electronAPI?.getStoredCredentials?.().then((creds: any) => {
            if (creds?.hasTavilyKey) setHasStoredTavilyKey(true);
        }).catch(() => { });
    }, []);

    const handleRemoveTavilyKey = async () => {
        if (!confirm('Are you sure you want to remove the Tavily API Key?')) return;
        try {
            await window.electronAPI?.setTavilyApiKey?.('');
            setTavilyApiKey('');
            setHasStoredTavilyKey(false);
        } catch (e) {
            console.error('Failed to remove Tavily API key:', e);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-bg-primary">
            <section className="px-8 py-8 min-h-full">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-6 animated fadeIn">
                        {/* Introduction */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-text-primary">{t('settings.profile.professionalIdentity')}</h3>
                                    <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{t('settings.profile.betaBadge')}</span>
                                    {isPremium && premiumPlan && (
                                        <span className="bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ml-1">
                                            {t('settings.profile.planLabel', { plan: premiumPlan.toUpperCase() })}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsPremiumModalOpen(true)}
                                    className={`text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 px-2.5 py-1 rounded-full border shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:shadow-[0_0_15px_rgba(250,204,21,0.3)] ${isPremium
                                        ? (isLight ? 'bg-bg-component text-text-primary border-border-subtle hover:bg-bg-item-surface' : 'bg-zinc-800 text-white border-white/10 hover:bg-zinc-700')
                                        : 'bg-[#FACC15] text-black border-transparent hover:bg-[#FDE047] active:scale-[0.98]'
                                        }`}
                                >
                                    {isPremium ? <CheckCircle size={12} className="text-green-400" /> : <Sparkles size={12} className="text-black/80" />}
                                    {isPremium ? t('settings.profile.managePro') : t('settings.profile.unlockPro')}
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary mb-2">
                                {t('settings.profile.intro')}
                            </p>
                        </div>

                        {/* Intelligence Graph Hero Card */}
                        <div className="bg-bg-item-surface rounded-xl border border-border-subtle flex flex-col justify-between overflow-hidden">
                            <div className="flex flex-col justify-between min-h-[160px]">
                                {/* Header */}
                                <div className="p-5 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-bg-input border border-border-subtle flex items-center justify-center text-text-primary shadow-sm hover:scale-105 transition-transform duration-300">
                                                <span className="font-bold text-sm tracking-tight">
                                                    {profileData?.identity?.name ? profileData.identity.name.charAt(0).toUpperCase() : 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-text-primary tracking-tight">
                                                    {profileData?.identity?.name || t('settings.profile.identityInactive')}
                                                </h4>
                                                <p className="text-xs text-text-secondary mt-0.5 tracking-wide">
                                                    {profileData?.identity?.email || t('settings.profile.uploadResumeHint')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {profileStatus.hasProfile && (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(t('settings.profile.confirmDeletePersona'))) return;
                                                        try {
                                                            await window.electronAPI?.profileDelete?.();
                                                            setProfileStatus({ hasProfile: false, profileMode: false });
                                                            setProfileData(null);
                                                        } catch (e) { console.error('Failed to delete profile:', e); }
                                                    }}
                                                    className="text-[12px] font-medium text-text-tertiary hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-500/10"
                                                >
                                                    {t('settings.profile.disconnect')}
                                                </button>
                                            )}

                                            {/* High-fidelity Toggle */}
                                            <div className={`flex items-center gap-2 bg-bg-input px-3 py-1.5 rounded-full border border-border-subtle ${!profileStatus.hasProfile ? 'opacity-40 cursor-not-allowed' : ''}`} title={!profileStatus.hasProfile ? t('settings.profile.uploadResumeToEnablePersona') : ''}>
                                                <span className="text-xs font-medium text-text-secondary">{t('settings.profile.personaEngine')}</span>
                                                <div
                                                    onClick={async () => {
                                                        if (!profileStatus.hasProfile) return;
                                                        const newState = !profileStatus.profileMode;
                                                        try {
                                                            await window.electronAPI?.profileSetMode?.(newState);
                                                            setProfileStatus(prev => ({ ...prev, profileMode: newState }));
                                                        } catch (e) {
                                                            console.error('Failed to toggle profile mode:', e);
                                                        }
                                                    }}
                                                    className={`w-9 h-5 rounded-full relative transition-colors ${!profileStatus.hasProfile ? 'opacity-40 cursor-not-allowed bg-bg-toggle-switch' : profileStatus.profileMode ? 'bg-accent-primary' : 'bg-bg-toggle-switch border border-border-muted'}`}
                                                >
                                                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${profileStatus.profileMode ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Metrics & Extracted Skills */}
                                <div className="p-5 pt-0 mt-auto">
                                    <div className="flex items-center justify-between bg-bg-input border border-border-subtle py-4 px-6 rounded-2xl shadow-sm">
                                        <div className="flex flex-col items-center justify-center flex-1">
                                            <span className="text-[20px] font-bold text-text-primary tracking-tight leading-none mb-1">{profileData?.experienceCount || 0}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{t('settings.profile.experience')}</span>
                                            </div>
                                        </div>

                                        <div className="h-8 w-px bg-border-subtle/60" />

                                        <div className="flex flex-col items-center justify-center flex-1">
                                            <span className="text-[20px] font-bold text-text-primary tracking-tight leading-none mb-1">{profileData?.projectCount || 0}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{t('settings.profile.projects')}</span>
                                            </div>
                                        </div>

                                        <div className="h-8 w-px bg-border-subtle/60" />

                                        <div className="flex flex-col items-center justify-center flex-1">
                                            <span className="text-[20px] font-bold text-text-primary tracking-tight leading-none mb-1">{profileData?.nodeCount || 0}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{t('settings.profile.nodes')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {profileData?.skills && profileData.skills.length > 0 && (
                                        <div className="mt-5">
                                            <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-2">
                                                {t('settings.profile.topSkills')}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profileData.skills.slice(0, 15).map((skill: string, i: number) => (
                                                    <span key={i} className="text-[10px] font-medium text-text-secondary px-2 py-1 rounded-md border border-border-subtle bg-bg-input">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div className="mt-5">
                            <div className={`bg-bg-item-surface rounded-xl border transition-all ${profileUploading ? 'border-accent-primary/50 ring-1 ring-accent-primary/20' : 'border-border-subtle'}`}>
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-bg-input border border-border-subtle flex items-center justify-center text-text-tertiary shrink-0">
                                            {profileUploading ? <RefreshCw size={20} className="animate-spin text-accent-primary" /> : <Upload size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-text-primary mb-0.5 truncate pr-4">
                                                {profileStatus.hasProfile ? t('settings.profile.overwriteSource') : t('settings.profile.initKnowledgeBase')}
                                            </h4>
                                            {profileUploading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-[4px] w-[100px] bg-bg-input rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent-primary rounded-full animate-pulse" style={{ width: '50%' }} />
                                                    </div>
                                                    <span className="text-[10px] text-text-secondary tracking-wide">{t('settings.profile.processingStructural')}</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-text-secondary truncate pr-4">
                                                    {t('settings.profile.provideResumeFile')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            setProfileError('');
                                            try {
                                                const fileResult = await window.electronAPI?.profileSelectFile?.();
                                                if (fileResult?.cancelled || !fileResult?.filePath) return;

                                                setProfileUploading(true);
                                                const result = await window.electronAPI?.profileUploadResume?.(fileResult.filePath);
                                                if (result?.success) {
                                                    const status = await window.electronAPI?.profileGetStatus?.();
                                                    if (status) setProfileStatus(status);
                                                    const data = await window.electronAPI?.profileGetProfile?.();
                                                    if (data) setProfileData(data);
                                                } else {
                                                    setProfileError(result?.error || t('settings.profile.uploadFailed'));
                                                }
                                            } catch (e: any) {
                                                setProfileError(e.message || t('settings.profile.uploadFailed'));
                                            } finally {
                                                setProfileUploading(false);
                                            }
                                        }}
                                        disabled={profileUploading}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${profileUploading ? 'bg-bg-input text-text-tertiary cursor-wait border border-border-subtle' : 'bg-text-primary text-bg-main hover:opacity-90 shadow-sm'}`}
                                    >
                                        {profileUploading ? t('settings.profile.ingesting') : t('settings.profile.selectFile')}
                                    </button>
                                </div>

                                {profileError && (
                                    <div className="px-5 pb-4">
                                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-[11px] text-red-500 font-medium">
                                            <X size={12} /> {profileError}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* JD Upload Card */}
                        <div className="mt-5">
                            <div className={`rounded-xl transition-all border ${jdUploading ? 'border-blue-500/50 ring-1 ring-blue-500/20 bg-bg-item-surface' : profileData?.hasActiveJD ? 'border-blue-500/30 bg-blue-500/5' : 'border-border-subtle bg-bg-item-surface'}`}>
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-bg-input border border-border-subtle flex items-center justify-center text-text-tertiary shrink-0">
                                            {jdUploading ? <RefreshCw size={20} className="animate-spin text-blue-500" /> : <Briefcase size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-text-primary mb-0.5 truncate pr-4">
                                                {profileData?.hasActiveJD ? `${profileData.activeJD?.title} @ ${profileData.activeJD?.company}` : t('settings.profile.uploadJD')}
                                            </h4>
                                            {jdUploading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-[4px] w-[100px] bg-bg-input rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '50%' }} />
                                                    </div>
                                                    <span className="text-[10px] text-text-secondary tracking-wide">{t('settings.profile.parsingJD')}</span>
                                                </div>
                                            ) : profileData?.hasActiveJD ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold text-blue-500 px-1.5 py-0.5 bg-blue-500/10 rounded uppercase tracking-wide border border-blue-500/20">
                                                        {t('settings.profile.levelSuffix', { level: profileData.activeJD?.level || 'mid' })}
                                                    </span>
                                                    <div className="flex gap-1.5">
                                                        {profileData.activeJD?.technologies?.slice(0, 3).map((tech: string, i: number) => (
                                                            <span key={i} className="text-[10px] text-text-secondary">{tech}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-text-secondary">
                                                    {t('settings.profile.uploadJDHint')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {profileData?.hasActiveJD && (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        await window.electronAPI?.profileDeleteJD?.();
                                                        const data = await window.electronAPI?.profileGetProfile?.();
                                                        if (data) setProfileData(data);
                                                        setCompanyDossier(null);
                                                        setJdText('');
                                                    }}
                                                    className="px-2.5 py-2 rounded-full text-xs text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setProfileData((prev: any) => prev ? { ...prev, hasActiveJD: false, activeJD: null } : prev);
                                                        setJdText('');
                                                        setJdInputMode('paste');
                                                    }}
                                                    className="px-3 py-2 rounded-full text-xs font-medium bg-bg-input text-text-secondary hover:text-text-primary border border-border-subtle transition-all"
                                                >
                                                    {t('settings.profile.replace')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!profileData?.hasActiveJD && !jdUploading && (
                                    <div className="px-5 pb-4 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-tertiary">
                                            <span>{jdInputMode === 'paste' ? t('settings.profile.pasteJDText') : t('settings.profile.uploadJDFile')}</span>
                                            <button
                                                onClick={() => setJdInputMode(jdInputMode === 'paste' ? 'file' : 'paste')}
                                                className="text-blue-500 hover:text-blue-400 normal-case tracking-normal text-[11px]"
                                            >
                                                {jdInputMode === 'paste' ? t('settings.profile.orUploadPDF') : t('settings.profile.orPasteInstead')}
                                            </button>
                                        </div>

                                        {jdInputMode === 'paste' ? (
                                            <>
                                                <textarea
                                                    value={jdText}
                                                    onChange={(e) => setJdText(e.target.value)}
                                                    placeholder={t('settings.profile.pasteJDPlaceholder')}
                                                    rows={6}
                                                    className="w-full px-3 py-2 text-xs bg-bg-input border border-border-subtle rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50 resize-y"
                                                    disabled={jdUploading}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-text-tertiary">{t('settings.profile.charsCount', { count: jdText.trim().length })}</span>
                                                    <button
                                                        onClick={async () => {
                                                            setJdError('');
                                                            const text = jdText.trim();
                                                            if (text.length < 30) {
                                                                setJdError(t('settings.profile.jdMinLength'));
                                                                return;
                                                            }
                                                            try {
                                                                setJdUploading(true);
                                                                const result = await window.electronAPI?.profileUploadJDText?.(text);
                                                                if (result?.success) {
                                                                    const data = await window.electronAPI?.profileGetProfile?.();
                                                                    if (data) setProfileData(data);
                                                                    setJdText('');
                                                                } else {
                                                                    setJdError(result?.error || t('settings.profile.jdParseFailed'));
                                                                }
                                                            } catch (e: any) {
                                                                setJdError(e.message || t('settings.profile.jdParseFailed'));
                                                            } finally {
                                                                setJdUploading(false);
                                                            }
                                                        }}
                                                        disabled={jdUploading || jdText.trim().length < 30}
                                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${(jdUploading || jdText.trim().length < 30) ? 'bg-bg-input text-text-tertiary cursor-not-allowed border border-border-subtle' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'}`}
                                                    >
                                                        {t('settings.profile.saveJD')}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    setJdError('');
                                                    try {
                                                        const fileResult = await window.electronAPI?.profileSelectFile?.();
                                                        if (fileResult?.cancelled || !fileResult?.filePath) return;
                                                        setJdUploading(true);
                                                        const result = await window.electronAPI?.profileUploadJD?.(fileResult.filePath);
                                                        if (result?.success) {
                                                            const data = await window.electronAPI?.profileGetProfile?.();
                                                            if (data) setProfileData(data);
                                                        } else {
                                                            setJdError(result?.error || t('settings.profile.jdUploadFailed'));
                                                        }
                                                    } catch (e: any) {
                                                        setJdError(e.message || t('settings.profile.jdUploadFailed'));
                                                    } finally {
                                                        setJdUploading(false);
                                                    }
                                                }}
                                                disabled={jdUploading}
                                                className="w-full px-4 py-3 rounded-lg text-xs font-medium border border-dashed border-border-subtle text-text-secondary hover:text-text-primary hover:border-blue-500/50 transition-all"
                                            >
                                                {t('settings.profile.selectPDFDOCXTXT')}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {jdError && (
                                    <div className="px-5 pb-4">
                                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-[11px] text-red-500 font-medium">
                                            <X size={12} /> {jdError}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Custom Context Card */}
                        <div className="mt-5">
                            <div className="bg-bg-item-surface rounded-xl border border-border-subtle">
                                <div className="p-5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-bg-input border border-border-subtle flex items-center justify-center text-text-tertiary shrink-0">
                                            <Pencil size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-text-primary">{t('settings.profile.customContext')}</h4>
                                                {customNotesSaved && (
                                                    <span className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 uppercase tracking-wide flex items-center gap-1">
                                                        <Check size={8} /> {t('settings.profile.saved')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-text-secondary mt-0.5">
                                                {t('settings.profile.customContextDesc')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <textarea
                                            value={customNotes}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val.length > 4000) return;
                                                setCustomNotes(val);
                                                setCustomNotesSaved(false);
                                                if (customNotesDebounceRef.current) clearTimeout(customNotesDebounceRef.current);
                                                customNotesDebounceRef.current = setTimeout(async () => {
                                                    try {
                                                        await window.electronAPI?.profileSaveNotes?.(val);
                                                        setCustomNotesSaved(true);
                                                        setTimeout(() => setCustomNotesSaved(false), 2000);
                                                    } catch (_) {}
                                                }, 800);
                                            }}
                                            placeholder={t('settings.profile.customContextPlaceholder')}
                                            rows={6}
                                            className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all resize-none leading-relaxed"
                                        />
                                        <div className="flex items-center justify-between px-0.5">
                                            <p className="text-[10px] text-text-tertiary">
                                                {t('settings.profile.autoSavedAllModes')}
                                            </p>
                                            <span className={`text-[10px] tabular-nums ${customNotes.length > 3600 ? 'text-amber-500' : 'text-text-tertiary'}`}>
                                                {customNotes.length}/4000
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tavily Search API Card */}
                        <div className="mt-5">
                            <div className="bg-bg-item-surface rounded-xl border border-border-subtle">
                                <div className="p-5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-bg-input border border-border-subtle flex items-center justify-center text-emerald-500 shrink-0">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-text-primary">Tavily Search API</h4>
                                                {hasStoredTavilyKey && (
                                                    <span className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 uppercase tracking-wide">{t('settings.profile.connected')}</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-text-secondary mt-0.5">
                                                {t('settings.profile.tavilyDescription')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide block">{t('settings.profile.apiKey')}</label>
                                                {hasStoredTavilyKey && (
                                                    <button
                                                        onClick={handleRemoveTavilyKey}
                                                        className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded"
                                                        title={t('settings.profile.removeApiKey')}
                                                    >
                                                        <Trash2 size={10} strokeWidth={2} /> {t('common.remove')}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="password"
                                                value={tavilyApiKey}
                                                onChange={(e) => { setTavilyApiKey(e.target.value); setTavilyError(''); }}
                                                placeholder={hasStoredTavilyKey ? '••••••••••••' : t('settings.profile.tavilyPlaceholder')}
                                                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 transition-all"
                                            />
                                        </div>
                                        {tavilyError && (
                                            <p className="text-[10px] text-red-400 px-1">{tavilyError}</p>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (!tavilyApiKey.trim()) return;
                                                setTavilyError('');
                                                setTavilySaving(true);
                                                try {
                                                    const result = await window.electronAPI?.setTavilyApiKey?.(tavilyApiKey.trim());
                                                    if (result && !result.success) {
                                                        setTavilyError(result.error ?? t('settings.profile.saveApiKeyFailed'));
                                                    } else {
                                                        setHasStoredTavilyKey(true);
                                                        setTavilyApiKey('');
                                                    }
                                                } catch (e: any) {
                                                    setTavilyError(e?.message ?? t('settings.profile.saveApiKeyUnexpected'));
                                                } finally {
                                                    setTavilySaving(false);
                                                }
                                            }}
                                            disabled={tavilySaving || !tavilyApiKey.trim()}
                                            className={`w-full px-4 py-2 rounded-lg text-xs font-medium transition-all ${tavilySaving ? 'bg-bg-input text-text-tertiary cursor-wait' : !tavilyApiKey.trim() ? 'bg-bg-input text-text-tertiary cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'}`}
                                        >
                                            {tavilySaving ? t('settings.profile.saving') : t('settings.profile.saveApiKey')}
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-bg-input/50 rounded-lg">
                                        <Info size={12} className="text-text-tertiary shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-text-tertiary leading-relaxed">
                                            {t('settings.profile.tavilyHintPrefix')} <span className="text-emerald-500/80 hover:text-emerald-400 underline underline-offset-2 cursor-pointer" onClick={() => window.electronAPI?.openExternal?.('https://app.tavily.com/home')}>app.tavily.com</span>. {t('settings.profile.tavilyHintSuffix')} <code className="text-emerald-500/80">tvly-</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Research Section */}
                        {profileData?.hasActiveJD && profileData?.activeJD?.company && (
                            <div className="mt-5">
                                <div className="bg-bg-item-surface rounded-xl border border-border-subtle p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-bg-input border border-border-subtle flex items-center justify-center text-purple-500">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-text-primary">
                                                        {t('settings.profile.companyIntel')}: <span className="text-purple-400">{profileData.activeJD.company}</span>
                                                    </h4>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-widest uppercase bg-purple-500/15 text-purple-400 border border-purple-500/25">{t('settings.profile.betaBadge')}</span>
                                                </div>
                                                <p className="text-[11px] text-text-secondary mt-0.5">
                                                    {companyDossier ? t('settings.profile.researchComplete') : t('settings.profile.researchPrompt')}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                setCompanyResearching(true);
                                                setCompanySearchQuotaExhausted(false);
                                                try {
                                                    const result = await window.electronAPI?.profileResearchCompany?.(profileData.activeJD.company);
                                                    if (result?.success && result.dossier) {
                                                        setCompanyDossier(result.dossier);
                                                    }
                                                    if (result?.searchQuotaExhausted) {
                                                        setCompanySearchQuotaExhausted(true);
                                                    }
                                                } catch (e) {
                                                    console.error('Research failed:', e);
                                                } finally {
                                                    setCompanyResearching(false);
                                                }
                                            }}
                                            disabled={companyResearching}
                                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${companyResearching ? 'bg-bg-input text-text-tertiary cursor-wait border border-border-subtle' : 'bg-purple-600/10 text-purple-500 hover:bg-purple-600/20 border border-purple-500/20'}`}
                                        >
                                            {companyResearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                            {companyResearching ? t('settings.profile.researching') : companyDossier ? t('common.retry') : t('settings.profile.researchNow')}
                                        </button>
                                    </div>

                                    {companySearchQuotaExhausted && (
                                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-400 leading-relaxed">
                                            <span className="shrink-0 mt-[1px]">⚠</span>
                                            <span>
                                                {t('settings.profile.searchQuotaExhausted')} <span className="underline cursor-pointer" onClick={() => (window.electronAPI as any)?.openExternal?.('https://checkout.dodopayments.com/buy/pdt_0NbFixGmD8CSeawb5qvVl')}>{t('settings.profile.upgradeYourPlan')}</span>.
                                            </span>
                                        </div>
                                    )}

                                    {companyDossier && (
                                        <div className="space-y-4 border-t border-border-subtle pt-4 mt-2">
                                            {companyDossier.hiring_strategy && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-1">{t('settings.profile.hiringStrategy')}</div>
                                                    <p className="text-xs text-text-secondary leading-relaxed bg-bg-input p-3 rounded-lg">{companyDossier.hiring_strategy}</p>
                                                </div>
                                            )}

                                            {companyDossier.interview_focus && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide">{t('settings.profile.interviewFocus')}</div>
                                                        {companyDossier.interview_difficulty && (
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                companyDossier.interview_difficulty === 'easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                companyDossier.interview_difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                companyDossier.interview_difficulty === 'hard' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                                            }`}>
                                                                {companyDossier.interview_difficulty.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary leading-relaxed bg-bg-input p-3 rounded-lg">{companyDossier.interview_focus}</p>
                                                </div>
                                            )}

                                            {companyDossier.salary_estimates?.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-1">{t('settings.profile.salaryEstimates')}</div>
                                                    <div className="space-y-2 bg-bg-input p-3 rounded-lg">
                                                        {companyDossier.salary_estimates.map((s: any, i: number) => (
                                                            <div key={i} className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle last:border-0 last:pb-0 last:mb-0">
                                                                <span className="text-xs text-text-primary font-medium">{s.title} <span className="text-text-tertiary">({s.location})</span></span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-green-400">
                                                                        {s.currency} {s.min?.toLocaleString()} – {s.max?.toLocaleString()}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.confidence === 'high' ? 'bg-green-500/10 text-green-500 border-green-500/20' : s.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                                        {s.confidence?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.culture_ratings && typeof companyDossier.culture_ratings === 'object' &&
                                              Object.values(companyDossier.culture_ratings).some(v => typeof v === 'number' && (v as number) > 0) && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-2">{t('settings.profile.workCulture')}</div>
                                                    <div className="bg-bg-input p-3 rounded-lg">
                                                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-subtle">
                                                            <div>
                                                                <span className="text-2xl font-bold text-text-primary">{companyDossier.culture_ratings.overall.toFixed(1)}</span>
                                                                <span className="text-xs text-text-tertiary"> / 5</span>
                                                                {companyDossier.culture_ratings.review_count && (
                                                                    <div className="text-[10px] text-text-tertiary mt-0.5">{companyDossier.culture_ratings.review_count}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <StarRating value={companyDossier.culture_ratings.overall} size={14} />
                                                                {companyDossier.culture_ratings.data_sources?.length > 0 && (
                                                                    <div className="flex gap-1 mt-1 justify-end">
                                                                        {companyDossier.culture_ratings.data_sources.map((src: string, i: number) => (
                                                                            <span key={i} className="text-[9px] text-text-tertiary bg-bg-input px-1.5 py-0.5 rounded">{src}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                            {[
                                                                { label: t('settings.profile.workLifeBalance'), key: 'work_life_balance' },
                                                                { label: t('settings.profile.careerGrowth'), key: 'career_growth' },
                                                                { label: t('settings.profile.compensation'), key: 'compensation' },
                                                                { label: t('settings.profile.management'), key: 'management' },
                                                                { label: t('settings.profile.diversityInclusion'), key: 'diversity' },
                                                            ].map(({ label, key }) => {
                                                                const raw = (companyDossier.culture_ratings as any)[key];
                                                                const val: number = typeof raw === 'number' ? raw : 0;
                                                                return val > 0 ? (
                                                                    <div key={key} className="flex items-center justify-between gap-2">
                                                                        <span className="text-[10px] text-text-tertiary truncate">{label}</span>
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <StarRating value={val} size={9} />
                                                                            <span className="text-[10px] text-text-secondary font-medium">{val.toFixed(1)}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.employee_reviews?.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-2">{t('settings.profile.employeeReviews')}</div>
                                                    <div className="space-y-2">
                                                        {companyDossier.employee_reviews.map((r: any, i: number) => (
                                                            <div key={i} className="bg-bg-input p-3 rounded-lg">
                                                                <div className="flex items-start gap-2">
                                                                    <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${r.sentiment === 'positive' ? 'bg-green-400' : r.sentiment === 'mixed' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                                                                    <p className="text-xs text-text-secondary leading-relaxed italic">"{r.quote}"</p>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-2 ml-4">
                                                                    {r.role && <span className="text-[10px] text-text-tertiary">{r.role}</span>}
                                                                    {r.role && r.source && <span className="text-text-tertiary/40 text-[10px]">·</span>}
                                                                    {r.source && <span className="text-[10px] text-text-tertiary/70 bg-bg-input px-1.5 py-0.5 rounded">{r.source}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.critics?.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <AlertCircle size={11} className="text-orange-400" />
                                                        <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide">{t('settings.profile.commonComplaints')}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {companyDossier.critics.map((c: any, i: number) => (
                                                            <div key={i} className="bg-bg-input p-3 rounded-lg">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-semibold text-orange-400/90">{c.category}</span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                        c.frequency === 'widespread' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                        c.frequency === 'frequently' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                                    }`}>
                                                                        {c.frequency?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-text-secondary leading-relaxed">{c.complaint}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.benefits?.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <Gift size={11} className="text-emerald-400" />
                                                        <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide">{t('settings.profile.benefitsPerks')}</div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {companyDossier.benefits.map((b: string, i: number) => (
                                                            <span key={i} className="text-[11px] text-emerald-400/90 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">{b}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.core_values?.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-2">{t('settings.profile.coreValues')}</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {companyDossier.core_values.map((v: string, i: number) => (
                                                            <span key={i} className="text-[11px] text-purple-400/90 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">{v}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.recent_news && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-1">{t('settings.profile.recentNews')}</div>
                                                    <p className="text-xs text-text-secondary leading-relaxed bg-bg-input p-3 rounded-lg">{companyDossier.recent_news}</p>
                                                </div>
                                            )}

                                            {companyDossier.competitors?.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-wide mb-2">{t('settings.profile.competitors')}</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {companyDossier.competitors.map((c: string, i: number) => (
                                                            <span key={i} className="text-[11px] text-text-secondary px-2.5 py-1 rounded-full bg-bg-input flex items-center gap-1.5">
                                                                <Building2 size={10} className="text-text-tertiary" /> {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {companyDossier.sources?.length > 0 && (
                                                <div className="text-[10px] text-text-tertiary mt-2">
                                                    {t('settings.profile.sourcesCount', { count: companyDossier.sources.filter(Boolean).length })}
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15">
                                                <span className="text-purple-400/70 mt-px shrink-0">⚠</span>
                                                <p className="text-[10px] text-text-tertiary leading-relaxed">
                                                    <span className="font-semibold text-purple-400/80">{t('settings.profile.betaFeature')}</span> {t('settings.profile.companyDisclaimer')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <ProfileVisualizer profileData={profileData} />

                        {/* Salary Negotiation Script */}
                        {profileData?.hasActiveJD && (
                            <div className="mt-6 animated fadeIn">
                                <div className="relative rounded-xl border border-border-subtle overflow-hidden bg-bg-item-surface">
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                                        <Briefcase size={15} className="text-emerald-400" />
                                                    </div>
                                                    {negotiationScript && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-bg-item-surface" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-[13px] font-bold text-text-primary tracking-tight">{t('settings.profile.negotiationScript')}</h3>
                                                    <p className="text-[10px] text-text-tertiary mt-0.5 tracking-wide uppercase">
                                                        {negotiationScript ? t('settings.profile.tailoredFor', { company: profileData?.activeJD?.company || t('settings.profile.thisRole') }) : t('settings.profile.salaryCoaching')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {negotiationScript && (
                                                    <button
                                                        onClick={async () => {
                                                            setNegotiationGenerating(true);
                                                            setNegotiationError('');
                                                            try {
                                                                const result = await window.electronAPI?.profileGenerateNegotiation?.(true);
                                                                if (result?.success && result.script) {
                                                                    setNegotiationScript(result.script);
                                                                } else {
                                                                    setNegotiationError(result?.error || t('settings.profile.regenerateFailed'));
                                                                }
                                                            } catch { setNegotiationError(t('settings.profile.generationFailed')); }
                                                            finally { setNegotiationGenerating(false); }
                                                        }}
                                                        disabled={negotiationGenerating}
                                                        title={t('settings.profile.regenerateScript')}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-input transition-all border border-border-subtle"
                                                    >
                                                        <RefreshCw size={12} className={negotiationGenerating ? 'animate-spin' : ''} />
                                                    </button>
                                                )}
                                                {!negotiationScript && (
                                                    <button
                                                        onClick={async () => {
                                                            setNegotiationGenerating(true);
                                                            setNegotiationError('');
                                                            try {
                                                                const result = await window.electronAPI?.profileGenerateNegotiation?.(false);
                                                                if (result?.success && result.script) {
                                                                    setNegotiationScript(result.script);
                                                                } else {
                                                                    setNegotiationError(result?.error || t('settings.profile.generateFailed'));
                                                                }
                                                            } catch { setNegotiationError(t('settings.profile.generationFailed')); }
                                                            finally { setNegotiationGenerating(false); }
                                                        }}
                                                        disabled={negotiationGenerating}
                                                        className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                                                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
                                                    >
                                                        {negotiationGenerating ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                                                        {negotiationGenerating ? t('settings.profile.generating') : t('settings.profile.generateScript')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {negotiationError && (
                                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <AlertCircle size={12} className="text-red-400 shrink-0" />
                                                <p className="text-[11px] text-red-400">{negotiationError}</p>
                                            </div>
                                        )}

                                        {!negotiationScript && !negotiationGenerating && !negotiationError && (
                                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                                    <Briefcase size={20} className="text-emerald-500/50" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[12px] font-medium text-text-secondary">{t('settings.profile.noScriptYet')}</p>
                                                    <p className="text-[10px] text-text-tertiary mt-0.5">{t('settings.profile.noScriptHint')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {negotiationGenerating && (
                                            <div className="space-y-3 py-2">
                                                {[40, 70, 55].map((w, i) => (
                                                    <div key={i} className="h-3 rounded-full bg-bg-input animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
                                                ))}
                                                <div className="h-12 rounded-lg bg-bg-input animate-pulse mt-2" style={{ animationDelay: '450ms' }} />
                                            </div>
                                        )}

                                        {negotiationScript && !negotiationGenerating && (
                                            <div className="space-y-3">
                                                {negotiationScript.salary_range && (
                                                    <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(16,185,129,0.18)' }}>
                                                        <div>
                                                            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1">{t('settings.profile.targetCompensation')}</div>
                                                            <div className="text-xl font-bold tracking-tight" style={{ color: '#34d399' }}>
                                                                {negotiationScript.salary_range.currency} {negotiationScript.salary_range.min.toLocaleString()}
                                                                <span className="text-text-tertiary font-normal mx-2">–</span>
                                                                {negotiationScript.salary_range.max.toLocaleString()}
                                                            </div>
                                                            {negotiationScript.sources?.length > 0 && (
                                                                <div className="text-[9px] text-text-tertiary mt-1">{t('settings.profile.marketSources', { count: negotiationScript.sources.length })}</div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full tracking-wide ${
                                                            negotiationScript.salary_range.confidence === 'high' ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/25' :
                                                            negotiationScript.salary_range.confidence === 'medium' ? 'text-yellow-400 bg-yellow-500/15 border border-yellow-500/25' :
                                                            'text-text-tertiary bg-bg-input border border-border-subtle'
                                                        }`}>
                                                            {(negotiationScript.salary_range.confidence || 'low').toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}

                                                {[
                                                    {
                                                        step: '01',
                                                        label: t('settings.profile.opening'),
                                                        sublabel: t('settings.profile.openingHint'),
                                                        content: negotiationScript.opening_line,
                                                        accent: '#10b981',
                                                        accentBg: 'rgba(16,185,129,0.07)',
                                                        accentBorder: 'rgba(16,185,129,0.2)',
                                                        quote: true,
                                                    },
                                                    {
                                                        step: '02',
                                                        label: t('settings.profile.justifyAsk'),
                                                        sublabel: t('settings.profile.justifyAskHint'),
                                                        content: negotiationScript.justification,
                                                        accent: '#60a5fa',
                                                        accentBg: 'rgba(96,165,250,0.07)',
                                                        accentBorder: 'rgba(96,165,250,0.2)',
                                                        quote: false,
                                                    },
                                                    {
                                                        step: '03',
                                                        label: t('settings.profile.counterHold'),
                                                        sublabel: t('settings.profile.counterHoldHint'),
                                                        content: negotiationScript.counter_offer_fallback,
                                                        accent: '#fb923c',
                                                        accentBg: 'rgba(251,146,60,0.07)',
                                                        accentBorder: 'rgba(251,146,60,0.2)',
                                                        quote: true,
                                                    },
                                                ].filter(s => s.content).map((s) => ({ ...s, content: s.content.replace(/^["'"']+|["'"']+$/g, '').trim() })).map((s) => (
                                                    <div key={s.step} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${s.accentBorder}`, background: s.accentBg }}>
                                                        <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black tracking-widest" style={{ color: s.accent, opacity: 0.6 }}>{t('settings.profile.stepLabel', { step: s.step })}</span>
                                                                <span className="text-[11px] font-bold text-text-primary">{s.label}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => navigator.clipboard?.writeText(s.content)}
                                                                title={t('common.copyToClipboard')}
                                                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium transition-all hover:bg-bg-input text-text-tertiary hover:text-text-secondary"
                                                            >
                                                                <Check size={9} />
                                                                {t('common.copyToClipboard')}
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-text-tertiary px-3.5 pb-2 -mt-1 tracking-wide">{s.sublabel}</p>
                                                        <div className="mx-3.5 mb-3.5">
                                                            <p className={`text-[12px] leading-relaxed text-text-primary ${s.quote ? 'pl-3 italic' : ''}`}>
                                                                {s.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Premium Upgrade Modal */}
            <PremiumUpgradeModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                isPremium={isPremium}
                onActivated={async () => {
                    setIsPremium(true);
                    const status = await window.electronAPI?.profileGetStatus?.();
                    if (status) setProfileStatus(status);
                }}
                onDeactivated={() => {
                    setIsPremium(false);
                }}
            />
        </main>
    );
};

export default ProfileView;
