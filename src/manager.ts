import type {
    ShortcutConfig,
    ShortcutEvent,
    ShortcutCallback,
    ShortcutSubscription,
    ShortcutManagerOptions
} from './types';
import { Store, createStore, EventEmitter } from './emitter';
import { matchesKeyCombination, detectConflicts } from './utils';

// Modifier keys that should not be auto-cleared
const MODIFIER_KEYS = new Set(['meta', 'control', 'alt', 'shift']);

export class ShortcutManager {
    public readonly shortcuts: Store<Map<string, ShortcutConfig>>;
    public readonly lastTriggeredShortcut: Store<ShortcutEvent | null>;
    public readonly pressedKeys: Store<Set<string>>;

    private readonly triggerEmitter: EventEmitter<ShortcutEvent>;

    private subscribers: Map<string, Set<ShortcutCallback>> = new Map();
    private isInitialized = false;
    private currentScope: string;
    private debug: boolean;

    constructor(options: ShortcutManagerOptions = {}) {
        const { shortcuts: initialShortcuts = [], scope = 'global', debug = false } = options;

        this.currentScope = scope;
        this.debug = debug;

        this.shortcuts = createStore<Map<string, ShortcutConfig>>(new Map());
        this.lastTriggeredShortcut = createStore<ShortcutEvent | null>(null);
        this.pressedKeys = createStore<Set<string>>(new Set());
        this.triggerEmitter = new EventEmitter<ShortcutEvent>();

        if (initialShortcuts.length > 0) {
            this.loadShortcuts(initialShortcuts);
        }
    }

    init(): void {
        if (this.isInitialized) return;
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        this.isInitialized = true;

        this.log('Modkey initialized');
    }

    destroy(): void {
        if (!this.isInitialized) return;
        if (typeof window === 'undefined') return;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleBlur);
        this.isInitialized = false;

        this.log('Modkey destroyed');
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        this.pressedKeys.update(keys => {
            const newKeys = new Set(keys);
            newKeys.add(event.key.toLowerCase());
            return newKeys;
        });

        const currentShortcuts = this.shortcuts.get();

        // Find matching shortcut
        for (const [id, config] of currentShortcuts) {
            if (config.enabled === false) continue;

            // Check scope
            if (config.scope && config.scope !== this.currentScope && config.scope !== 'global') {
                continue;
            }

            // Check if keys match
            if (matchesKeyCombination(event, config.keys)) {
                // Prevent default if configured (default: true)
                if (config.preventDefault !== false) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                // Create shortcut event
                const shortcutEvent: ShortcutEvent = {
                    id,
                    timestamp: Date.now(),
                    originalEvent: event
                };

                // Update last triggered shortcut
                this.lastTriggeredShortcut.set(shortcutEvent);

                // Emit to global listeners
                this.triggerEmitter.emit(shortcutEvent);

                // Notify specific subscribers
                this.notifySubscribers(id, shortcutEvent);

                // Clear non-modifier keys after shortcut triggers
                // This prevents stuck keys when keyup doesn't fire (common with preventDefault)
                this.clearNonModifierKeys();

                this.log(`Shortcut triggered: ${id}`);

                break; // Only trigger first match
            }
        }
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        this.pressedKeys.update(keys => {
            const newKeys = new Set(keys);
            newKeys.delete(event.key.toLowerCase());
            return newKeys;
        });
    };

    private handleBlur = (): void => {
        this.pressedKeys.set(new Set());
    };

    /**
     * Clear all non-modifier keys from pressedKeys
     * This is needed because keyup events may not fire after preventDefault
     */
    private clearNonModifierKeys(): void {
        this.pressedKeys.update(keys => {
            const newKeys = new Set<string>();
            for (const key of keys) {
                if (MODIFIER_KEYS.has(key)) {
                    newKeys.add(key);
                }
            }
            return newKeys;
        });
    }

    subscribe(id: string, callback: ShortcutCallback): ShortcutSubscription {
        if (!this.subscribers.has(id)) {
            this.subscribers.set(id, new Set());
        }

        this.subscribers.get(id)!.add(callback);

        return {
            id,
            callback,
            unsubscribe: () => {
                this.unsubscribe(id, callback);
            }
        };
    }

    onTrigger(callback: ShortcutCallback): () => void {
        return this.triggerEmitter.subscribe(callback);
    }

    private unsubscribe(id: string, callback: ShortcutCallback): void {
        const callbacks = this.subscribers.get(id);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(id);
            }
        }
    }

    private notifySubscribers(id: string, event: ShortcutEvent): void {
        const callbacks = this.subscribers.get(id);
        if (callbacks) {
            callbacks.forEach(callback => callback(event));
        }
    }

    private loadShortcuts(configs: ShortcutConfig[]): void {
        const shortcutMap = new Map(configs.map(c => [c.id, c]));
        this.shortcuts.set(shortcutMap);
        this.checkConflicts();
    }

    registerShortcut(config: ShortcutConfig): void {
        this.shortcuts.update(map => {
            const newMap = new Map(map);
            newMap.set(config.id, config);
            return newMap;
        });
        this.checkConflicts();
        this.log(`Shortcut registered: ${config.id}`);
    }

    registerShortcuts(configs: ShortcutConfig[]): void {
        this.shortcuts.update(map => {
            const newMap = new Map(map);
            configs.forEach(config => {
                newMap.set(config.id, config);
            });
            return newMap;
        });
        this.checkConflicts();
        this.log(`${configs.length} shortcuts registered`);
    }

    unregisterShortcut(id: string): void {
        this.shortcuts.update(map => {
            const newMap = new Map(map);
            newMap.delete(id);
            return newMap;
        });
        this.log(`Shortcut unregistered: ${id}`);
    }

    enableShortcut(id: string): void {
        this.shortcuts.update(map => {
            const newMap = new Map(map);
            const shortcut = newMap.get(id);
            if (shortcut) {
                newMap.set(id, { ...shortcut, enabled: true });
            }
            return newMap;
        });
    }

    disableShortcut(id: string): void {
        this.shortcuts.update(map => {
            const newMap = new Map(map);
            const shortcut = newMap.get(id);
            if (shortcut) {
                newMap.set(id, { ...shortcut, enabled: false });
            }
            return newMap;
        });
    }

    getShortcut(id: string): ShortcutConfig | undefined {
        return this.shortcuts.get().get(id);
    }

    getAllShortcuts(): ShortcutConfig[] {
        return Array.from(this.shortcuts.get().values());
    }

    getActiveShortcuts(): ShortcutConfig[] {
        return this.getAllShortcuts().filter(s => s.enabled !== false);
    }

    setScope(scope: string): void {
        this.currentScope = scope;
        this.log(`Scope changed to: ${scope}`);
    }

    getScope(): string {
        return this.currentScope;
    }

    private checkConflicts(): void {
        const currentShortcuts = Array.from(this.shortcuts.get().values());
        const conflicts = detectConflicts(currentShortcuts);
        if (conflicts.length > 0) {
            console.warn('[Modkey] Detected shortcut conflicts:', conflicts);
        }
    }

    private log(message: string): void {
        if (this.debug) {
            console.log(`[Modkey] ${message}`);
        }
    }
}

export function createShortcutManager(options?: ShortcutManagerOptions): ShortcutManager {
    return new ShortcutManager(options);
}
