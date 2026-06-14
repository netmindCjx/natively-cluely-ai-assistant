import type { TFunction } from 'i18next';

export const getDateLocale = (language?: string) =>
    language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';

export const formatLocalizedDate = (
    date: Date | string,
    language: string | undefined,
    options: Intl.DateTimeFormatOptions
) => {
    const value = date instanceof Date ? date : new Date(date);
    return value.toLocaleDateString(getDateLocale(language), options);
};

export const getDisplayMeetingTitle = (title: string | undefined, t: TFunction) => {
    if (!title || title === 'Untitled Session' || title === 'Untitled Meeting') {
        return t('meetingDetails.untitledSession');
    }
    return title;
};

export const getAiLanguageDisplayName = (code: string, label: string | undefined, t: TFunction) => {
    if (code === 'auto') return t('common.auto');
    const key = `settings.general.aiLanguage.options.${code}`;
    const translated = t(key);
    return translated === key ? (label || code) : translated;
};
