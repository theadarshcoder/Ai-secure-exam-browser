import { loader } from "@monaco-editor/react";

// Singleton Engine Storage
window.__VISION_AI_ENGINE__ = window.__VISION_AI_ENGINE__ || {
    model: null,
    isPrewarming: false,
    isReady: false,
};

const ENGINE = window.__VISION_AI_ENGINE__;

/**
 * 🛠️ Utility: Dynamically Load Script
 */
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

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
        // 🚀 Step 1: Ensure TensorFlow & COCO-SSD are loaded
        // Safety Check: Avoid double loading or memory leaks
        if (!window.tf) {
            console.log("🧠 AI: Loading TensorFlow Core...");
            await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js");
        }

        if (!window.cocoSsd) {
            console.log("🧠 AI: Loading COCO-SSD Model Bundle...");
            await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
        }

        // 2. Load Model
        console.log("🧠 AI: Initializing Object Detection Model...");
        const model = await window.cocoSsd.load();
        ENGINE.model = model;

        // 3. Dummy Inference (Warm up shaders/kernels)
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
        
        // Wait another bit for AI to ensure main thread is free
        setTimeout(() => {
            preloadAIModels().catch(() => {});
        }, 1500);
    });
};

export default {
    prewarmAll,
    preloadMonaco,
    preloadAIModels,
    getEngine: () => ENGINE
};
