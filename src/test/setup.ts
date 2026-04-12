// src/test/setup.ts
import '@testing-library/jest-dom';

// react-resizable-panels が ResizeObserver を new で使うため
// class 構文でモックする必要がある（vi.fn().mockImplementation では new できない）
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}

globalThis.ResizeObserver = ResizeObserverMock;