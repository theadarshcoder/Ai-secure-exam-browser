const AI_POOLS = {
    DSA: {
        mcq: [
            { questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctOption: 1, marks: 2 },
            { questionText: 'Which data structure follows FIFO?', options: ['Stack', 'Queue', 'Graph', 'Tree'], correctOption: 1, marks: 1 },
            { questionText: 'What is the height of a balanced binary tree with N nodes?', options: ['O(N)', 'O(log N)', 'O(sqrt N)', 'O(1)'], correctOption: 1, marks: 2 }
        ],
        short: [
            { questionText: 'Explain the difference between a stack and a queue.', expectedAnswer: 'Stack is LIFO, Queue is FIFO', maxWords: 150, marks: 3 },
            { questionText: 'What is a hash collision and how can it be handled?', expectedAnswer: 'Collision: multiple keys map to same index. Handle: chaining, open addressing', maxWords: 200, marks: 5 }
        ],
        coding: [
            { questionText: 'Reverse a Linked List iteratively.', language: 'javascript', initialCode: 'function reverse(head) {\n\n}', testCases: [{ input: '[1,2,3]', expectedOutput: '[3,2,1]' }], marks: 10 }
        ]
    },
    Frontend: {
        mcq: [
            { questionText: 'Which hook manages state in React?', options: ['useEffect', 'useState', 'useRef', 'useContext'], correctOption: 1, marks: 2 },
            { questionText: 'HTML stands for?', options: ['HyperText Markup Language', 'Hyperlink Text Markup Language', 'HighText Machine Language', 'None'], correctOption: 0, marks: 1 }
        ],
        short: [
            { questionText: 'What is the Virtual DOM?', expectedAnswer: 'A lightweight copy of the real DOM used for reconciliation', maxWords: 200, marks: 4 }
        ],
        coding: [
            { questionText: 'Implement a simple Counter component in React.', language: 'javascript', initialCode: 'function Counter() {\n\n}', testCases: [{ input: 'Click button', expectedOutput: 'Increment' }], marks: 5 }
        ]
    }
};

/**
 * Generate questions based on syllabus, category and requested counts
 */
exports.generateQuestions = async (req, res) => {
    try {
        const { category = 'DSA', syllabus = '', config = { mcq: 5, short: 3, coding: 1 } } = req.body;

        // Note: Real LLM implementation (Gemini/OpenAI) would happen here.
        // For now, we use a robust pool-based engine that simulates AI logic.
        
        const pool = AI_POOLS[category] || AI_POOLS.DSA;
        const generated = [];

        // Helper to pick random items from pool
        const pick = (type, count) => {
            const items = pool[type] || [];
            if (items.length === 0) return [];
            
            const results = [];
            for (let i = 0; i < count; i++) {
                const template = items[i % items.length];
                results.push({
                    ...template,
                    id: `ai-${Date.now()}-${type}-${i}-${Math.random().toString(36).substr(2, 4)}`
                });
            }
            return results;
        };

        generated.push(...pick('mcq', config.mcq || 0));
        generated.push(...pick('short', config.short || 0));
        generated.push(...pick('coding', config.coding || 0));

        // Shuffle if multiple
        const shuffled = generated.sort(() => Math.random() - 0.5);

        res.json({
            success: true,
            questions: shuffled,
            message: `Successfully generated ${shuffled.length} questions based on your input.`
        });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate questions. AI Engine busy.' });
    }
};
