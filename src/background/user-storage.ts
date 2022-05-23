import {DEFAULT_SETTINGS} from '../defaults';
import {isURLMatched} from '../utils/url';
import {UserSettings} from '../definitions';

const SAVE_TIMEOUT = 1000;

export default class UserStorage {
    constructor() {
        this.settings = null;
    }

    settings: Readonly<UserSettings>;

    async loadSettings() {
        this.settings = await this.loadSettingsFromStorage();
    }

    cleanup() {
        chrome.storage.local.remove(['activationTime', 'deactivationTime']);
        chrome.storage.sync.remove(['activationTime', 'deactivationTime']);
    }

    private loadSettingsFromStorage() {
        return new Promise<UserSettings>((resolve) => {
            chrome.storage.local.get(DEFAULT_SETTINGS, (local: UserSettings) => {
                if (!local.syncSettings) {
                    local.theme = {...DEFAULT_SETTINGS.theme, ...local.theme};
                    local.time = {...DEFAULT_SETTINGS.time, ...local.time};
                    resolve(local);
                    return;
                }

                chrome.storage.sync.get({...DEFAULT_SETTINGS, config: 'empty'}, ($sync: UserSettings & {config: any}) => {
                    let sync: UserSettings;
                    if ($sync.config === 'empty') {
                        delete $sync.config;
                        sync = $sync;
                    } else {
                        sync = this.migrateSettings_4_6_2($sync) as UserSettings;
                    }
                    sync.theme = {...DEFAULT_SETTINGS.theme, ...sync.theme};
                    sync.time = {...DEFAULT_SETTINGS.time, ...sync.time};
                    resolve(sync);
                });
            });
        });
    }

    async saveSettings() {
        const saved = await this.saveSettingsIntoStorage(this.settings);
        this.settings = saved;
    }

    private saveSettingsIntoStorage(settings: UserSettings) {
        if (this.timeout) {
            clearInterval(this.timeout);
        }
        return new Promise<UserSettings>((resolve) => {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                if (settings.syncSettings) {
                    chrome.storage.sync.set(settings, () => {
                        if (chrome.runtime.lastError) {
                            console.warn('Settings synchronization was disabled due to error:', chrome.runtime.lastError);
                            const local: UserSettings = {...settings, syncSettings: false};
                            chrome.storage.local.set(local, () => resolve(local));
                        } else {
                            resolve(settings);
                        }
                    });
                } else {
                    chrome.storage.local.set(settings, () => resolve(settings));
                }
            }, SAVE_TIMEOUT);
        });
    }

    private timeout: number = null;

    set($settings: Partial<UserSettings>) {
        if ($settings.siteList) {
            if (!Array.isArray($settings.siteList)) {
                const list = [];
                for (const key in ($settings.siteList as any)) {
                    const index = Number(key);
                    if (!isNaN(index)) {
                        list[index] = $settings.siteList[key];
                    }
                }
                $settings.siteList = list;
            }
            const siteList = $settings.siteList.filter((pattern) => {
                let isOK = false;
                try {
                    isURLMatched('https://google.com/', pattern);
                    isOK = true;
                } catch (err) {
                    console.warn(`Pattern "${pattern}" excluded`);
                }
                return isOK && pattern !== '/';
            });
            $settings = {...$settings, siteList};
        }
        this.settings = {...this.settings, ...$settings};
    }

    private migrateSettings_4_6_2(settings_4_6_2: any) {
        function migrateTheme(filterConfig_4_6_2: any) {
            const f = filterConfig_4_6_2;
            return {
                mode: f.mode,
                brightness: f.brightness,
                contrast: f.contrast,
                grayscale: f.grayscale,
                sepia: f.sepia,
                useFont: f.useFont,
                fontFamily: f.fontFamily,
                textStroke: f.textStroke,
                engine: f.engine,
                stylesheet: f.stylesheet,
                scrollbarColor: f.scrollbarColor,
                selectionColor: f.selectionColor,
            };
        }

        try {
            const s = settings_4_6_2;
            const settings: UserSettings = {
                ...DEFAULT_SETTINGS,
                enabled: s.enabled,
                theme: migrateTheme(s.config),
                customThemes: s.config.custom ? s.config.custom.map((c) => {
                    return {
                        url: c.url,
                        theme: migrateTheme(c.config),
                    };
                }) : [],
                siteList: s.config.siteList,
                applyToListedOnly: s.config.invertListed,
                changeBrowserTheme: s.config.changeBrowserTheme,
            };
            chrome.storage.sync.remove('config');
            chrome.storage.sync.set(settings);
            return settings;
        } catch (err) {
            console.error('Settings migration error:', err, 'Loaded settings:', settings_4_6_2);
            return DEFAULT_SETTINGS;
        }
    }
}
