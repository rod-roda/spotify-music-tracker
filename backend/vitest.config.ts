import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        pool: 'forks',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: [
                'src/utils/**',
                'src/services/**',
                'src/middlewares/**',
                'src/controllers/**',
                'src/repositories/**',
            ],
            exclude: [
                'src/config/**',
                'src/routes/**',
                'src/server.ts',
                'src/app.ts',
            ],
        },
    },
});
