require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

async function fix() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to DB');

  const exam = await Exam.findOne({ title: /Full Stack Developer.*Demo/ });
  if (!exam) { console.error('❌ Demo exam not found!'); process.exit(1); }

  console.log(`Found: ${exam.title}`);

  // Clean initialCode — just the function template, NO stdin driver
  // The system now auto-generates: console.log(JSON.stringify(functionName(input)))

  const q0 = exam.questions[0]; // twoSum
  if (q0 && q0.type === 'coding') {
    q0.initialCode = `function twoSum(nums, target) {\n  // Write your solution here\n  \n}\n`;
    q0.language = 'javascript';
    // Input = JS argument expression passed directly to function call
    // System generates: console.log(JSON.stringify(twoSum([2,7,11,15], 9)))
    q0.testCases = [
      { input: '[2, 7, 11, 15], 9',  expectedOutput: '[0,1]',  isHidden: false },
      { input: '[3, 2, 4], 6',        expectedOutput: '[1,2]',  isHidden: false },
      { input: '[3, 3], 6',           expectedOutput: '[0,1]',  isHidden: true  },
      { input: '[1, 5, 3, 9], 14',    expectedOutput: '[1,3]',  isHidden: true  },
    ];
    console.log('✅ Fixed twoSum');
  }

  const q1 = exam.questions[1]; // isPalindrome
  if (q1 && q1.type === 'coding') {
    q1.initialCode = `function isPalindrome(str) {\n  // Write your solution here\n  \n}\n`;
    q1.language = 'javascript';
    // Input = string argument. System generates: console.log(JSON.stringify(isPalindrome("racecar")))
    // JSON.stringify(true)  = "true"  ✓
    // JSON.stringify(false) = "false" ✓
    q1.testCases = [
      { input: '"racecar"', expectedOutput: 'true',  isHidden: false },
      { input: '"hello"',   expectedOutput: 'false', isHidden: false },
      { input: '"madam"',   expectedOutput: 'true',  isHidden: true  },
      { input: '"vision"',  expectedOutput: 'false', isHidden: true  },
    ];
    console.log('✅ Fixed isPalindrome');
  }

  exam.markModified('questions');
  await exam.save();

  console.log('\n📋 Test case format guide:');
  console.log('   Examiner sets input as JS argument expression');
  console.log('   System generates: console.log(JSON.stringify(functionName(input)))');
  console.log('   Examples:');
  console.log('     isPalindrome: input="racecar"  → isPalindrome("racecar")');
  console.log('     twoSum:       input=[1,2],3    → twoSum([1,2], 3)');
  console.log('\n✅ Done!');
  process.exit(0);
}

fix().catch(e => { console.error('❌ Failed:', e.message); process.exit(1); });
