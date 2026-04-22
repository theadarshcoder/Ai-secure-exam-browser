const babel = require('@babel/core');
const ivm = require('isolated-vm');
const { JSDOM } = require('jsdom');

/**
 * Evaluates Frontend React code against a set of test cases.
 * @param {Object} codeFiles - Map of files { '/App.jsx': '...' }
 * @param {Array} testCases - Array of { description, testCode }
 */
exports.evaluateFrontendCode = async (codeFiles, testCases) => {
    const startTime = Date.now();
    const results = [];
    let allPassed = true;

    try {
        const mainCode = codeFiles['/App.jsx'] || codeFiles['App.jsx'] || Object.values(codeFiles)[0];
        
        if (!mainCode) {
            throw new Error("Main file (App.jsx) not found in submission.");
        }

        // Step 1: Transpile JSX to plain JS
        let transpiledCode;
        try {
            transpiledCode = babel.transformSync(mainCode, {
                presets: ['@babel/preset-react'],
                filename: 'App.jsx'
            }).code;
        } catch (err) {
            return {
                passed: false,
                score: 0,
                errorMsg: `Transpilation Error: ${err.message}`,
                testCaseResults: []
            };
        }

        // Step 2: Security & Infinite Loop Check (isolated-vm)
        const isolate = new ivm.Isolate({ memoryLimit: 128 });
        const context = isolate.createContextSync();
        try {
            const script = isolate.compileScriptSync(transpiledCode);
            // Run for 2 seconds to check for immediate crashes or loops
            script.runSync(context, { timeout: 2000 });
        } catch (err) {
            return {
                passed: false,
                score: 0,
                errorMsg: `Security/Runtime Error: ${err.message}`,
                testCaseResults: []
            };
        } finally {
            isolate.dispose();
        }

        // Step 3: DOM Rendering & Testing (JSDOM)
        const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
            runScripts: "dangerously",
            resources: "usable"
        });
        const { window } = dom;
        global.window = window;
        global.document = window.document;
        global.navigator = window.navigator;

        // Mocking React and other globals if needed, but for simplicity we'll assume 
        // we're checking the DOM structure after "execution" simulation.
        // In a real scenario, we'd need to bundle React or mock its behavior.
        
        // For the sake of this platform, we'll execute the transpiled code in the JSDOM context
        // and then run the test cases (which should be DOM queries).
        
        try {
            const scriptElement = window.document.createElement("script");
            scriptElement.textContent = transpiledCode;
            window.document.body.appendChild(scriptElement);

            // Give it a moment to "render" (though it's synchronous here)
            
            for (const test of testCases) {
                let testPassed = false;
                let errorMsg = null;

                try {
                    // testCode should be something like:
                    // "return document.querySelector('h1').textContent === 'Hello World'"
                    // or using a specific test runner logic.
                    const testFn = new Function('document', 'window', test.testCode);
                    const testResult = testFn(window.document, window);
                    
                    if (testResult === true) {
                        testPassed = true;
                    } else {
                        errorMsg = "Test condition not met.";
                    }
                } catch (err) {
                    testPassed = false;
                    errorMsg = err.message;
                }

                results.push({
                    description: test.description,
                    passed: testPassed,
                    errorMsg
                });

                if (!testPassed) allPassed = false;
            }
        } catch (err) {
            throw new Error(`DOM Execution Error: ${err.message}`);
        } finally {
            // Cleanup globals
            delete global.window;
            delete global.document;
            delete global.navigator;
        }

        const executionTime = Date.now() - startTime;
        return {
            passed: allPassed,
            score: allPassed ? 10 : (results.filter(r => r.passed).length / results.length) * 10,
            executionTime,
            testCaseResults: results
        };

    } catch (error) {
        return {
            passed: false,
            score: 0,
            errorMsg: error.message,
            testCaseResults: results
        };
    }
};
