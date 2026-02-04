import type { ShortcutConfig } from './types';

export function normalizeKey(key: string): string {
    return key.toLowerCase();
}

export function getPlatform(): 'mac' | 'windows' | 'linux' {
    if (typeof navigator === 'undefined') return 'linux';

    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    return 'linux';
}

export function isMac(): boolean {
    return getPlatform() === 'mac';
}

export function resolvePlatformModifier(keys: string): string {
    const modifier = isMac() ? 'meta' : 'ctrl';
    return keys.replace(/\bmod\b/g, modifier);
}

export function parseKeyCombination(keys: string): {
    modifiers: Set<string>;
    key: string;
} {
    const parts = resolvePlatformModifier(keys)
        .toLowerCase()
        .split('+')
        .map(p => p.trim());

    const key = parts[parts.length - 1];
    const modifiers = new Set(parts.slice(0, -1));

    return { modifiers, key };
}

export function matchesKeyCombination(
    event: KeyboardEvent,
    keys: string
): boolean {
    const { modifiers, key } = parseKeyCombination(keys);
    const eventKey = normalizeKey(event.key);

    // Check if the main key matches
    if (eventKey !== key) return false;

    const hasCtrl = modifiers.has('ctrl') === event.ctrlKey;
    const hasShift = modifiers.has('shift') === event.shiftKey;
    const hasAlt = modifiers.has('alt') === event.altKey;
    const hasMeta = modifiers.has('meta') === event.metaKey;

    return hasCtrl && hasShift && hasAlt && hasMeta;
}

export function detectConflicts(
    shortcuts: ShortcutConfig[]
): Array<{ id1: string; id2: string; keys: string }> {
    const conflicts: Array<{ id1: string; id2: string; keys: string }> = [];
    const seenKeys = new Map<string, string>();

    for (const shortcut of shortcuts) {
        const normalizedKeys = resolvePlatformModifier(shortcut.keys).toLowerCase();
        const existing = seenKeys.get(normalizedKeys);

        if (existing) {
            conflicts.push({
                id1: existing,
                id2: shortcut.id,
                keys: normalizedKeys
            });
        } else {
            seenKeys.set(normalizedKeys, shortcut.id);
        }
    }

    return conflicts;
}

export function formatKeyCombo(keys: string): string {
    const platform = getPlatform();

    const keyMap: Record<string, Record<string, string>> = {
        mac: {
            mod: '⌘',
            meta: '⌘',
            ctrl: '⌃',
            alt: '⌥',
            shift: '⇧',
            enter: '↵',
            backspace: '⌫',
            delete: '⌦',
            escape: '⎋',
            arrowup: '↑',
            arrowdown: '↓',
            arrowleft: '←',
            arrowright: '→',
            tab: '⇥'
        },
        windows: {
            mod: 'Ctrl',
            meta: 'Win',
            ctrl: 'Ctrl',
            alt: 'Alt',
            shift: 'Shift',
            enter: 'Enter',
            backspace: 'Backspace',
            delete: 'Delete',
            escape: 'Esc',
            arrowup: '↑',
            arrowdown: '↓',
            arrowleft: '←',
            arrowright: '→',
            tab: 'Tab'
        },
        linux: {
            mod: 'Ctrl',
            meta: 'Super',
            ctrl: 'Ctrl',
            alt: 'Alt',
            shift: 'Shift',
            enter: 'Enter',
            backspace: 'Backspace',
            delete: 'Delete',
            escape: 'Esc',
            arrowup: '↑',
            arrowdown: '↓',
            arrowleft: '←',
            arrowright: '→',
            tab: 'Tab'
        }
    };

    const mapping = keyMap[platform];
    const separator = platform === 'mac' ? '' : '+';

    return keys
        .toLowerCase()
        .split('+')
        .map(part => {
            const trimmed = part.trim();
            return mapping[trimmed] || trimmed.toUpperCase();
        })
        .join(separator);
}
