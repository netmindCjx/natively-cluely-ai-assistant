import { CloudClient } from './CloudClient';
import {
    MODE_GENERAL_PROMPT,
    MODE_LOOKING_FOR_WORK_PROMPT,
    MODE_SALES_PROMPT,
    MODE_RECRUITING_PROMPT,
    MODE_TEAM_MEET_PROMPT,
    MODE_LECTURE_PROMPT,
    MODE_TECHNICAL_INTERVIEW_PROMPT,
} from '../llm/prompts';

export type ModeTemplateType =
    | 'general'
    | 'looking-for-work'
    | 'sales'
    | 'recruiting'
    | 'team-meet'
    | 'lecture'
    | 'technical-interview';

export interface Mode {
    id: string;
    name: string;
    templateType: ModeTemplateType;
    customContext: string;
    isActive: boolean;
    createdAt: string;
}

export interface ModeReferenceFile {
    id: string;
    modeId: string;
    fileName: string;
    content: string;
    createdAt: string;
}

export interface ModeNoteSection {
    id: string;
    modeId: string;
    title: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export const MODE_TEMPLATES: Array<{
    type: ModeTemplateType;
    label: string;
    description: string;
}> = [
    { type: 'sales',            label: 'Sales',            description: 'Close deals with strategic discovery and objection handling.' },
    { type: 'recruiting',       label: 'Recruiting',       description: 'Evaluate candidates with structured interview insights.' },
    { type: 'team-meet',        label: 'Team Meet',        description: 'Track action items and key decisions from meetings.' },
    { type: 'looking-for-work', label: 'Looking for work', description: 'Answer interview questions with confidence and clarity.' },
    { type: 'lecture',          label: 'Lecture',          description: 'Capture key concepts and content from lectures.' },
];

// Default note sections seeded when a mode is created from a template
export const TEMPLATE_NOTE_SECTIONS: Record<ModeTemplateType, Array<{ title: string; description: string }>> = {
    general: [
        { title: 'Summary',      description: 'High-level summary of the conversation.' },
        { title: 'Action items', description: 'Tasks and follow-ups identified.' },
        { title: 'Key points',   description: 'Important points discussed.' },
    ],
    'looking-for-work': [
        { title: 'Follow-up actions',      description: 'Next interview steps or additional materials I said I would send if applicable.' },
        { title: 'Overview',               description: 'Overview of the interview, the company, and general structure.' },
        { title: 'Questions and responses', description: 'All questions asked to me during the interview and answers that gave.' },
        { title: 'Areas to improve',       description: 'What I could have done better during the interview.' },
        { title: 'Role details',           description: 'Anything discussed about the position, salary expectations, etc.' },
    ],
    sales: [
        { title: 'Action Items',         description: 'All action items that were said I would do after the meeting.' },
        { title: 'Outcome',              description: 'Did I close the sale and what was the outcome of the conversation.' },
        { title: 'Prospect background',  description: 'Background and context on who I was selling to.' },
        { title: 'Discovery',            description: 'What the prospect said during discovery.' },
        { title: 'Product',              description: "How I pitched the product and the prospect's reaction." },
        { title: 'Objections',           description: 'Objections from the prospect if there were any.' },
    ],
    recruiting: [
        { title: 'Action Items',          description: 'All action items that I have to do after the meeting.' },
        { title: 'Experience and skills', description: "Candidate's previous work experience and skills discussed." },
        { title: 'Quality of responses',  description: 'If there were questions asked, how well and how accurately the candidate answered each question.' },
        { title: 'Interest in company',   description: 'What the candidate said about their interest in the company.' },
        { title: 'Role expectations',     description: 'Anything discussed about the position, salary expectations, etc.' },
    ],
    'team-meet': [
        { title: 'Action Items',          description: 'All action items that were said I would do after the meeting.' },
        { title: 'Announcements',         description: 'Any team-wide announcements from the meeting.' },
        { title: 'Team updates',          description: "Each team member's progress, accomplishments, and current focus." },
        { title: 'Challenges or blockers', description: 'Any issues or obstacles raised that may affect progress.' },
        { title: 'Decisions made',        description: 'Key decisions or agreements reached during the meeting.' },
    ],
    lecture: [
        { title: 'Follow-up work',  description: 'Follow-up reading, assignments, or tasks to complete.' },
        { title: 'Topic',           description: 'Main subject or theme of the lecture.' },
        { title: 'Key concepts',    description: 'Core ideas or frameworks covered.' },
        { title: 'Content',         description: 'All content from the lecture with incredibly detailed bullet notes.' },
    ],
    'technical-interview': [
        { title: 'Problems covered',  description: 'Each problem asked, the approach used, and the outcome.' },
        { title: 'Concepts tested',   description: 'Key algorithms, data structures, or system design concepts that came up.' },
        { title: 'What went well',    description: 'Approaches or explanations that landed well.' },
        { title: 'Areas to study',    description: 'Topics or gaps identified that need more preparation.' },
        { title: 'Action items',      description: 'Follow-up steps — e.g. send code, study specific topics, await next round.' },
    ],
};

const TEMPLATE_SYSTEM_PROMPTS: Record<ModeTemplateType, string> = {
    // General = universal adaptive copilot (own prompt, not technical interview)
    general: MODE_GENERAL_PROMPT,
    'technical-interview': MODE_TECHNICAL_INTERVIEW_PROMPT,

    'looking-for-work': MODE_LOOKING_FOR_WORK_PROMPT,
    sales: MODE_SALES_PROMPT,
    recruiting: MODE_RECRUITING_PROMPT,
    'team-meet': MODE_TEAM_MEET_PROMPT,
    lecture: MODE_LECTURE_PROMPT,
};

function rowToMode(row: any): Mode {
    return {
        id: row.id,
        name: row.name,
        templateType: row.template_type as ModeTemplateType,
        customContext: row.custom_context ?? '',
        // Backend returns is_active as a boolean (Postgres); tolerate the old 1/0 too.
        isActive: row.is_active === true || row.is_active === 1,
        createdAt: row.created_at,
    };
}

function rowToFile(row: any): ModeReferenceFile {
    return {
        id: row.id,
        modeId: row.mode_id,
        fileName: row.file_name,
        content: row.content ?? '',
        createdAt: row.created_at,
    };
}

function rowToSection(row: any): ModeNoteSection {
    return {
        id: row.id,
        modeId: row.mode_id,
        title: row.title,
        description: row.description ?? '',
        sortOrder: row.sort_order ?? 0,
        createdAt: row.created_at,
    };
}

export class ModesManager {
    private static instance: ModesManager;

    // In-memory cache so the public API stays synchronous (LLMHelper builds prompts on a
    // latency-sensitive path). Hydrated from the cloud on login via hydrate(); mutations update
    // the cache optimistically and write through to the backend (fire-and-forget + log).
    private modesCache: Mode[] = [];
    private sectionsCache: Map<string, ModeNoteSection[]> = new Map();
    private filesCache: Map<string, ModeReferenceFile[]> = new Map();
    private hydrated = false;

    private constructor() {}

    public static getInstance(): ModesManager {
        if (!ModesManager.instance) {
            ModesManager.instance = new ModesManager();
        }
        return ModesManager.instance;
    }

    private get cloud() {
        return CloudClient.getInstance();
    }

    private fire(p: Promise<any>, label: string): void {
        Promise.resolve(p).catch(e => console.error(`[ModesManager] ${label} failed:`, e));
    }

    /**
     * Load all modes (+ their note sections and reference files) from the cloud into the cache.
     * Call after the user is authenticated. Safe to call repeatedly. The backend lazily seeds a
     * default "General" mode on first read, so no client-side seeding is needed.
     */
    public async hydrate(): Promise<void> {
        try {
            const modeRows = (await this.cloud.getModes()) || [];
            this.modesCache = modeRows.map(rowToMode);
            this.sectionsCache.clear();
            this.filesCache.clear();
            await Promise.all(
                this.modesCache.map(async mode => {
                    const [sections, files] = await Promise.all([
                        this.cloud.getNoteSections(mode.id),
                        this.cloud.getReferenceFiles(mode.id),
                    ]);
                    this.sectionsCache.set(mode.id, (sections || []).map(rowToSection));
                    this.filesCache.set(mode.id, (files || []).map(rowToFile));
                }),
            );
            this.hydrated = true;
        } catch (e) {
            console.error('[ModesManager] hydrate failed:', e);
        }
    }

    public isHydrated(): boolean {
        return this.hydrated;
    }

    // ── Modes ─────────────────────────────────────────────────────

    public getModes(): Mode[] {
        const modes = [...this.modesCache];
        // Enforce 'general' at the very top of the list.
        modes.sort((a, b) => {
            if (a.templateType === 'general') return -1;
            if (b.templateType === 'general') return 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return modes;
    }

    public getActiveMode(): Mode | null {
        return this.modesCache.find(m => m.isActive) ?? null;
    }

    public createMode(params: { name: string; templateType: ModeTemplateType }): Mode {
        const id = `mode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const mode: Mode = {
            id,
            name: params.name,
            templateType: params.templateType,
            customContext: '',
            isActive: false,
            createdAt: new Date().toISOString(),
        };
        this.modesCache.push(mode);
        this.fire(
            this.cloud.createMode({ id, name: params.name, template_type: params.templateType, custom_context: '' }),
            'createMode',
        );
        // Seed default note sections for this template type (cache + cloud).
        const defaultSections = TEMPLATE_NOTE_SECTIONS[params.templateType] ?? [];
        const sections: ModeNoteSection[] = [];
        defaultSections.forEach((s, i) => {
            const sectionId = `ns_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
            sections.push({ id: sectionId, modeId: id, title: s.title, description: s.description, sortOrder: i, createdAt: new Date().toISOString() });
            this.fire(
                this.cloud.addNoteSection(id, { id: sectionId, title: s.title, description: s.description, sort_order: i }),
                'createMode/addNoteSection',
            );
        });
        this.sectionsCache.set(id, sections);
        this.filesCache.set(id, []);
        return mode;
    }

    public updateMode(id: string, updates: { name?: string; templateType?: ModeTemplateType; customContext?: string }): void {
        const mode = this.modesCache.find(m => m.id === id);
        if (mode) {
            if (updates.name !== undefined) mode.name = updates.name;
            if (updates.templateType !== undefined) mode.templateType = updates.templateType;
            if (updates.customContext !== undefined) mode.customContext = updates.customContext;
        }
        const cloudUpdates: { name?: string; template_type?: string; custom_context?: string } = {};
        if (updates.name !== undefined) cloudUpdates.name = updates.name;
        if (updates.templateType !== undefined) cloudUpdates.template_type = updates.templateType;
        if (updates.customContext !== undefined) cloudUpdates.custom_context = updates.customContext;
        this.fire(this.cloud.updateMode(id, cloudUpdates), 'updateMode');
    }

    public deleteMode(id: string): void {
        this.modesCache = this.modesCache.filter(m => m.id !== id);
        this.sectionsCache.delete(id);
        this.filesCache.delete(id);
        this.fire(this.cloud.deleteMode(id), 'deleteMode');
    }

    public setActiveMode(id: string | null): void {
        this.modesCache.forEach(m => { m.isActive = m.id === id; });
        this.fire(this.cloud.setActiveMode(id), 'setActiveMode');
    }

    // ── Reference Files ───────────────────────────────────────────

    public getReferenceFiles(modeId: string): ModeReferenceFile[] {
        return this.filesCache.get(modeId) ?? [];
    }

    public addReferenceFile(params: { modeId: string; fileName: string; content: string }): ModeReferenceFile {
        const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const file: ModeReferenceFile = {
            id,
            modeId: params.modeId,
            fileName: params.fileName,
            content: params.content,
            createdAt: new Date().toISOString(),
        };
        const list = this.filesCache.get(params.modeId) ?? [];
        list.push(file);
        this.filesCache.set(params.modeId, list);
        this.fire(
            this.cloud.addReferenceFile(params.modeId, { id, file_name: params.fileName, content: params.content }),
            'addReferenceFile',
        );
        return file;
    }

    public deleteReferenceFile(id: string): void {
        for (const [modeId, list] of this.filesCache) {
            this.filesCache.set(modeId, list.filter(f => f.id !== id));
        }
        this.fire(this.cloud.deleteReferenceFile(id), 'deleteReferenceFile');
    }

    // ── Note Sections ─────────────────────────────────────────────

    public getNoteSections(modeId: string): ModeNoteSection[] {
        return this.sectionsCache.get(modeId) ?? [];
    }

    public addNoteSection(params: { modeId: string; title: string; description: string }): ModeNoteSection {
        const existingSections = this.getNoteSections(params.modeId);
        const sortOrder = existingSections.length;
        const id = `ns_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const section: ModeNoteSection = {
            id,
            modeId: params.modeId,
            title: params.title,
            description: params.description,
            sortOrder,
            createdAt: new Date().toISOString(),
        };
        this.sectionsCache.set(params.modeId, [...existingSections, section]);
        this.fire(
            this.cloud.addNoteSection(params.modeId, { id, title: params.title, description: params.description, sort_order: sortOrder }),
            'addNoteSection',
        );
        return section;
    }

    public updateNoteSection(id: string, updates: { title?: string; description?: string }): void {
        for (const [modeId, list] of this.sectionsCache) {
            const section = list.find(s => s.id === id);
            if (section) {
                if (updates.title !== undefined) section.title = updates.title;
                if (updates.description !== undefined) section.description = updates.description;
                this.sectionsCache.set(modeId, [...list]);
            }
        }
        this.fire(this.cloud.updateNoteSection(id, updates), 'updateNoteSection');
    }

    public deleteNoteSection(id: string): void {
        for (const [modeId, list] of this.sectionsCache) {
            this.sectionsCache.set(modeId, list.filter(s => s.id !== id));
        }
        this.fire(this.cloud.deleteNoteSection(id), 'deleteNoteSection');
    }

    public removeAllNoteSections(modeId: string): void {
        this.sectionsCache.set(modeId, []);
        this.fire(this.cloud.deleteAllNoteSections(modeId), 'removeAllNoteSections');
    }

    // ── LLM Context ───────────────────────────────────────────────

    /**
     * Returns the system prompt suffix for the active mode's template type.
     * Empty string if general or no active mode.
     */
    public getActiveModeSystemPromptSuffix(): string {
        const mode = this.getActiveMode();
        if (!mode) return '';
        return TEMPLATE_SYSTEM_PROMPTS[mode.templateType] ?? '';
    }

    /**
     * Builds a context block to inject before the user message for the active mode.
     * Includes custom context text and reference file contents.
     *
     * Limits: each file is capped at MAX_FILE_CHARS to prevent context window overflow.
     * Total block is capped at MAX_TOTAL_CHARS across all files.
     */
    private static readonly MAX_FILE_CHARS = 12_000;
    private static readonly MAX_TOTAL_CHARS = 40_000;

    public buildActiveModeContextBlock(): string {
        const mode = this.getActiveMode();
        if (!mode) return '';

        const parts: string[] = [];

        if (mode.customContext.trim()) {
            parts.push(`<user_context>\n${mode.customContext.trim()}\n</user_context>`);
        }

        const files = this.getReferenceFiles(mode.id);
        let totalChars = 0;

        for (const file of files) {
            const raw = file.content.trim();
            if (!raw) continue;

            const remaining = ModesManager.MAX_TOTAL_CHARS - totalChars;
            if (remaining <= 0) break;

            // Slice first, then append truncation marker so total never exceeds MAX_FILE_CHARS
            const capped = raw.length > ModesManager.MAX_FILE_CHARS
                ? raw.slice(0, ModesManager.MAX_FILE_CHARS - 14) + '\n[...truncated]'
                : raw;
            const used = Math.min(capped.length, remaining);
            const content = capped.slice(0, used);

            parts.push(`<reference_file name="${file.fileName}">\n${content}\n</reference_file>`);
            totalChars += content.length;
        }

        return parts.join('\n\n');
    }
}
