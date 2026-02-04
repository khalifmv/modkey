/**
 * Modifier key types
 */
export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * Platform-agnostic modifier that maps to Cmd on Mac, Ctrl on Windows/Linux
 */
export type PlatformModifier = 'mod';

/**
 * Configuration for a keyboard shortcut
 */
export interface ShortcutConfig {
    /** Unique identifier (e.g., 'save', 'undo') */
    id: string;
    /** Display name (e.g., 'Save') */
    name: string;
    /** Description for help/documentation */
    description: string;
    /** Key combination (e.g., 'mod+s', 'ctrl+shift+z') */
    keys: string;
    /** Prevent default browser behavior (default: true) */
    preventDefault?: boolean;
    /** Whether shortcut is currently active (default: true) */
    enabled?: boolean;
    /** Optional scope (e.g., 'editor', 'global') */
    scope?: string;
}

/**
 * Event data passed to shortcut callbacks
 */
export interface ShortcutEvent {
    /** The shortcut ID that was triggered */
    id: string;
    /** Timestamp when the shortcut was triggered */
    timestamp: number;
    /** The original keyboard event */
    originalEvent: KeyboardEvent;
}

/**
 * Callback function type for shortcut handlers
 */
export type ShortcutCallback = (event: ShortcutEvent) => void;

/**
 * Subscription object returned when subscribing to a shortcut
 */
export interface ShortcutSubscription {
    /** The shortcut ID */
    id: string;
    /** The callback function */
    callback: ShortcutCallback;
    /** Function to unsubscribe */
    unsubscribe: () => void;
}

/**
 * Listener function type for stores
 */
export type Listener<T> = (value: T) => void;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Options for initializing the ShortcutManager
 */
export interface ShortcutManagerOptions {
    /** Initial shortcuts to register */
    shortcuts?: ShortcutConfig[];
    /** Initial scope (default: 'global') */
    scope?: string;
    /** Enable debug logging (default: false) */
    debug?: boolean;
}
