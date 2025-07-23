"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'lib/',
                'test/',
                '*.config.ts'
            ]
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXN0LmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZpdGVzdC5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwwQ0FBNkM7QUFFN0Msa0JBQWUsSUFBQSxxQkFBWSxFQUFDO0lBQzFCLElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxJQUFJO1FBQ2IsV0FBVyxFQUFFLE1BQU07UUFDbkIsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUM7UUFDOUIsUUFBUSxFQUFFO1lBQ1IsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7WUFDbEMsT0FBTyxFQUFFO2dCQUNQLGVBQWU7Z0JBQ2YsTUFBTTtnQkFDTixPQUFPO2dCQUNQLGFBQWE7YUFDZDtTQUNGO0tBQ0Y7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdub2RlJyxcbiAgICBpbmNsdWRlOiBbJ3Rlc3QvKiovKi50ZXN0LnRzJ10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcbiAgICAgICAgJ2xpYi8nLFxuICAgICAgICAndGVzdC8nLFxuICAgICAgICAnKi5jb25maWcudHMnXG4gICAgICBdXG4gICAgfVxuICB9XG59KTsiXX0=