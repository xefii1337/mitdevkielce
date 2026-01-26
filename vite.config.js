import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'public_html',
    base: './',
    envDir: '../',
    server: {
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public_html/index.html'),
                admin: resolve(__dirname, 'public_html/admin.html'),
                login: resolve(__dirname, 'public_html/login.html'),
                products: resolve(__dirname, 'public_html/products.html'),
                productDetails: resolve(__dirname, 'public_html/product-details.html'),
                seoReport: resolve(__dirname, 'public_html/seo_report.html')
            }
        }
    }
});
