import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Command, Monitor, Mic, Settings, Zap, Key, User, Play, Image, ArrowUp, FileText, Sparkles, Search, ChevronUp, Copy,
    FileJson, MessageSquare, Briefcase, Eye, EyeOff, Ghost, ChevronDown, ChevronRight, HelpCircle, Upload, CheckCircle2,
    RefreshCw, Trash2, Check, ExternalLink, Volume2, Globe, Brain, Cpu, Calendar, Star, CreditCard, X, Pencil, Lightbulb,
    SlidersHorizontal, PointerOff, ArrowRight, LayoutGrid
} from 'lucide-react';
import { SiOpenai, SiGoogle } from 'react-icons/si';
import { useTranslation } from 'react-i18next';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import nativelyIcon from '../icon.png';

// ----------------------
// Animations & Mocks
// ----------------------

const MOCK_BUTTONS = [
    { icon: Pencil,        labelKey: 'help.mock.whatToAnswer',      kbd: '⌘1', color: 'blue'    },
    { icon: MessageSquare, labelKey: 'help.mock.clarify',           kbd: '⌘2', color: 'indigo'  },
    { icon: RefreshCw,     labelKey: 'help.mock.recap',             kbd: '⌘7', color: 'amber'   },
    { icon: HelpCircle,    labelKey: 'help.mock.followUpQuestion',  kbd: '⌘4', color: 'teal'    },
    { icon: Zap,           labelKey: 'help.mock.answer',            kbd: '⌘5', color: 'emerald' },
] as const;

const colorMap: Record<string, string> = {
    blue:    'bg-blue-500/10 text-blue-500 border-blue-500/25',
    indigo:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    amber:   'bg-amber-500/10 text-amber-500 border-amber-500/25',
    teal:    'bg-teal-500/10 text-teal-500 border-teal-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
};

const MockAppInterface = () => {
    const { t } = useTranslation();
    const [activeBtn, setActiveBtn] = useState(0);
    const isLight = useResolvedTheme() === 'light';

    useEffect(() => {
        const id = setInterval(() => setActiveBtn(i => (i + 1) % MOCK_BUTTONS.length), 1600);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col items-center w-full max-w-[600px] mx-auto opacity-100 relative h-[380px] overflow-hidden">
            <div className="flex flex-col items-center w-[600px] transform scale-[0.8] origin-top absolute top-0 pt-2">
                {/* Top Pill Replica */}
                <div className="flex justify-center mb-2 select-none z-50">
                    <div className="flex items-center gap-2 rounded-full backdrop-blur-md pl-1.5 pr-1.5 py-1.5 bg-bg-item-surface border border-border-subtle shadow-sm">
                        {/* Logo Button */}
                        <div className="w-8 h-8 rounded-full bg-bg-item-active flex items-center justify-center border border-border-muted overflow-hidden">
                            <img
                                src={nativelyIcon}
                                alt="Natively"
                                className="w-[20px] h-[20px] object-contain"
                                style={{ filter: isLight ? 'brightness(0)' : 'brightness(0) invert(1)', opacity: 0.9 }}
                            />
                        </div>
                        {/* Center Segment */}
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-item-surface text-text-primary text-[12px] font-medium border border-border-muted">
                            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
                            <span className="tracking-wide opacity-80">{t('help.mock.hide')}</span>
                        </div>
                        {/* Stop Button */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-item-active text-text-primary border border-border-muted">
                            <div className="w-3.5 h-3.5 rounded-[3px] bg-current opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Main Window */}
                <div className="relative w-full backdrop-blur-[30px] border border-border-subtle rounded-[24px] overflow-hidden flex flex-col bg-bg-item-surface shadow-2xl">

                    {/* Rolling Transcript Bar — replica of RollingTranscript.tsx */}
                    <div className="relative w-[90%] mx-auto pt-2">
                        <div
                            className="overflow-hidden whitespace-nowrap text-right"
                            style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
                        >
                            <span className="text-text-secondary inline-flex items-center text-[13px] italic leading-7 opacity-60">
                                {t('help.mock.transcriptSnippet')}
                                <span className="inline-flex items-center ml-2">
                                    <span className="w-1 h-1 bg-green-500/60 rounded-full animate-pulse" />
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Chat History */}
                    <div className="p-4 space-y-3 pb-2 flex-1 overflow-y-auto max-h-[220px]">
                        <div className="flex justify-start">
                            <div className="max-w-[85%] px-4 py-3 text-[14px] leading-relaxed font-normal text-text-primary">
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary opacity-70">
                                    {t('common.interviewer')}
                                </div>
                                <span className="text-text-secondary italic">{t('help.mock.sampleQuestion')}</span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="max-w-[72.25%] px-[13.6px] py-[10.2px] text-[14px] leading-relaxed whitespace-pre-wrap bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-[20px] rounded-tr-[4px] shadow-sm font-medium">
                                <span className="font-semibold text-emerald-500 block mb-1 text-[12px]">🎯 {t('help.mock.answer')}</span>
                                {t('help.mock.sampleAnswer')}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions — cycling highlight */}
                    <div className="flex flex-nowrap justify-center items-center gap-1.5 px-4 pb-3 pt-3 overflow-x-hidden">
                        {MOCK_BUTTONS.map((btn, idx) => {
                            const Icon = btn.icon;
                            const isActive = activeBtn === idx;
                            return (
                                <button key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-300 whitespace-nowrap shrink-0 ${isActive ? colorMap[btn.color] : 'bg-bg-item-surface text-text-primary border-border-subtle'}`}>
                                    <Icon className="w-3 h-3 opacity-70" /> {t(btn.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 pt-0">
                        <div className="relative">
                            <div className="w-full border border-border-subtle rounded-xl pl-3 pr-10 py-2.5 text-[13px] leading-relaxed bg-bg-input shadow-inner flex items-center h-[46px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-[13px] text-text-secondary opacity-60">
                                    <span className="hidden sm:inline">{t('help.mock.askPrefix')}</span>
                                    <div className="flex items-center gap-1 opacity-80 sm:ml-0.5">
                                        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-sans min-w-[20px] text-center bg-bg-item-surface border-border-subtle text-text-primary shadow-sm">⌘</kbd>
                                        <span className="text-[10px]">+</span>
                                        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-sans min-w-[20px] text-center bg-bg-item-surface border-border-subtle text-text-primary shadow-sm">⇧</kbd>
                                        <span className="text-[10px]">+</span>
                                        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-sans min-w-[20px] text-center bg-bg-item-surface border-border-subtle text-text-primary shadow-sm">H</kbd>
                                    </div>
                                    <span className="hidden sm:inline">{t('help.mock.selectiveScreenshotSuffix')}</span>
                                </div>
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 text-text-primary">
                                <span className="text-[10px]">↵</span>
                            </div>
                        </div>
                        {/* Bottom Row */}
                        <div className="flex items-center justify-between mt-3 px-0.5">
                            <div className="flex items-center gap-1.5">
                                <button className="flex items-center gap-2 px-3 py-1.5 border border-border-subtle rounded-lg bg-bg-item-surface text-text-primary text-xs font-medium w-[140px] shadow-sm">
                                    <span className="truncate min-w-0 flex-1 text-left">Gemini 3.1 Flash</span>
                                    <ChevronDown size={14} className="shrink-0 opacity-70" />
                                </button>
                                <div className="h-3 w-px bg-border-subtle mx-1" />
                                <button className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg bg-bg-item-surface text-text-primary shadow-sm">
                                    <SlidersHorizontal size={14} className="opacity-70" />
                                </button>
                                <div className="h-3 w-px bg-border-subtle mx-1" />
                                <button className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg bg-bg-item-surface text-text-primary shadow-sm">
                                    <PointerOff size={14} className="opacity-70" />
                                </button>
                            </div>
                            <button className="w-7 h-7 rounded-full flex items-center justify-center bg-bg-item-surface border border-border-subtle shadow-sm text-text-secondary">
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockMeetingInterfaceAnim = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState('summary');

    useEffect(() => {
        const tabs = ['summary', 'transcript', 'usage'];
        let i = 0;
        const interval = setInterval(() => { i = (i + 1) % tabs.length; setTab(tabs[i]); }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full aspect-[3/2] bg-bg-secondary rounded-[20px] border border-border-subtle overflow-hidden flex flex-col relative shadow-lg select-none pointer-events-none">

            {/* Header */}
            <div className="px-6 pt-5 pb-0 shrink-0">
                <div className="text-xs text-text-tertiary font-medium mb-0.5">{t('help.mock.todayDuration')}</div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">{t('help.mock.systemDesignInterview')}</h1>
            </div>

            {/* Tabs row */}
            <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0">
                <div className="p-1 rounded-xl inline-flex items-center gap-0.5 bg-bg-input border border-border-subtle">
                    {['summary', 'transcript', 'usage'].map((tabName) => (
                        <button key={tabName} className={`relative px-3 py-1 text-[12px] font-medium rounded-lg z-10 transition-colors ${tab === tabName ? 'text-text-primary bg-bg-elevated shadow-sm border border-border-subtle' : 'text-text-tertiary'}`}>
                            {t(`help.mock.tabs.${tabName}`)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary opacity-70">
                    <Copy size={12} /> {t('help.mock.copyFull', { tab: t(`help.mock.tabs.${tab}`) })}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden px-6 pb-14">
                <AnimatePresence mode="wait">
                    {tab === 'summary' && (
                        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            {/* Overview — plain paragraph + border-b, matches MeetingDetails prose block */}
                            <div className="mb-5 pb-5 border-b border-border-subtle">
                                <p className="text-sm text-text-secondary leading-relaxed">{t('help.mock.summaryText')}</p>
                            </div>
                            {/* Action Items — h2 heading + dot-bullet list, matches MeetingDetails exactly */}
                            <section className="mb-6">
                                <h2 className="text-base font-semibold text-text-primary mb-3">{t('help.mock.actionItems')}</h2>
                                <ul className="space-y-3">
                                    {[t('help.mock.actionItem1'), t('help.mock.actionItem2')].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-text-secondary shrink-0" />
                                            <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                            {/* Key Points */}
                            <section>
                                <h2 className="text-base font-semibold text-text-primary mb-3">{t('help.mock.keyPoints')}</h2>
                                <ul className="space-y-3">
                                    {[t('help.mock.keyPoint1'), t('help.mock.keyPoint2')].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-text-secondary shrink-0" />
                                            <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </motion.div>
                    )}
                    {tab === 'transcript' && (
                        <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                            {/* Matches MeetingDetails: speaker + timestamp inline, then text below — no card/border */}
                            {[
                                { speaker: t('help.mock.them'), time: '10:32', text: t('help.mock.transcriptQ') },
                                { speaker: t('help.mock.me'),   time: '10:33', text: t('help.mock.transcriptA') },
                            ].map((entry, i) => (
                                <div key={i}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-text-secondary">{entry.speaker}</span>
                                        <span className="text-xs text-text-tertiary font-mono">{entry.time}</span>
                                    </div>
                                    <p className="text-text-secondary text-sm leading-relaxed">{entry.text}</p>
                                </div>
                            ))}
                        </motion.div>
                    )}
                    {tab === 'usage' && (
                        <motion.div key="usage" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                            <div className="flex justify-end pt-2">
                                <div className="bg-accent-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[75%] text-xs leading-relaxed shadow-sm">
                                    {t('help.mock.redisQuestion')}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-bg-input flex items-center justify-center border border-border-subtle shrink-0">
                                    <img src={nativelyIcon} alt="AI" className="w-3 h-3 opacity-50 object-contain force-black-icon" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-text-tertiary mb-1 font-medium">10:35 AM</div>
                                    <p className="text-xs text-text-secondary leading-relaxed">{t('help.mock.redisAnswer')}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating ask bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
                <div className="w-full max-w-[440px] flex items-center relative">
                    <div className="w-full pl-4 pr-11 py-2.5 bg-bg-item-surface shadow-sm border border-border-subtle rounded-full text-xs text-text-tertiary/70">{t('help.mock.askMeeting')}</div>
                    <div className="absolute right-2 p-1.5 rounded-full bg-bg-item-active text-text-primary border border-border-subtle shadow-sm">
                        <ArrowUp size={13} className="rotate-45" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockMeetingChatAnim = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full bg-bg-secondary rounded-[20px] border border-border-subtle overflow-hidden flex flex-col select-none pointer-events-none shadow-lg max-h-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
                <div className="flex items-center gap-2 text-text-tertiary">
                    <img src={nativelyIcon} className="w-3.5 h-3.5 force-black-icon opacity-50" alt="logo" />
                    <span className="text-[13px] font-medium">{t('meetingChat.title')}</span>
                </div>
                <X size={16} className="text-text-tertiary" />
            </div>

            {/* Messages */}
            <div className="p-5 space-y-5">
                <div className="flex justify-end">
                    <div className="bg-accent-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] text-sm leading-relaxed shadow-sm">
                        {t('help.mock.apiDependenciesQuestion')}
                    </div>
                </div>
                <div className="flex flex-col items-start">
                    <p className="text-sm text-text-primary leading-relaxed max-w-[85%]">
                        {t('help.mock.apiDependenciesAnswerPrefix')} <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-[12px] font-mono text-text-primary border border-border-subtle">Stripe Payment Intents</code> {t('help.mock.apiDependenciesAnswerSuffix')}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 text-xs text-text-tertiary">
                        <Copy size={13} /> {t('meetingChat.copyMessage')}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockSearchPillAnim = () => {
    const { t } = useTranslation();
    const isLight = useResolvedTheme() === 'light';
    return (
        <div className="flex justify-center flex-col items-center py-10 rounded-[26px] border border-border-subtle relative overflow-hidden h-[340px] bg-bg-card">
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]" />
            <motion.div 
                 initial={{ y: -10, opacity: 0, scale: 0.95 }}
                 animate={{ y: 0, opacity: 1, scale: 1 }}
                 className={`w-[480px] ${isLight ? 'bg-[#F2F2F7]/90' : 'bg-[#161618]/90'} backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-md overflow-hidden z-10 transform-gpu relative border border-border-subtle`}
             >
                 {/* Input Row */}
                 <div className="relative flex items-center border-b border-border-muted">
                     <div className="absolute left-3 flex items-center pointer-events-none">
                         <Search size={14} className="text-text-tertiary" />
                     </div>
                     <div className="w-full bg-transparent pl-9 pr-4 py-2.5 text-[13px] text-text-primary outline-none flex items-center h-[38px]">
                        <span className="opacity-90">{t('help.mock.systemQuery')}</span><motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-[1.5px] h-3.5 bg-blue-500 ml-[2px] inline-block" />
                     </div>
                 </div>

                 {/* Results Panel mock */}
                 <div className="w-[480px]">
                     <div className="py-2">
                         {/* Explore Section */}
                         <div className="px-3 py-1">
                             <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                                 {t('topSearchPill.explore')}
                             </div>

                             <div className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left bg-bg-item-active transition-colors">
                                 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                                     <Sparkles size={12} className="text-white" />
                                 </div>
                                 <span className="text-[13px] text-text-primary truncate">
                                     {t('help.mock.systemQuery')}
                                 </span>
                             </div>

                             <div className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-bg-item-hover transition-colors">
                                 <div className="w-6 h-6 rounded-md bg-bg-item-surface flex items-center justify-center shrink-0 border border-border-subtle">
                                     <Search size={12} className="text-text-secondary" />
                                 </div>
                                 <span className="text-[13px] text-text-secondary">
                                     {t('topSearchPill.searchFor')} <span className="text-text-primary">"{t('help.mock.systemQuery')}"</span>
                                 </span>
                             </div>
                         </div>

                         {/* Sessions Section */}
                         <div className="px-3 py-1 mt-1">
                             <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                                 {t('topSearchPill.sessions')}
                             </div>

                             <div className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-bg-item-hover transition-colors">
                                 <div className="w-6 h-6 rounded-md bg-bg-item-surface flex items-center justify-center shrink-0 border border-border-subtle">
                                     <FileText size={12} className="text-text-secondary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="text-[13px] text-text-primary truncate">
                                         {t('help.mock.systemDesignInterview')}
                                     </div>
                                     <div className="text-[11px] text-text-tertiary">
                                         {t('help.mock.jan12')}
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-bg-item-hover transition-colors">
                                 <div className="w-6 h-6 rounded-md bg-bg-item-surface flex items-center justify-center shrink-0 border border-border-subtle">
                                     <FileText size={12} className="text-text-secondary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="text-[13px] text-text-primary truncate">
                                         {t('help.mock.systemArchitectureSync')}
                                     </div>
                                     <div className="text-[11px] text-text-tertiary">
                                         {t('help.mock.jan08')}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
            </motion.div>
        </div>
    );
};

const MockPermissionsAnim = () => {
    const { t } = useTranslation();
    const [toggled, setToggled] = useState(false);
    useEffect(() => {
        const i = setInterval(() => setToggled(t => !t), 2500);
        return () => clearInterval(i);
    }, []);

    return (
        <div className="flex justify-center flex-col items-center gap-4 py-8 bg-bg-card rounded-xl border border-border-subtle relative overflow-hidden h-[240px]">
             <div className="w-[300px] bg-bg-elevated border border-border-subtle rounded-xl shadow-lg p-4 z-10">
                <div className="flex items-center gap-3 mb-4 border-b border-border-subtle pb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                        <Monitor className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-sm text-text-primary">{t('help.sections.permissions.screenRecording')}</div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src={nativelyIcon} alt="Natively" className="w-6 h-6 object-contain rounded drop-shadow-sm opacity-90" />
                        <span className="text-text-primary text-sm font-medium">Natively</span>
                    </div>
                    
                    <motion.div 
                        initial={false}
                        animate={{ backgroundColor: toggled ? '#3b82f6' : 'var(--bg-toggle-switch)' }}
                        className="w-10 h-6 rounded-full relative shadow-inner"
                    >
                        <motion.div 
                            initial={false}
                            animate={{ x: toggled ? 18 : 2 }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-md"
                        />
                    </motion.div>
                </div>
            </div>
            <div className="text-xs text-text-secondary text-center max-w-[280px]">
                {t('help.mock.permissionsHint')}
            </div>
        </div>
    );
};

const MockPillControlsAnim = () => {
    const { t } = useTranslation();
    const [windowShowing, setWindowShowing] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => setWindowShowing(prev => !prev), 2400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-4 space-y-2.5">
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-1 mb-3">{t('help.mock.pillControls')}</div>

            {/* Logo → Launcher */}
            <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-xl">
                <div className="w-8 h-8 rounded-full bg-bg-item-active flex items-center justify-center border border-border-muted shrink-0 shadow-sm">
                    <img src={nativelyIcon} alt="Logo" className="w-[18px] h-[18px] object-contain force-black-icon opacity-90" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0"
                    >
                        <span className="relative flex h-[7px] w-[7px] shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-400" />
                        </span>
                        <span className="text-[11px] font-medium text-emerald-500">{t('launcher.meetingOngoing')}</span>
                    </motion.div>
                    <span className="text-[11px] text-text-secondary leading-snug">{t('help.mock.logoLauncherHint')}</span>
                </div>
            </div>

            {/* Hide / Show toggle */}
            <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-xl">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-item-active border border-border-muted shrink-0 w-[68px]">
                    <motion.div animate={{ rotate: windowShowing ? 0 : 180 }} transition={{ duration: 0.35, ease: 'easeInOut' }}>
                        <ChevronUp className="w-3 h-3 text-text-secondary" />
                    </motion.div>
                    <span className="text-[11px] text-text-secondary font-medium">{windowShowing ? t('help.mock.hide') : t('help.mock.show')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative w-14 h-9 shrink-0">
                        <motion.div
                            animate={{ opacity: windowShowing ? 1 : 0 }}
                            transition={{ duration: 0.35 }}
                            className="absolute inset-0 rounded-lg border border-border-subtle bg-bg-item-surface flex items-center justify-center"
                        >
                            <Eye className="w-3.5 h-3.5 text-text-tertiary" />
                        </motion.div>
                        <motion.div
                            animate={{ opacity: windowShowing ? 0 : 0.4 }}
                            transition={{ duration: 0.35 }}
                            className="absolute inset-0 rounded-lg border border-dashed border-border-subtle flex items-center justify-center"
                        >
                            <EyeOff className="w-3.5 h-3.5 text-text-tertiary" />
                        </motion.div>
                    </div>
                    <span className="text-[11px] text-text-secondary leading-snug">{t('help.mock.hideHintPrefix')} <strong className="text-text-primary">{t('help.mock.purelyStealth')}</strong></span>
                </div>
            </div>

            {/* Stop → end session */}
            <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-xl">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-[2.5px] bg-red-400" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.span
                        animate={{ opacity: [1, 0.25, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-[11px] text-red-400 font-medium shrink-0"
                    >
                        {t('help.mock.sessionEnds')}
                    </motion.span>
                    <span className="text-[11px] text-text-tertiary">{t('help.mock.returnsToLauncher')}</span>
                </div>
            </div>

        </div>
    );
};

const MockFastModeAnim = () => {
    const { t } = useTranslation();
    return (
        <div className="flex justify-center items-center py-8 bg-bg-card rounded-xl border border-border-subtle relative overflow-hidden h-[240px]">
            <div className="flex flex-col items-center gap-4 z-10">
                <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                    animate={{ rotate: 360 }}
                    transition={{ ease: "linear", duration: 8, repeat: Infinity }}
                >
                    <Zap className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                    <div className="font-bold text-lg text-text-primary">{t('help.mock.fastModeEnabled')}</div>
                    <div className="text-xs text-text-secondary mt-1">{t('help.mock.routingViaGroq')}</div>
                </div>
            </div>
            
            {/* Background pulses */}
            <motion.div 
                className="absolute inset-0 border-[6px] border-orange-500/20 rounded-xl"
                animate={{ scale: [1, 1.05, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </div>
    );
};

// Audio Mock Animations

const getBadgeStyle = (color?: string) => {
    switch (color) {
        case 'blue': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'orange': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'purple': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'teal': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
        case 'cyan': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
        case 'indigo': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'green': return 'bg-green-500/10 text-green-500 border-green-500/20';
        default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
};

const getIconStyle = (color?: string, isSelectedItem: boolean = false) => {
    if (isSelectedItem) return 'bg-accent-primary text-white shadow-sm';
    switch (color) {
        case 'blue': return 'bg-blue-500/10 text-blue-600';
        case 'orange': return 'bg-orange-500/10 text-orange-600';
        case 'purple': return 'bg-purple-500/10 text-purple-600';
        case 'teal': return 'bg-teal-500/10 text-teal-600';
        case 'cyan': return 'bg-cyan-500/10 text-cyan-600';
        case 'indigo': return 'bg-indigo-500/10 text-indigo-600';
        case 'green': return 'bg-green-500/10 text-green-600';
        default: return 'bg-gray-500/10 text-gray-600';
    }
};

const MockProviderSelectionAnim = () => {
    const { t } = useTranslation();
    const isLight = useResolvedTheme() === 'light';
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        const i = setInterval(() => setIsOpen(o => !o), 4000);
        return () => clearInterval(i);
    }, []);

    const options = [
        { id: 'deepgram', label: 'Deepgram Nova-3', badge: t('settings.audio.saved'), recommended: true, desc: t('settings.audio.deepgramDesc'), color: 'purple', icon: <Mic size={14} /> },
        { id: 'google', label: 'Google Cloud', badge: t('settings.audio.saved'), recommended: false, desc: t('settings.audio.googleDesc'), color: 'blue', icon: <Mic size={14} /> },
        { id: 'groq', label: 'Groq Whisper', badge: '', recommended: false, desc: t('help.mock.groqWhisperDesc'), color: 'orange', icon: <Mic size={14} /> },
        { id: 'azure', label: 'Azure Speech', badge: '', recommended: false, desc: t('help.mock.azureSpeechDesc'), color: 'teal', icon: <Mic size={14} /> },
        { id: 'soniox', label: 'Soniox', badge: '', recommended: false, desc: t('help.mock.sonioxDesc'), color: 'cyan', icon: <Mic size={14} /> },
        { id: 'ibm', label: 'IBM Watson', badge: '', recommended: false, desc: t('help.mock.ibmDesc'), color: 'indigo', icon: <Mic size={14} /> },
    ];
    const selected = options[0];

    return (
        <div className="flex justify-center flex-col items-center py-6 bg-bg-card rounded-xl border border-border-subtle relative overflow-hidden h-[300px]">
             <div className="w-[340px] flex flex-col gap-2 relative z-10 font-sans">
                <label className="text-xs font-medium text-text-secondary">{t('settings.audio.speechProvider')}</label>
                <div className="relative">
                    <button className={`w-full group bg-bg-input border border-border-subtle shadow-sm rounded-xl p-2.5 pr-3.5 flex items-center justify-between transition-all duration-200 outline-none ${isOpen ? 'ring-2 ring-accent-primary/20 border-accent-primary/50' : 'hover:shadow-md'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 transform ${getIconStyle(selected.color, false)}`}>
                                {selected.icon}
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-semibold text-text-primary truncate leading-tight">{selected.label}</span>
                                    {selected.badge && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ml-2 ${getBadgeStyle('green')}`}>{selected.badge}</span>}
                                    {selected.recommended && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ml-2 ${getBadgeStyle(selected.color)}`}>{t('settings.audio.recommended')}</span>}
                                </div>
                                <span className="text-[11px] text-text-tertiary truncate block leading-tight mt-0.5">{selected.desc}</span>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary transition-transform duration-300 group-hover:bg-bg-input ${isOpen ? 'rotate-180 bg-bg-input text-text-primary' : ''}`}>
                            <ChevronDown size={14} strokeWidth={2.5} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={"absolute top-full left-0 w-full mt-2 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-20 bg-bg-elevated border border-border-subtle"}
                            >
                                 <div className="max-h-[170px] overflow-hidden relative" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
                                    <motion.div 
                                        className="p-1.5 space-y-0.5"
                                        animate={{ y: [0, 0, -110, -110, 0, 0] }}
                                        transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity }}
                                    >
                                        {options.map((option) => {
                                            const isSelected = selected.id === option.id;
                                            return (
                                                <div key={option.id} className={`w-full rounded-[10px] p-2 flex items-center gap-3 transition-all duration-200 group relative cursor-pointer ${isSelected ? 'bg-bg-item-active shadow-inner' : 'hover:bg-bg-item-hover'}`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-95 group-hover:scale-100'} ${getIconStyle(option.color, false)}`}>
                                                        {option.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={"text-[13px] font-medium transition-colors text-text-primary"}>{option.label}</span>
                                                                {option.badge && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${getBadgeStyle('green')}`}>{option.badge}</span>}
                                                                {option.recommended && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${getBadgeStyle(option.color)}`}>{t('settings.audio.recommended')}</span>}
                                                            </div>
                                                            {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={14} className="text-accent-primary" strokeWidth={3} /></motion.div>}
                                                        </div>
                                                        <span className={"text-[11px] block truncate transition-colors text-text-secondary"}>{option.desc}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                 </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Animated Cursor */}
            <motion.div 
                className="absolute w-5 h-5 z-30 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                animate={{ 
                    x: isOpen ? 100 : 150,
                    y: isOpen ? 80 : 30
                }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 3.35a.5.5 0 0 0-.85.35Z"/></svg>
            </motion.div>
        </div>
    );
};

const MockApiKeyFlowAnim = () => {
    const { t } = useTranslation();
    const [stage, setStage] = useState(0); // 0: enter key, 1: saving, 2: test, 3: connected, 4: trash
    useEffect(() => {
        const i = setInterval(() => setStage(s => (s + 1) % 5), 2000);
        return () => clearInterval(i);
    }, []);

    return (
        <div className="flex justify-center flex-col items-center gap-2 py-8 bg-bg-card rounded-xl border border-border-subtle relative overflow-hidden h-[240px]">
             <div className="w-[380px] space-y-2 relative z-10">
                <label className="text-xs font-medium text-text-secondary block">Groq API Key</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary flex items-center shadow-inner">
                        <span className={stage > 0 ? "opacity-100" : "opacity-40"}>
                            {stage > 0 ? "gsk_a8B2c..." : t('help.mock.enterApiKey')}
                        </span>
                        {stage === 0 && <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-4 bg-accent-primary ml-0.5" />}
                    </div>
                    <div className="px-5 py-2 rounded-lg text-xs font-medium bg-bg-elevated border border-border-subtle flex items-center justify-center transition-colors shadow-sm">
                        {stage === 1 ? <Check size={14} className="text-green-500" /> : t('common.save')}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <div className="text-xs bg-bg-input px-3 py-1.5 rounded-md flex items-center gap-2 border border-border-subtle shadow-sm">
                            {stage === 2 ? <RefreshCw size={12} className="text-blue-500 animate-spin" /> : stage > 2 ? <Check size={12} className="text-green-500" /> : <Play size={12} className="text-text-tertiary" />}
                            <span className={stage > 2 ? "text-green-500" : "text-text-primary"}>
                                {stage === 2 ? t('settings.audio.testing') : stage > 2 ? t('settings.profile.connected') : t('help.mock.testApiKey')}
                            </span>
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg ${stage === 4 ? 'bg-red-500/20 text-red-500' : 'text-text-tertiary'} border border-transparent`}>
                        <Trash2 size={16} />
                    </div>
                </div>
             </div>
             
             {/* Animated Cursor */}
            <motion.div 
                className="absolute w-5 h-5 z-20 drop-shadow-lg"
                animate={{ 
                    x: stage === 0 ? 0 : stage === 1 ? 140 : stage === 2 ? -80 : stage === 4 ? 170 : 170,
                    y: stage === 0 ? 20 : stage === 1 ? 20 : stage === 2 ? 65 : stage === 4 ? 65 : 65
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 3.35a.5.5 0 0 0-.85.35Z"/></svg>
            </motion.div>
        </div>
    );
};

const ElevenLabsPermissionsMock = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full flex justify-center py-4 bg-bg-elevated rounded-xl border border-border-subtle mb-3 mt-2 shadow-sm">
             <div className="flex items-center justify-between w-full max-w-[360px]">
                <span className="text-[14.5px] text-text-primary font-medium tracking-tight">Speech to Text</span>
                <div className="flex items-center bg-bg-main p-[3px] rounded-lg border border-border-subtle shadow-inner">
                    <div className="px-3.5 py-1.5 text-[13px] font-medium text-text-secondary">{t('help.mock.noAccess')}</div>
                    <div className="px-3.5 py-1.5 text-[13px] font-medium text-black bg-white rounded-md shadow-sm relative z-10 before:absolute before:inset-0 before:rounded-md before:border-[1.5px] before:border-black before:opacity-90 before:-m-[1px]">{t('help.mock.access')}</div>
                </div>
            </div>
        </div>
    );
};

// ----------------------
// Reusable Components
// ----------------------

interface AccordionSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-200 bg-bg-card border-border-subtle shadow-sm`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-bg-item-surface group`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-bg-item-surface border border-border-subtle group-hover:border-border-muted transition-colors text-text-secondary`}>
                        {icon}
                    </div>
                    <span className={`font-semibold text-sm text-text-primary`}>{title}</span>
                </div>
                {isOpen ? <ChevronDown className="w-5 h-5 text-text-tertiary" /> : <ChevronRight className="w-5 h-5 text-text-tertiary" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className={`p-5 border-t border-border-subtle text-sm leading-relaxed text-text-secondary`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SetupGuide = () => {
    const { t } = useTranslation();
    const steps = [
        {
            title: t('help.quickStart.steps.permissions.title'),
            desc: t('help.quickStart.steps.permissions.desc'),
        },
        {
            title: t('help.quickStart.steps.audio.title'),
            desc: t('help.quickStart.steps.audio.desc'),
        },
        {
            title: t('help.quickStart.steps.ai.title'),
            desc: t('help.quickStart.steps.ai.desc'),
        },
        {
            title: t('help.quickStart.steps.done.title'),
            desc: null,
        },
    ];

    const hotkeys = [
        { label: t('help.quickStart.hotkeys.toggle'), kbd: '⌘H' },
        { label: t('help.quickStart.hotkeys.screenshot'), kbd: '⌘⇧H' },
        { label: t('help.quickStart.hotkeys.chat'), kbd: '⌘K' },
    ];

    return (
        <div className="mb-10">
            <div className="mb-7">
                <h3 className="text-[20px] font-bold text-text-primary tracking-tight leading-tight">{t('help.quickStart.title')}</h3>
                <p className="text-[13px] text-text-tertiary mt-0.5">{t('help.quickStart.subtitle')}</p>
            </div>

            <div>
                {steps.map((step, i) => {
                    const isLast = i === steps.length - 1;
                    return (
                        <div key={i} className="flex gap-4">
                            {/* Step indicator column */}
                            <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
                                <div className="w-7 h-7 rounded-full bg-accent-primary flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-bold text-white leading-none">{i + 1}</span>
                                </div>
                                {!isLast && (
                                    <div className="w-px bg-border-subtle flex-1" style={{ minHeight: 32, marginTop: 5, marginBottom: 5 }} />
                                )}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-6'}`} style={{ paddingTop: 3 }}>
                                <p className="text-[14px] font-semibold text-text-primary leading-snug">{step.title}</p>
                                {step.desc && (
                                    <p className="text-[13px] text-text-secondary leading-relaxed mt-0.5">{step.desc}</p>
                                )}
                                {isLast && (
                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                        {hotkeys.map((h, hi) => (
                                            <React.Fragment key={h.kbd}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[12px] text-text-secondary">{h.label}</span>
                                                    <kbd className="font-mono text-[11px] font-semibold text-text-primary bg-bg-item-surface border border-border-subtle rounded-md px-1.5 py-0.5 leading-none">{h.kbd}</kbd>
                                                </div>
                                                {hi < hotkeys.length - 1 && <span className="text-border-subtle text-[12px] select-none">·</span>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export const HelpSettings: React.FC<{ onNavigate?: (tab: string) => void }> = () => {
    const { t } = useTranslation();
    const { shortcuts } = useShortcuts();
    const isLight = useResolvedTheme() === 'light';
    
    // Kbd class applying theme variables natively
    const kbdClass = `px-1.5 py-0.5 rounded text-[10px] font-mono border inline-block bg-bg-item-surface border-border-subtle text-text-secondary shadow-sm`;

    return (
        <div className="w-full h-full flex flex-col animated fadeIn pb-10">
            <div className="mb-6 shrink-0">
                <h2 className={`text-2xl font-bold text-text-primary flex items-center gap-3`}>
                    <HelpCircle className="w-6 h-6 text-accent-primary" />
                    {t('help.title')}
                </h2>
                <p className={`text-sm text-text-secondary mt-3 max-w-2xl`}>
                    {t('help.subtitle')}
                </p>
            </div>

            <div className="flex-1 space-y-2">

                <SetupGuide />

                <div className="h-10" />
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-3">
                    <h3 className="text-[20px] font-bold text-text-primary tracking-tight leading-tight">{t('help.guideTitle')}</h3>
                </div>

                <AccordionSection title={t('help.sections.permissions.title')} icon={<Monitor className="w-4 h-4" />}>
                     <div className="space-y-4">
                        <p>{t('help.sections.permissions.intro')}</p>
                        <MockPermissionsAnim />
                    <div className="space-y-3 mt-4">
                            <h4 className="font-bold text-base text-text-primary border-b border-border-subtle pb-2">{t('help.sections.permissions.hardwareTitle')}</h4>
                            
                            <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2`}>
                                <h5 className={`font-semibold text-[13px] text-text-primary flex items-center gap-2`}>
                                    <Mic size={14} className="text-blue-500" /> {t('help.sections.permissions.loopbackTitle')}
                                </h5>
                                <p className="text-[11px] opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.permissions.loopbackDesc')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2`}>
                                    <h5 className={`font-semibold text-[13px] text-text-primary flex items-center gap-2`}>
                                        <Monitor size={14} className="text-accent-primary" /> ScreenCaptureKit (SCK)
                                    </h5>
                                    <p className="text-[11px] opacity-90 leading-relaxed text-text-secondary">
                                        {t('help.sections.permissions.sckDesc')}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2`}>
                                    <h5 className={`font-semibold text-[13px] text-text-primary flex items-center gap-2`}>
                                        <Volume2 size={14} className="text-orange-500" /> CoreAudio (Legacy)
                                    </h5>
                                    <p className="text-[11px] opacity-90 leading-relaxed text-text-secondary">
                                        {t('help.sections.permissions.coreAudioDesc')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2`}>
                                <h5 className={`font-semibold text-[13px] text-text-primary flex items-center gap-2`}>
                                    <Globe size={14} className="text-green-500" /> {t('help.sections.permissions.languageTitle')}
                                </h5>
                                <p className="text-[11px] opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.permissions.languageDescPrefix')} <strong>{t('settings.audio.language')}</strong> {t('help.sections.permissions.languageDescMiddle')} <span className={kbdClass}>{t('settings.audio.accentRegion')}</span> {t('help.sections.permissions.languageDescSuffix')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle`}>
                                <h4 className={`font-semibold text-sm mb-2 text-text-primary flex items-center gap-2`}>
                                    <Monitor className="w-4 h-4 text-accent-primary" /> {t('help.sections.permissions.screenRecording')}
                                </h4>
                                <p className="text-xs opacity-90 mb-2">{t('help.sections.permissions.screenRecordingDesc')}</p>
                                <p className="text-[11px] text-text-tertiary">{t('help.sections.permissions.screenRecordingPath')}</p>
                            </div>
                            
                            <div className={`p-4 rounded-xl border bg-bg-item-surface border-border-subtle`}>
                                <h4 className={`font-semibold text-sm mb-2 text-text-primary flex items-center gap-2`}>
                                    <Command className="w-4 h-4 text-purple-500" /> {t('help.sections.permissions.accessibility')}
                                </h4>
                                <p className="text-xs opacity-90 mb-2">{t('help.sections.permissions.accessibilityDesc')}</p>
                                <p className="text-[11px] text-text-tertiary">{t('help.sections.permissions.accessibilityPath')}</p>
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.audio.title')} icon={<Mic className="w-4 h-4" />}>
                     <div className="space-y-6">
                        <p>{t('help.sections.audio.intro')}</p>
                        
                        <MockProviderSelectionAnim />

                        <div className="space-y-4 pt-2">
                             <h4 className="font-bold text-lg text-text-primary border-b border-border-subtle pb-2">{t('help.sections.audio.apiKeysTitle')}</h4>
                             <p className="text-xs text-text-secondary">{t('help.sections.audio.apiKeysDesc')}</p>
                             
                             <MockApiKeyFlowAnim />
                        </div>

                        <div className="space-y-3 pt-4">
                             <h4 className="font-bold text-lg text-text-primary border-b border-border-subtle pb-2">{t('help.sections.audio.providerSetupTitle')}</h4>
                             
                             <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>1. Google Cloud STT</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.cloud.google.com/apis/credentials') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.googleSetup')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>2. ElevenLabs</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://elevenlabs.io/app/settings/api-keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.elevenlabsSetupPrefix')} <strong>convai.conversations.create</strong> {t('help.and')} <strong>assistants.list</strong>.
                                    {t('help.sections.audio.elevenlabsSetupSuffix')} <strong>Speech to Text: Access</strong>.
                                </p>
                                <ElevenLabsPermissionsMock />
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>3. Groq</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.groq.com/keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.groqSetupPrefix')} <span className={kbdClass}>gsk_</span>. {t('help.sections.audio.groqSetupSuffix')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>4. OpenAI</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://platform.openai.com/api-keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.openaiSetupPrefix')} <span className={kbdClass}>sk-</span>. {t('help.sections.audio.openaiSetupSuffix')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>5. Deepgram</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.deepgram.com/') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.deepgramSetup')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>6. Azure</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://portal.azure.com/') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.azureSetupPrefix')} <strong>{t('help.important')}</strong>: {t('help.sections.audio.azureSetupSuffix')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>7. IBM Watson</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://cloud.ibm.com/catalog/services/speech-to-text') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.ibmSetup')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-2">
                                <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center">
                                    <span>8. Soniox</span>
                                    <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.soniox.com/') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.link')}</button>
                                </h5>
                                <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                    {t('help.sections.audio.sonioxSetup')}
                                </p>
                            </div>
                        </div>

                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.ai.title')} icon={<Key className="w-4 h-4" />}>
                     <div className="space-y-4">
                        <p className="text-sm">{t('help.sections.ai.intro')}</p>

                        <div className="space-y-3 pt-2">
                             <h4 className="font-bold text-lg text-text-primary border-b border-border-subtle pb-2">{t('help.sections.ai.standardCloud')}</h4>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 <div className="p-3 rounded-xl border bg-bg-item-surface border-border-subtle hover:border-border-muted transition-colors">
                                     <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center mb-1">
                                         <span className="flex items-center gap-2">
                                            <img src="https://groq.com/favicon.svg" alt="Groq" className="w-4 h-4 object-contain" /> Groq
                                         </span>
                                         <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.groq.com/keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.getKey')}</button>
                                     </h5>
                                     <p className="text-[11px] opacity-80 mb-2">{t('help.sections.ai.groqDesc')} <strong>llama-3.3-70b-versatile</strong>.</p>
                                     <span className={kbdClass}>gsk_...</span>
                                 </div>
                                 <div className="p-3 rounded-xl border bg-bg-item-surface border-border-subtle hover:border-border-muted transition-colors">
                                     <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center mb-1">
                                         <span className="flex items-center gap-2">
                                             <SiOpenai className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-white'}`} /> OpenAI
                                         </span>
                                         <button onClick={() => { (window as any).electronAPI?.openExternal('https://platform.openai.com/api-keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.getKey')}</button>
                                     </h5>
                                     <p className="text-[11px] opacity-80 mb-2">{t('help.sections.ai.openaiDescPrefix')} <strong>deepseek-ai/DeepSeek-V4-Flash</strong>. {t('help.sections.ai.openaiDescSuffix')}</p>
                                     <span className={kbdClass}>sk-proj-...</span>
                                 </div>
                                 <div className="p-3 rounded-xl border bg-bg-item-surface border-border-subtle hover:border-border-muted transition-colors">
                                     <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center mb-1">
                                         <span className="flex items-center gap-2">
                                            <img src="https://cdn.simpleicons.org/anthropic/000000" style={{filter: isLight ? '' : 'invert(1)'}} alt="Anthropic" className="w-4 h-4 object-contain" /> Anthropic
                                         </span>
                                         <button onClick={() => { (window as any).electronAPI?.openExternal('https://console.anthropic.com/settings/keys') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.getKey')}</button>
                                     </h5>
                                     <p className="text-[11px] opacity-80 mb-2">{t('help.sections.ai.anthropicDesc')} <strong>claude-4.6-sonnet</strong>.</p>
                                     <span className={kbdClass}>sk-ant-...</span>
                                 </div>
                                 <div className="p-3 rounded-xl border bg-bg-item-surface border-border-subtle hover:border-border-muted transition-colors">
                                     <h5 className="font-semibold text-sm text-text-primary flex justify-between items-center mb-1">
                                         <span className="flex items-center gap-2">
                                            <SiGoogle className="w-3.5 h-3.5 text-blue-500" /> Google Gemini
                                         </span>
                                         <button onClick={() => { (window as any).electronAPI?.openExternal('https://aistudio.google.com/app/apikey') }} className="text-accent-primary hover:underline text-[10px] flex items-center gap-1"><ExternalLink size={10} /> {t('help.getKey')}</button>
                                     </h5>
                                     <p className="text-[11px] opacity-80 mb-2">{t('help.sections.ai.geminiDesc')} <strong>gemini-3.1-pro</strong>.</p>
                                     <span className={kbdClass}>AIzaSy...</span>
                                 </div>
                             </div>

                             <div className="mt-2 bg-bg-item-surface p-4 rounded-xl border border-border-subtle shadow-sm flex gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
                                     <Zap className="w-4 h-4 text-accent-primary" />
                                 </div>
                                 <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                                     <strong className="text-text-primary font-bold">{t('help.sections.ai.registrySyncTitle')}:</strong> {t('help.sections.ai.registrySyncPrefix')} (<span className="font-mono bg-bg-elevated border border-border-muted px-1.5 py-0.5 rounded text-[10px] text-text-primary shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">v2/api/models</span>) {t('help.sections.ai.registrySyncSuffix')}
                                 </p>
                             </div>
                             
                             <div className="p-4 mt-2 rounded-xl border border-border-subtle bg-bg-item-surface">
                                 <h5 className="font-semibold text-[13px] text-text-primary mb-1">{t('help.sections.ai.activeModelTitle')}</h5>
                                 <p className="text-[11px] text-text-secondary leading-relaxed">
                                     {t('help.sections.ai.activeModelDescPrefix')} <strong>{t('aiProviders.activeModel')}</strong>. {t('help.sections.ai.activeModelDescSuffix')}
                                 </p>
                             </div>
                        </div>

                        <div className="space-y-3 pt-4">
                             <h4 className="font-bold text-lg text-text-primary border-b border-border-subtle pb-2">{t('help.sections.ai.localModels')}</h4>
                             <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-3">
                                 <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                     {t('help.sections.ai.ollamaIntro')} <span className={kbdClass}>http://localhost:11434</span> {t('help.sections.ai.ollamaIntroSuffix')}
                                 </p>
                                 <ol className="list-decimal pl-4 text-xs space-y-2 opacity-90 text-text-secondary">
                                     <li>{t('help.sections.ai.ollamaStep1')} <button onClick={() => { (window as any).electronAPI?.openExternal('https://ollama.com/download') }} className="text-accent-primary hover:underline inline-flex items-center gap-1 font-medium">ollama.com <ExternalLink size={10} /></button></li>
                                     <li>
                                        {t('help.sections.ai.ollamaStep2')}
                                        <div className="mt-1 bg-bg-input p-2 rounded border border-border-subtle font-mono text-[11px]">ollama run llama3:8b</div>
                                     </li>
                                     <li>{t('help.sections.ai.ollamaStep3')}
                                        <div className="mt-1 bg-bg-input p-2 rounded border border-border-subtle font-mono text-[11px]">ollama run phi3</div>
                                     </li>
                                     <li>{t('help.sections.ai.ollamaStep4')}</li>
                                 </ol>
                             </div>
                        </div>

                        <div className="space-y-3 pt-4">
                             <h4 className="font-bold text-lg text-text-primary border-b border-border-subtle pb-2">{t('help.sections.ai.customProviders')}</h4>
                             <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle space-y-3">
                                 <p className="text-xs opacity-90 leading-relaxed text-text-secondary">
                                     {t('help.sections.ai.customProvidersDesc')}
                                 </p>
                                 <div className="bg-bg-input p-3 rounded-lg border border-border-subtle space-y-2">
                                     <div className="text-[11px] font-mono text-text-secondary">
                                         <div className="text-purple-400">curl</div> <span className="text-blue-400">https://openrouter.ai/api/v1/chat/completions</span> \
                                         <br/>  -H <span className="text-green-400">"Authorization: Bearer YOUR_KEY"</span> \
                                         <br/> ...
                                     </div>
                                 </div>
                                 <div className="flex items-start gap-2 mt-2">
                                     <div className="w-5 h-5 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5"><Zap size={10} /></div>
                                     <div className="text-xs text-text-secondary leading-relaxed">
                                         <strong>{t('help.sections.ai.responsePathTitle')}</strong> {t('help.sections.ai.responsePathDesc')} <span className={kbdClass}>choices[0].message.content</span>.
                                     </div>
                                 </div>
                             </div>
                        </div>

                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.interface.title')} icon={<Monitor className="w-4 h-4" />}>
                     <div className="space-y-6">
                        <p className="text-[13px]">{t('help.sections.interface.intro')}</p>
                        
                        <div className="relative w-full flex flex-col p-2 sm:p-5 bg-bg-main rounded-[26px] border border-border-subtle shadow-inner">
                            <MockAppInterface />
                            <MockPillControlsAnim />
                        </div>

                        {/* Quick Actions & Hotkeys */}
                        <div className="mt-4 mb-3 flex items-center gap-3">
                            <div className="flex-1 h-px bg-border-subtle" />
                            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">{t('help.sections.interface.quickActionsHotkeys')}</span>
                            <div className="flex-1 h-px bg-border-subtle" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {([
                                { Icon: Pencil,        color: 'blue',   title: t('help.sections.interface.actions.whatToAnswer.title'),  badge: null,           bc: '',                                                          kbd: ['⌘','1'],        desc: t('help.sections.interface.actions.whatToAnswer.desc') },
                                { Icon: Lightbulb,     color: 'violet', title: t('help.sections.interface.actions.brainstorm.title'),        badge: t('help.sections.interface.interviewOn'),  bc: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',  kbd: ['⌘','3'],        desc: t('help.sections.interface.actions.brainstorm.desc') },
                                { Icon: HelpCircle,    color: 'teal',   title: t('help.sections.interface.actions.followUp.title'),         badge: null,           bc: '',                                                          kbd: ['⌘','4'],        desc: t('help.sections.interface.actions.followUp.desc') },
                                { Icon: Zap,           color: 'emerald',title: t('help.sections.interface.actions.answerNow.title'),        badge: null,           bc: '',                                                          kbd: ['⌘','5'],        desc: t('help.sections.interface.actions.answerNow.desc') },
                                { Icon: MessageSquare, color: 'indigo', title: t('help.sections.interface.actions.clarify.title'),           badge: null,           bc: '',                                                          kbd: ['⌘','2'],        desc: t('help.sections.interface.actions.clarify.desc') },
                                { Icon: RefreshCw,     color: 'amber',  title: t('help.sections.interface.actions.recap.title'),             badge: t('help.sections.interface.interviewOff'), bc: 'bg-red-500/10 text-red-400 border-red-500/30',              kbd: ['⌘','3'],        desc: t('help.sections.interface.actions.recap.desc') },
                                { Icon: Sparkles,      color: 'sky',    title: t('help.sections.interface.actions.codeHint.title'),         badge: null,           bc: '',                                                          kbd: ['⌘','6'],        desc: t('help.sections.interface.actions.codeHint.desc') },
                                { Icon: Monitor,       color: 'rose',   title: t('help.sections.interface.actions.screenshotAsk.title'),  badge: null,           bc: '',                                                          kbd: ['⌘','⇧','H'],    desc: t('help.sections.interface.actions.screenshotAsk.desc') },
                                { Icon: EyeOff,        color: 'slate',  title: t('help.sections.interface.actions.stealthExecute.title'),   badge: null,           bc: '',                                                          kbd: ['⌘','↵'],        desc: t('help.sections.interface.actions.stealthExecute.desc') },
                            ] as Array<{ Icon: React.ElementType; color: 'blue'|'violet'|'teal'|'emerald'|'indigo'|'amber'|'sky'|'rose'|'slate'; title: string; badge: string|null; bc: string; kbd: string[]; desc: string }>).map(({ Icon, color, title, badge, bc, kbd, desc }) => {
                                const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform);
                                const resolvedKbd = kbd.map(k => k === '⌘' ? (isWindows ? 'Ctrl' : '⌘') : k);
                                const tone = {
                                    blue:   { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    glow: 'group-hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_4px_12px_rgba(59,130,246,0.07)]' },
                                    violet: { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  glow: 'group-hover:shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_4px_12px_rgba(139,92,246,0.07)]' },
                                    teal:   { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/20',    glow: 'group-hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_4px_12px_rgba(20,184,166,0.07)]' },
                                    emerald:{ bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'group-hover:shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_4px_12px_rgba(16,185,129,0.07)]' },
                                    indigo: { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20',  glow: 'group-hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_4px_12px_rgba(99,102,241,0.07)]' },
                                    amber:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'group-hover:shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_4px_12px_rgba(245,158,11,0.07)]' },
                                    sky:    { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20',     glow: 'group-hover:shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_4px_12px_rgba(14,165,233,0.07)]' },
                                    rose:   { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    glow: 'group-hover:shadow-[0_0_0_1px_rgba(244,63,94,0.2),0_4px_12px_rgba(244,63,94,0.07)]' },
                                    slate:  { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   glow: 'group-hover:shadow-[0_0_0_1px_rgba(100,116,139,0.2),0_4px_12px_rgba(100,116,139,0.07)]' },
                                }[color];

                                return (
                                    <div key={title} className={`group flex flex-col gap-1.5 p-3 rounded-xl border border-border-subtle bg-bg-item-surface hover:bg-bg-elevated transition-all duration-200 cursor-default ${tone.glow}`}>

                                        {/* Line 1 — Icon + Name */}
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-md ${tone.bg} border ${tone.border} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-3 h-3 ${tone.text}`} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[12px] font-bold text-text-primary tracking-tight leading-none truncate">{title}</span>
                                        </div>

                                        {/* Line 2 — Interview mode badge */}
                                        <div className="flex items-center">
                                            {badge ? (
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-[2px] border rounded leading-none ${bc}`}>{badge}</span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-text-tertiary/50 uppercase tracking-wider leading-none">{t('help.sections.interface.alwaysActive')}</span>
                                            )}
                                        </div>

                                        {/* Line 3 — Shortcut */}
                                        <div className="flex items-center gap-1">
                                            {resolvedKbd.map((key, i) => (
                                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono inline-block bg-bg-elevated text-text-secondary">{key}</span>
                                            ))}
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                                        {/* Description */}
                                        <p className="text-[11px] text-text-secondary leading-[1.5]">{desc}</p>
                                    </div>
                                );
                            })}
                        </div>


                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.meeting.title')} icon={<Calendar className="w-4 h-4" />}>
                     <div className="space-y-6">
                        <p className="text-[13px]">{t('help.sections.meeting.intro')}</p>
                        
                        <MockMeetingInterfaceAnim />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> {t('help.sections.meeting.summaryExecution')}
                                </h4>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {t('help.sections.meeting.summaryExecutionDesc')}
                                </p>
                            </div>

                            <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                    <Volume2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" /> {t('help.sections.meeting.rawTranscripts')}
                                </h4>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {t('help.sections.meeting.rawTranscriptsDesc')}
                                </p>
                            </div>

                            <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                    <Cpu className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" /> {t('help.sections.meeting.usageStorage')}
                                </h4>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {t('help.sections.meeting.usageStorageDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-border-subtle pt-6">
                            <h4 className="font-bold text-sm text-text-primary flex items-center gap-2 mb-4">
                                <MessageSquare className="w-4 h-4 text-accent-primary" /> {t('help.sections.meeting.semanticSearch')}
                            </h4>
                            <p className="text-[13px] mb-6">{t('help.sections.meeting.semanticSearchDesc')}</p>
                            
                            <MockMeetingChatAnim />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                    <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                        <Search className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> {t('help.sections.meeting.contextualSearch')}
                                    </h4>
                                    <p className="text-[12px] text-text-secondary leading-relaxed">
                                        {t('help.sections.meeting.contextualSearchDesc')}
                                    </p>
                                </div>

                                <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                    <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                        <Brain className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" /> {t('help.sections.meeting.memoryIsolation')}
                                    </h4>
                                    <p className="text-[12px] text-text-secondary leading-relaxed">
                                        {t('help.sections.meeting.memoryIsolationDesc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.globalSearch.title')} icon={<Search className="w-4 h-4" />}>
                     <div className="space-y-6">
                        <p className="text-[13px]">{t('help.sections.globalSearch.introPrefix')} <span className={kbdClass}>Cmd+K</span> {t('help.sections.globalSearch.introSuffix')}</p>

                        <MockSearchPillAnim />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 mb-4">
                            <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                    <Briefcase className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" /> {t('help.sections.globalSearch.instantTraversal')}
                                </h4>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {t('help.sections.globalSearch.instantTraversalDesc')}
                                </p>
                            </div>

                            <div className="p-4 bg-bg-item-surface border border-border-subtle rounded-xl shadow-sm hover:border-border-muted transition-colors group">
                                <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" /> {t('help.sections.globalSearch.conversationalFallback')}
                                </h4>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {t('help.sections.globalSearch.conversationalFallbackDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-border-subtle pt-6">
                            <h4 className="font-bold text-sm text-text-primary border-b border-border-subtle pb-1">{t('help.sections.globalSearch.systemShortcuts')}</h4>
                            <p className="text-[11px] text-text-secondary mt-1 mb-3">{t('help.sections.globalSearch.systemShortcutsDescPrefix')} <strong>{t('help.sections.globalSearch.settingsHotkeys')}</strong>.</p>
                            
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                    <div className="flex items-start gap-4">
                                         <div className="w-8 h-8 rounded shrink-0 bg-bg-input border border-border-subtle flex items-center justify-center mt-0.5">
                                             <Eye className="w-4 h-4 text-text-primary" />
                                         </div>
                                        <div>
                                            <div className="font-semibold text-sm text-text-primary">{t('help.sections.globalSearch.showHideInterface')}</div>
                                            <div className="text-xs text-text-secondary mt-1">{t('help.sections.globalSearch.showHideInterfaceDesc')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {(shortcuts.toggleVisibility || ['⌘', 'B']).map((key: string, i: number) => <span key={i} className={kbdClass}>{key}</span>)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                    <div className="flex items-start gap-4">
                                         <div className="w-8 h-8 rounded shrink-0 bg-bg-input border border-border-subtle flex items-center justify-center mt-0.5">
                                             <Image className="w-4 h-4 text-text-primary" />
                                         </div>
                                        <div>
                                            <div className="font-semibold text-sm text-text-primary">{t('help.sections.globalSearch.captureScreenshot')}</div>
                                            <div className="text-xs text-text-secondary mt-1">{t('help.sections.globalSearch.captureScreenshotDesc')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                         {(shortcuts.takeScreenshot || ['⌘', 'H']).map((key: string, i: number) => <span key={i} className={kbdClass}>{key}</span>)}
                                    </div>
                                </div>

                                 <div className="flex items-center justify-between p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                    <div className="flex items-start gap-4">
                                         <div className="w-8 h-8 rounded shrink-0 bg-bg-input border border-border-subtle flex items-center justify-center mt-0.5">
                                             <MessageSquare className="w-4 h-4 text-text-primary" />
                                         </div>
                                        <div>
                                            <div className="font-semibold text-sm text-text-primary">{t('help.sections.globalSearch.processCaptured')}</div>
                                            <div className="text-xs text-text-secondary mt-1">{t('help.sections.globalSearch.processCapturedDesc')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                         {(shortcuts.processScreenshots || ['⌘', 'Enter']).map((key: string, i: number) => <span key={i} className={kbdClass}>{key}</span>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                    <div className="flex items-start gap-4">
                                         <div className="w-8 h-8 rounded shrink-0 bg-bg-input border border-border-subtle flex items-center justify-center mt-0.5">
                                             <Zap className="w-4 h-4 text-text-primary" />
                                         </div>
                                        <div>
                                            <div className="font-semibold text-sm text-text-primary">{t('help.sections.globalSearch.captureExecute')}</div>
                                            <div className="text-xs text-text-secondary mt-1">{t('help.sections.globalSearch.captureExecuteDesc')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                         {(shortcuts.captureAndProcess || ['⌘', '⇧', 'Enter']).map((key: string, i: number) => <span key={i} className={kbdClass}>{key}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionSection>



                <AccordionSection title={t('help.sections.pro.title')} icon={<Star className="w-4 h-4" />}>
                     <div className="space-y-6">
                        {/* Profile */}
                        <div>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                                <h4 className="text-[13px] font-semibold text-amber-500 flex items-center gap-2 mb-1">
                                    <User size={14} /> {t('help.sections.pro.profileSystem')}
                                </h4>
                                <p className="text-[11px] text-text-secondary leading-relaxed mb-0">
                                    {t('help.sections.pro.profileSystemDesc')}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-500" /> {t('help.sections.pro.coreBenefits')}
                                    </h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li><strong>{t('help.sections.pro.zeroContextPrep')}:</strong> {t('help.sections.pro.zeroContextPrepDesc')}</li>
                                        <li><strong>{t('help.sections.pro.resumeParsing')}:</strong> {t('help.sections.pro.resumeParsingDesc')}</li>
                                        <li><strong>{t('help.sections.pro.globalToggle')}:</strong> {t('help.sections.pro.globalTogglePrefix')} <span className="text-amber-500 font-semibold">{t('settingsPopup.profileMode')}</span> {t('help.sections.pro.globalToggleSuffix')}</li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-xl border bg-accent-primary/5 border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-accent-primary" /> {t('help.sections.pro.proRequirement')}
                                    </h4>
                                    <p className="text-[11px] text-text-secondary mb-2">
                                        {t('help.sections.pro.proFeature')}
                                    </p>
                                    <ol className="text-[11px] text-text-secondary space-y-1 list-decimal pl-4 mb-0">
                                        <li>{t('help.sections.pro.getLicenseAt')} <button onClick={() => { (window as any).electronAPI?.openExternal('https://natively.software/') }} className="text-accent-primary hover:underline font-semibold">natively.software</button></li>
                                        <li>{t('help.sections.pro.dropResume')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border-subtle pt-5 mt-2">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                                <h4 className="text-[13px] font-semibold text-emerald-500 flex items-center gap-2 mb-1">
                                    <FileText size={14} /> {t('help.sections.pro.customContextNotes')}
                                </h4>
                                <p className="text-[11px] text-text-secondary leading-relaxed mb-0">
                                    {t('help.sections.pro.customContextDescPrefix')} <strong>{t('settings.profile.customContext')}</strong> {t('help.sections.pro.customContextDescMiddle')} <code className="bg-bg-elevated px-1 rounded text-[10px]">&lt;user_context&gt;</code> {t('help.sections.pro.customContextDescSuffix')}
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-emerald-500" /> {t('help.sections.pro.howToUse')}
                                    </h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.pro.useStep1')}</li>
                                        <li>{t('help.sections.pro.useStep2')}</li>
                                        <li>{t('help.sections.pro.useStep3')}</li>
                                        <li>{t('help.sections.pro.useStep4')}</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" /> {t('help.sections.pro.whatToPut')}
                                    </h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.pro.putProductDetails')}</li>
                                        <li>{t('help.sections.pro.putCandidateNotes')}</li>
                                        <li>{t('help.sections.pro.putLeetcode')}</li>
                                        <li>{t('help.sections.pro.putStylePreferences')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                     </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.modes.title')} icon={<LayoutGrid className="w-4 h-4" />}>
                    <div className="space-y-6">
                        <p className="text-[13px]">{t('help.sections.modes.intro')}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {([
                                { name: t('help.sections.modes.cards.interview.name'), desc: t('help.sections.modes.cards.interview.desc') },
                                { name: t('help.sections.modes.cards.sales.name'), desc: t('help.sections.modes.cards.sales.desc') },
                                { name: t('help.sections.modes.cards.recruiting.name'), desc: t('help.sections.modes.cards.recruiting.desc') },
                                { name: t('help.sections.modes.cards.teamMeet.name'), desc: t('help.sections.modes.cards.teamMeet.desc') },
                                { name: t('help.sections.modes.cards.lecture.name'), desc: t('help.sections.modes.cards.lecture.desc') },
                                { name: t('help.sections.modes.cards.technical.name'), desc: t('help.sections.modes.cards.technical.desc') },
                            ] as Array<{ name: string; desc: string }>).map(({ name, desc }) => (
                                <div key={name} className="p-3 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h5 className="font-semibold text-sm text-text-primary mb-1">{name}</h5>
                                    <p className="text-[11px] text-text-secondary leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border-subtle">
                            <h4 className="font-bold text-sm text-text-primary pt-4">{t('help.sections.modes.howToUse')}</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.modes.openingManager')}</h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.modes.openStep1')}</li>
                                        <li>{t('help.sections.modes.openStep2')}</li>
                                        <li>{t('help.sections.modes.openStep3')}</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.modes.activatingMode')}</h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.modes.activateStep1')}</li>
                                        <li>{t('help.sections.modes.activateStep2')}</li>
                                        <li>{t('help.sections.modes.activateStep3')}</li>
                                        <li>{t('help.sections.modes.activateStep4')}</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.modes.referenceFiles')}</h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.modes.referenceStep1')}</li>
                                        <li>{t('help.sections.modes.referenceStep2')}</li>
                                        <li>{t('help.sections.modes.referenceStep3')}</li>
                                        <li>{t('help.sections.modes.referenceStep4')}</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.modes.customModes')}</h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.modes.customStep1')}</li>
                                        <li>{t('help.sections.modes.customStep2')}</li>
                                        <li>{t('help.sections.modes.customStep3')}</li>
                                        <li>{t('help.sections.modes.customStep4')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <h4 className="text-[13px] font-semibold text-indigo-400 flex items-center gap-2 mb-1">
                                <Star size={14} /> {t('help.sections.modes.proFeature')}
                            </h4>
                            <p className="text-[11px] text-text-secondary leading-relaxed mb-0">
                                {t('help.sections.modes.proFeatureDesc')}
                            </p>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.misc.title')} icon={<Settings className="w-4 h-4" />}>
                    <div className="space-y-6">
                        {/* Calendar */}
                        <div>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                                <h4 className="text-[13px] font-semibold text-blue-500 flex items-center gap-2 mb-1">
                                    <Calendar size={14} /> {t('help.sections.misc.calendarTitle')}
                                </h4>
                                <p className="text-[11px] text-text-secondary leading-relaxed mb-0">
                                    {t('help.sections.misc.calendarDesc')}
                                </p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.misc.setupTitle')}</h4>
                                    <ul className="text-[11px] text-text-secondary space-y-1 list-disc pl-4">
                                        <li>{t('help.sections.misc.calendarStep1')}</li>
                                        <li>{t('help.sections.misc.calendarStep2')}</li>
                                        <li>{t('help.sections.misc.calendarStep3')}</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">{t('help.sections.misc.followUpSystem')}</h4>
                                    <p className="text-[11px] text-text-secondary">
                                        {t('help.sections.misc.followUpDescPrefix')} <strong>{t('help.sections.misc.whoYouAreTalkingTo')}</strong>. {t('help.sections.misc.followUpDescSuffix')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border-subtle my-5"></div>

                        {/* Fast Mode */}
                        <div className="space-y-4">
                             <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                                 <Zap className="w-4 h-4 text-orange-500" /> {t('help.sections.misc.fastMode')}
                             </h4>
                             <MockFastModeAnim />
                             <div className="p-4 rounded-xl border bg-orange-500/10 border-orange-500/20">
                                 <h4 className="font-semibold text-sm mb-2 text-orange-500 flex items-center gap-2">
                                     <Zap className="w-4 h-4" /> {t('help.sections.misc.fastModeWorks')}
                                 </h4>
                                 <p className="text-xs text-orange-400/80 m-0">
                                     {t('help.sections.misc.fastModeDesc')}
                                 </p>
                             </div>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title={t('help.sections.stealth.title')} icon={<Ghost className="w-4 h-4" />}>
                     <div className="space-y-4">
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                            <h4 className="text-[13px] font-semibold text-indigo-400 flex items-center gap-2 mb-1">
                                <Ghost size={14} /> {t('help.sections.stealth.disguiseTitle')}
                            </h4>
                            <p className="text-[11px] text-text-secondary leading-relaxed mb-0">
                                {t('help.sections.stealth.disguiseDesc')}
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                    <EyeOff className="w-4 h-4 text-text-secondary" /> {t('help.sections.stealth.opacityTitle')}
                                </h4>
                                <p className="text-xs text-text-secondary">
                                    {t('help.sections.stealth.opacityDescPrefix')} <strong>{t('settings.general.opacity.title')}</strong> {t('help.sections.stealth.opacityDescSuffix')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border bg-bg-item-surface border-border-subtle group">
                                <h4 className="font-semibold text-sm mb-2 text-text-primary flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-text-secondary" /> {t('help.sections.stealth.mousePassthroughTitle')}
                                </h4>
                                <p className="text-[11px] text-text-secondary mb-2">
                                    {t('help.sections.stealth.mousePassthroughDescPrefix')} <strong>{t('settings.general.mousePassthrough.title')}</strong> {t('help.sections.stealth.mousePassthroughDescSuffix')}
                                </p>
                                <div className="p-2 border border-orange-500/20 bg-orange-500/5 rounded-lg">
                                    <p className="text-[10px] text-orange-400 m-0">
                                        <strong>⚠️ {t('help.warning')}:</strong> {t('help.sections.stealth.mousePassthroughWarning')}
                                    </p>
                                </div>
                            </div>
                        </div>
                     </div>
                </AccordionSection>
                
            </div>
        </div>
    );
};
