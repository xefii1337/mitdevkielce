import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'public_html',
    envDir: '../',
    server: {
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public_html/index.html')
            }
        }
    }
});
