import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import { CloudClient } from './CloudClient';

export interface AppSettings {
    // Only boot-critical or non-encrypted settings should live here.
    // In the future, other non-secret data like 'language' or 'theme'
    // can be moved here from CredentialsManager to allow early boot access.
    isUndetectable?: boolean;
    disguiseMode?: 'terminal' | 'settings' | 'activity' | 'none';
    verboseLogging?: boolean;
    actionButtonMode?: 'recap' | 'brainstorm';
    groqFastTextMode?: boolean;
    knowledgeMode?: boolean;
}

export class SettingsManager {
    private static instance: SettingsManager;
    private settings: AppSettings = {};
    private settingsPath: string;
    private cloudPushTimer: NodeJS.Timeout | null = null;
    private hydrated = false;

    private constructor() {
        if (!app.isReady()) {
            throw new Error('[SettingsManager] Cannot initialize before app.whenReady()');
        }
        this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
        this.loadSettings();
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    public get<K extends keyof AppSettings>(key: K): AppSettings[K] {
        return this.settings[key];
    }

    public set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
        this.settings[key] = value;
        this.saveSettings();      // local boot cache (sync, always)
        this.scheduleCloudPush(); // cloud sync (debounced, if signed in)
    }

    public isHydrated(): boolean {
        return this.hydrated;
    }

    /**
     * Reconcile local settings with the per-account cloud copy. Call after login. The local
     * settings.json remains the boot cache (read synchronously before auth resolves); this just
     * converges devices. Cloud values win for keys it defines; if the cloud is empty we seed it
     * from the current local settings.
     */
    public async hydrateFromCloud(): Promise<void> {
        try {
            const cloud = await CloudClient.getInstance().getSettings();
            if (cloud && Object.keys(cloud).length > 0) {
                this.settings = { ...this.settings, ...(cloud as AppSettings) };
                this.saveSettings();
            } else {
                await CloudClient.getInstance().putSettings(this.settings as Record<string, unknown>);
            }
            this.hydrated = true;
        } catch (e) {
            console.error('[SettingsManager] hydrateFromCloud failed:', e);
        }
    }

    private scheduleCloudPush(): void {
        if (!CloudClient.getInstance().isAuthenticated()) return;
        if (this.cloudPushTimer) clearTimeout(this.cloudPushTimer);
        this.cloudPushTimer = setTimeout(() => {
            CloudClient.getInstance()
                .putSettings(this.settings as Record<string, unknown>)
                .catch(e => console.error('[SettingsManager] cloud push failed:', e));
        }, 800);
        if (this.cloudPushTimer.unref) this.cloudPushTimer.unref();
    }

    private loadSettings(): void {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                try {
                    const parsed = JSON.parse(data);
                    // Minimal validation to ensure it's an object before assigning
                    if (typeof parsed === 'object' && parsed !== null) {
                        this.settings = parsed;
                        console.log('[SettingsManager] Settings loaded successfully:', JSON.stringify(this.settings));
                    } else {
                        throw new Error('Settings JSON is not a valid object');
                    }
                } catch (parseError) {
                    console.error('[SettingsManager] Failed to parse settings.json. Continuing with empty settings. Error:', parseError);
                    this.settings = {};
                }
                console.log('[SettingsManager] Settings loaded');
            }
        } catch (e) {
            console.error('[SettingsManager] Failed to read settings file:', e);
            this.settings = {};
        }
    }

    private saveSettings(): void {
        try {
            const tmpPath = this.settingsPath + '.tmp';
            fs.writeFileSync(tmpPath, JSON.stringify(this.settings, null, 2));
            fs.renameSync(tmpPath, this.settingsPath);
        } catch (e) {
            console.error('[SettingsManager] Failed to save settings:', e);
        }
    }
}
