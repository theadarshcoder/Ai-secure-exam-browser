import { loader } from "@monaco-editor/react";

// Singleton Engine Storage
window.__VISION_AI_ENGINE__ = window.__VISION_AI_ENGINE__ || {
    model: null,
    isPrewarming: false,
    isReady: false,
};

const ENGINE = window.__VISION_AI_ENGINE__;

/**
 * 🚀 Monaco Worker Pre-warm: Fetches CDN assets and initializes workers
 */
export const preloadMonaco = async () => {
    try {
        loader.config({
            paths: {
                vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
            },
            'vs/nls': { availableLanguages: { '*': 'en' } }
        });
        // This triggers the loader initialization without mounting the editor
        await loader.init();
        console.log("🎨 Monaco: Workers Pre-warmed");
    } catch (err) {
        console.warn("🎨 Monaco: Pre-warm failed", err);
    }
};

/**
 * 🧠 AI Model Pre-warm: Loads COCO-SSD and performs dummy inference
 */
export const preloadAIModels = async () => {
    if (ENGINE.isReady || ENGINE.isPrewarming) return;

    ENGINE.isPrewarming = true;
    console.log("🧠 AI: Pre-warming background engine...");

    try {
        // Ensure cocoSsd is available on window (loaded via index.html scripts)
        if (!window.cocoSsd) {
            console.warn("🧠 AI: coco-ssd script not found on window yet.");
            ENGINE.isPrewarming = false;
            return;
        }

        // 1. Load Model
        const model = await window.cocoSsd.load();
        ENGINE.model = model;

        // 2. Dummy Inference (Warm up shaders/kernels)
        const dummyCanvas = document.createElement("canvas");
        dummyCanvas.width = 10;
        dummyCanvas.height = 10;
        await model.detect(dummyCanvas);

        ENGINE.isReady = true;
        console.log("🚀 AI: Background Engine Ready (Warm-up complete)");
    } catch (err) {
        console.error("🧠 AI: Pre-warm failed", err);
    } finally {
        ENGINE.isPrewarming = false;
    }
};

/**
 * 🏁 Global Prewarm Entry Point (Fire-and-Forget)
 */
export const prewarmAll = () => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 3000));
    
    idle(async () => {
        // Staged loading to avoid main thread choke
        await preloadMonaco();
        
        // Wait another bit for AI
        setTimeout(() => {
            preloadAIModels().catch(() => {});
        }, 1000);
    });
};

export default {
    prewarmAll,
    preloadMonaco,
    preloadAIModels,
    getEngine: () => ENGINE
};
