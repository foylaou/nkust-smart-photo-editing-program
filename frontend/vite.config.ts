import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import electron from 'vite-plugin-electron/simple'
import path from 'path'
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        electron({
            main: {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron', 'electron-store'],
                            output: {
                                format: 'es',
                                entryFileNames: '[name].js'
                            }
                        }
                    },
                    resolve: {
                        alias: {
                            '@': path.resolve(__dirname, './electron')
                        }
                    }
                }
            },
            preload: {
                input: 'electron/preload.ts',
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['electron'],
                            output: {
                                format: 'cjs',
                                entryFileNames: '[name].cjs'
                            }
                        }
                    }
                }
            }
        })
    ],
    build: {
        outDir: 'dist'
    }
})

