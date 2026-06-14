import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Camera, RotateCcw, Eye, MessageSquare, Crop,
    RefreshCw, Sparkles, Zap, Mic, PointerOff,
} from 'lucide-react';
import { useShortcuts } from '../hooks/useShortcuts';
import { KeyRecorder } from './ui/KeyRecorder';

const ShortcutsView: React.FC = () => {
    const { t } = useTranslation();
    const { shortcuts, updateShortcut, resetShortcuts } = useShortcuts();

    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-bg-secondary text-text-secondary">
            <div className="max-w-3xl mx-auto px-8 py-8">
                <div className="space-y-5 select-text pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">{t('settings.keybinds.title')}</h3>
                            <p className="text-xs text-text-secondary">{t('settings.keybinds.description')}</p>
                        </div>
                        <button
                            onClick={resetShortcuts}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-subtle bg-bg-subtle/30 hover:bg-bg-subtle hover:border-green-500/30 transition-all duration-200 text-xs font-medium text-text-secondary hover:text-green-500 active:scale-95 mt-1"
                        >
                            <RotateCcw size={13} strokeWidth={2.5} />
                            {t('settings.keybinds.restoreDefault')}
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {/* General Category */}
                        <div>
                            <h4 className="text-sm font-bold text-text-primary mb-3">{t('settings.shortcuts.general')}</h4>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><Eye size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.toggleVisibility')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.toggleVisibility}
                                        onSave={(keys) => updateShortcut('toggleVisibility', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><PointerOff size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.toggleMousePassthrough')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.toggleMousePassthrough}
                                        onSave={(keys) => updateShortcut('toggleMousePassthrough', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><MessageSquare size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.processScreenshots')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.processScreenshots}
                                        onSave={(keys) => updateShortcut('processScreenshots', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><Sparkles size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.captureAndProcess')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.captureAndProcess}
                                        onSave={(keys) => updateShortcut('captureAndProcess', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><RotateCcw size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.resetCancel')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.resetCancel}
                                        onSave={(keys) => updateShortcut('resetCancel', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><Camera size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.takeScreenshot')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.takeScreenshot}
                                        onSave={(keys) => updateShortcut('takeScreenshot', keys)}
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1.5 group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center"><Crop size={14} /></span>
                                        <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{t('settings.shortcuts.selectiveScreenshot')}</span>
                                    </div>
                                    <KeyRecorder
                                        currentKeys={shortcuts.selectiveScreenshot}
                                        onSave={(keys) => updateShortcut('selectiveScreenshot', keys)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chat Category */}
                        <div>
                            <div className="mb-3">
                                <h4 className="text-sm font-bold text-text-primary">{t('settings.shortcuts.chat')}</h4>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { id: 'whatToAnswer', label: t('settings.shortcuts.whatToAnswer'), icon: <Sparkles size={14} /> },
                                    { id: 'clarify', label: t('settings.shortcuts.clarify'), icon: <MessageSquare size={14} /> },
                                    { id: 'followUp', label: t('settings.shortcuts.followUp'), icon: <MessageSquare size={14} /> },
                                    { id: 'dynamicAction4', label: t('settings.shortcuts.recapBrainstorm'), icon: <RefreshCw size={14} /> },
                                    { id: 'answer', label: t('settings.shortcuts.answerRecord'), icon: <Mic size={14} /> },
                                    { id: 'codeHint', label: t('settings.shortcuts.codeHint'), icon: <Zap size={14} /> },
                                    { id: 'brainstorm', label: t('settings.shortcuts.brainstormApproaches'), icon: <Zap size={14} /> },
                                    { id: 'scrollUp', label: t('settings.shortcuts.scrollUp'), icon: <ArrowUp size={14} /> },
                                    { id: 'scrollDown', label: t('settings.shortcuts.scrollDown'), icon: <ArrowDown size={14} /> },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center">{item.icon}</span>
                                            <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{item.label}</span>
                                        </div>
                                        <KeyRecorder
                                            currentKeys={shortcuts[item.id as keyof typeof shortcuts]}
                                            onSave={(keys) => updateShortcut(item.id as any, keys)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Window Category */}
                        <div>
                            <h4 className="text-sm font-bold text-text-primary mb-3">{t('settings.shortcuts.window')}</h4>
                            <div className="space-y-1">
                                {[
                                    { id: 'moveWindowUp', label: t('settings.shortcuts.moveWindowUp'), icon: <ArrowUp size={14} /> },
                                    { id: 'moveWindowDown', label: t('settings.shortcuts.moveWindowDown'), icon: <ArrowDown size={14} /> },
                                    { id: 'moveWindowLeft', label: t('settings.shortcuts.moveWindowLeft'), icon: <ArrowLeft size={14} /> },
                                    { id: 'moveWindowRight', label: t('settings.shortcuts.moveWindowRight'), icon: <ArrowRight size={14} /> }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-tertiary group-hover:text-text-primary transition-colors w-5 flex justify-center">{item.icon}</span>
                                            <span className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors">{item.label}</span>
                                        </div>
                                        <KeyRecorder
                                            currentKeys={shortcuts[item.id as keyof typeof shortcuts]}
                                            onSave={(keys) => updateShortcut(item.id as any, keys)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ShortcutsView;
