import type { Listener, Unsubscribe } from './types';

/**
 * A simple, framework-agnostic event emitter
 */
export class EventEmitter<T = void> {
    private listeners: Set<Listener<T>> = new Set();

    /**
     * Subscribe to events
     */
    subscribe(listener: Listener<T>): Unsubscribe {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Emit an event to all listeners
     */
    emit(value: T): void {
        this.listeners.forEach(listener => listener(value));
    }

    /**
     * Get the number of active listeners
     */
    get size(): number {
        return this.listeners.size;
    }

    /**
     * Remove all listeners
     */
    clear(): void {
        this.listeners.clear();
    }
}

/**
 * A simple reactive store (similar to Svelte's writable store)
 */
export class Store<T> {
    private value: T;
    private listeners: Set<Listener<T>> = new Set();

    constructor(initialValue: T) {
        this.value = initialValue;
    }

    /**
     * Get the current value
     */
    get(): T {
        return this.value;
    }

    /**
     * Set a new value and notify all subscribers
     */
    set(newValue: T): void {
        this.value = newValue;
        this.notify();
    }

    /**
     * Update the value using an updater function
     */
    update(updater: (currentValue: T) => T): void {
        this.value = updater(this.value);
        this.notify();
    }

    /**
     * Subscribe to value changes
     * @param listener - Callback function that receives the value
     * @param immediate - If true, call the listener immediately with current value
     */
    subscribe(listener: Listener<T>, immediate = true): Unsubscribe {
        this.listeners.add(listener);

        if (immediate) {
            listener(this.value);
        }

        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all subscribers of the current value
     */
    private notify(): void {
        this.listeners.forEach(listener => listener(this.value));
    }

    /**
     * Get the number of active subscribers
     */
    get subscriberCount(): number {
        return this.listeners.size;
    }
}

/**
 * Create a new store with the given initial value
 */
export function createStore<T>(initialValue: T): Store<T> {
    return new Store(initialValue);
}
