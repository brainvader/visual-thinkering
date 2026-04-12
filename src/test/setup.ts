import '@testing-library/jest-dom';
import { vi } from 'vitest';

// React Flow等で必要なWeb APIのモック
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));