import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import compression from 'vite-plugin-compression';

export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: true
        }),
        compression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 0,
            deleteOriginFile: false
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'Modkey',
            fileName: 'modkey',
            formats: ['es']
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    }
});
