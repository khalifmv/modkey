// Core exports
export { ShortcutManager, createShortcutManager } from './manager';
export { Store, EventEmitter, createStore } from './emitter';

// Utility exports
export {
    normalizeKey,
    getPlatform,
    isMac,
    resolvePlatformModifier,
    parseKeyCombination,
    matchesKeyCombination,
    detectConflicts,
    formatKeyCombo
} from './utils';

// Type exports
export type {
    ModifierKey,
    PlatformModifier,
    ShortcutConfig,
    ShortcutEvent,
    ShortcutCallback,
    ShortcutSubscription,
    ShortcutManagerOptions,
    Listener,
    Unsubscribe
} from './types';
