import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('delays function execution by wait time', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 100);

        debouncedFn();
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 100);

        debouncedFn();
        vi.advanceTimersByTime(50);

        debouncedFn(); // Reset timer
        vi.advanceTimersByTime(50);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('only calls function once for rapid calls', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();
        debouncedFn();
        debouncedFn();

        vi.advanceTimersByTime(100);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to the debounced function', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 100);

        debouncedFn('arg1', 'arg2', 123);
        vi.advanceTimersByTime(100);

        expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('uses arguments from the last call', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 100);

        debouncedFn('first');
        debouncedFn('second');
        debouncedFn('third');

        vi.advanceTimersByTime(100);
        expect(callback).toHaveBeenCalledWith('third');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('handles zero wait time', () => {
        const callback = vi.fn();
        const debouncedFn = debounce(callback, 0);

        debouncedFn();
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(0);
        expect(callback).toHaveBeenCalledTimes(1);
    });

});

