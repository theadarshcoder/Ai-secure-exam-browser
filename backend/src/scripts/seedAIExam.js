const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
require('dotenv').config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database.');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ No admin user found. Run seedTestUsers.js first.');
            process.exit(1);
        }

        await Exam.deleteMany({ title: 'AI & Machine Learning Assessment' });
        console.log('🧹 Cleared previous AI exam.');

        const startTime = new Date(Date.now() - 2 * 60 * 1000); // 2 mins ago

        const exam = new Exam({
            title: 'AI & Machine Learning Assessment',
            description: 'Evaluate your knowledge on Neural Networks, Transformer Architectures, and Gradient Descent optimization.',
            category: 'Data Science',
            duration: 90,
            totalMarks: 60,
            passingMarks: 30,
            status: 'published',
            resultsPublished: false,
            scheduledDate: startTime,
            creator: admin._id,
            questions: [
                {
                    type: 'mcq',
                    questionText: 'What is the vanishing gradient problem in Deep Learning?',
                    marks: 10,
                    options: [
                        'When gradients become too large during backpropagation',
                        'When gradients approach zero, preventing weights from updating in early layers',
                        'When the loss function reaches absolute zero',
                        'When the learning rate is too high'
                    ],
                    correctOption: 1
                },
                {
                    type: 'mcq',
                    questionText: 'Which activation function is most commonly used in the hidden layers of a modern deep neural network?',
                    marks: 10,
                    options: ['Sigmoid', 'Tanh', 'Softmax', 'ReLU'],
                    correctOption: 3
                },
                {
                    type: 'short',
                    questionText: 'Describe the Attention mechanism in the context of Transformer models.',
                    marks: 20,
                    expectedAnswer: 'The Attention mechanism allows a model to weigh the importance of different parts of the input data differently. In Transformers, Self-Attention allows mỗi word in a sentence to interact with and collect information from all other words, enabling the capture of long-range dependencies regardless of their distance in the sequence.'
                },
                {
                    type: 'coding',
                    questionText: 'Implement a simple Mean Squared Error (MSE) calculator. Given two arrays of the same length (predictions and actuals), return the average of the squared differences.',
                    marks: 20,
                    language: 'javascript',
                    initialCode: `function calculateMSE(predictions, actuals) {\n  // your code here\n}`,
                    testCases: [
                        { input: '[[2, 4], [2, 4]]', expectedOutput: '0', isHidden: false },
                        { input: '[[1, 2, 3], [2, 3, 4]]', expectedOutput: '1', isHidden: false },
                        { input: '[[10, 20], [15, 25]]', expectedOutput: '25', isHidden: true }
                    ]
                }
            ]
        });

        await exam.save();
        console.log('🚀 AI & Machine Learning Exam Seeded Successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seed();
