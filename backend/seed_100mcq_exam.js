require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

async function seed() {
  await mongoose.connect(MONGO_URI);
  const creator = await User.findOne({ role: { $in: ['admin','mentor','super_mentor'] } });
  if (!creator) { console.error('No admin found'); process.exit(1); }

  const mcqs = [
    // ── JavaScript (20) ──
    { q:'Which keyword creates a block-scoped variable?', opts:['var','let','const','define'], ans:'let' },
    { q:'What does `typeof null` return?', opts:['"null"','"object"','"undefined"','"boolean"'], ans:'"object"' },
    { q:'Which method adds an element to the end of an array?', opts:['unshift()','push()','append()','insert()'], ans:'push()' },
    { q:'What is the result of `2 ** 10`?', opts:['20','512','1024','100'], ans:'1024' },
    { q:'What does the spread operator `...` do?', opts:['Declares rest params','Expands iterables','Both','Neither'], ans:'Both' },
    { q:'Which method converts a JSON string to JS object?', opts:['JSON.parse()','JSON.stringify()','JSON.decode()','JSON.convert()'], ans:'JSON.parse()' },
    { q:'What is a Promise in JavaScript?', opts:['A sync function','An object for async operations','A loop','A variable type'], ans:'An object for async operations' },
    { q:'Which loop guarantees at least one execution?', opts:['for','while','do...while','for...of'], ans:'do...while' },
    { q:'What does `Array.isArray([])` return?', opts:['false','null','true','undefined'], ans:'true' },
    { q:'What is hoisting in JavaScript?', opts:['Moving code to bottom','Moving declarations to top of scope','Compiling JS','Minifying code'], ans:'Moving declarations to top of scope' },
    { q:'Which method returns a new array with matching elements?', opts:['map()','find()','filter()','reduce()'], ans:'filter()' },
    { q:'What does `===` check?', opts:['Value only','Type only','Value and type','Reference'], ans:'Value and type' },
    { q:'What is an IIFE?', opts:['Immediately Invoked Function Expression','Inline If Function','Inner Iterator Function','None'], ans:'Immediately Invoked Function Expression' },
    { q:'Which event fires when the DOM is fully parsed?', opts:['load','DOMContentLoaded','ready','parse'], ans:'DOMContentLoaded' },
    { q:'What does `Array.prototype.reduce()` do?', opts:['Filters array','Maps array','Reduces to single value','Sorts array'], ans:'Reduces to single value' },
    { q:'Which statement exits a loop immediately?', opts:['return','continue','exit','break'], ans:'break' },
    { q:'What is the output of `Boolean("")`?', opts:['true','false','null','undefined'], ans:'false' },
    { q:'Which method removes and returns the first element of an array?', opts:['pop()','shift()','splice()','slice()'], ans:'shift()' },
    { q:'What is a generator function in JS?', opts:['A function that returns arrays','A function that can pause/resume','A constructor','A pure function'], ans:'A function that can pause/resume' },
    { q:'What does `Object.keys()` return?', opts:['Array of values','Array of key-value pairs','Array of property names','Object clone'], ans:'Array of property names' },

    // ── Data Structures & Algorithms (20) ──
    { q:'Which DS uses FIFO order?', opts:['Stack','Queue','Tree','Heap'], ans:'Queue' },
    { q:'Time complexity of bubble sort (average)?', opts:['O(n)','O(n log n)','O(n²)','O(log n)'], ans:'O(n²)' },
    { q:'Which traversal visits root before children?', opts:['Inorder','Postorder','Preorder','Level-order'], ans:'Preorder' },
    { q:'What is the height of a balanced BST with n nodes?', opts:['O(n)','O(log n)','O(1)','O(n²)'], ans:'O(log n)' },
    { q:'Which algorithm finds shortest path in a weighted graph?', opts:['DFS','BFS','Dijkstra','Bellman-Ford'], ans:'Dijkstra' },
    { q:'What data structure does DFS use internally?', opts:['Queue','Stack','Heap','Array'], ans:'Stack' },
    { q:'What is the worst case of quicksort?', opts:['O(n log n)','O(n)','O(n²)','O(log n)'], ans:'O(n²)' },
    { q:'Which sort is stable by nature?', opts:['QuickSort','HeapSort','Merge Sort','Selection Sort'], ans:'Merge Sort' },
    { q:'What is a deque?', opts:['Double-ended queue','Directed queue','Dependency queue','None'], ans:'Double-ended queue' },
    { q:'In a min-heap, which element is at the root?', opts:['Largest','Random','Smallest','Median'], ans:'Smallest' },
    { q:'Which data structure is used for LRU Cache?', opts:['Array + Stack','HashMap + Doubly Linked List','Queue + Tree','BST + Heap'], ans:'HashMap + Doubly Linked List' },
    { q:'What does BFS guarantee in an unweighted graph?', opts:['All paths','Shortest path','Longest path','Cycle detection'], ans:'Shortest path' },
    { q:'What is a trie used for?', opts:['Sorting numbers','Prefix/string searches','Graph traversal','Priority queues'], ans:'Prefix/string searches' },
    { q:'Time complexity of hash table lookup (average)?', opts:['O(n)','O(log n)','O(1)','O(n log n)'], ans:'O(1)' },
    { q:'What is dynamic programming?', opts:['Random algorithms','Breaking problems into overlapping subproblems with memoization','Graph traversal','Sorting technique'], ans:'Breaking problems into overlapping subproblems with memoization' },
    { q:'Which algorithm uses divide and conquer?', opts:['Bubble Sort','Insertion Sort','Merge Sort','Linear Search'], ans:'Merge Sort' },
    { q:'What is the space complexity of iterative DFS?', opts:['O(1)','O(n)','O(log n)','O(n²)'], ans:'O(n)' },
    { q:'A complete binary tree with 7 nodes has how many leaves?', opts:['2','3','4','5'], ans:'4' },
    { q:'Which data structure implements an undo feature?', opts:['Queue','Stack','Heap','Linked List'], ans:'Stack' },
    { q:'What is an adjacency matrix used for?', opts:['Sorting','Representing graphs','Hashing','Priority queues'], ans:'Representing graphs' },

    // ── HTML / CSS / Web (10) ──
    { q:'Which HTML5 element defines navigation links?', opts:['<section>','<nav>','<header>','<aside>'], ans:'<nav>' },
    { q:'What does the CSS `box-sizing: border-box` do?', opts:['Excludes padding from width','Includes padding/border in width','Removes margin','Adds shadow'], ans:'Includes padding/border in width' },
    { q:'Which CSS unit is relative to viewport width?', opts:['em','rem','vw','px'], ans:'vw' },
    { q:'What is the z-index property for?', opts:['Width','Stacking order','Opacity','Animation'], ans:'Stacking order' },
    { q:'Which HTTP status means "Created"?', opts:['200','201','204','301'], ans:'201' },
    { q:'What does CORS stand for?', opts:['Cross-Origin Resource Sharing','Client Object Resource System','Cross-Object Routing Service','None'], ans:'Cross-Origin Resource Sharing' },
    { q:'Which tag makes text bold semantically?', opts:['<b>','<strong>','<em>','<i>'], ans:'<strong>' },
    { q:'What does `display: flex` do?', opts:['Hides element','Makes element a flex container','Removes element','Adds border'], ans:'Makes element a flex container' },
    { q:'Which pseudo-class targets the first child element?', opts:[':root',':first-child',':nth-child(1)','Both B and C'], ans:'Both B and C' },
    { q:'What is a media query used for?', opts:['Database queries','Responsive styling based on screen size','Audio control','Video embedding'], ans:'Responsive styling based on screen size' },

    // ── React (10) ──
    { q:'Which hook runs side effects in React?', opts:['useState','useEffect','useContext','useRef'], ans:'useEffect' },
    { q:'What is JSX?', opts:['A database','JavaScript XML syntax extension','A CSS framework','A REST method'], ans:'JavaScript XML syntax extension' },
    { q:'What does `React.memo` do?', opts:['Memoizes values','Prevents re-render if props unchanged','Creates refs','Handles errors'], ans:'Prevents re-render if props unchanged' },
    { q:'What is the Context API used for?', opts:['Routing','Global state sharing without prop drilling','Animations','Testing'], ans:'Global state sharing without prop drilling' },
    { q:'Which hook returns a mutable ref object?', opts:['useState','useMemo','useRef','useCallback'], ans:'useRef' },
    { q:'What does `useCallback` optimize?', opts:['State updates','Memoizes functions to prevent re-creation','Side effects','Context'], ans:'Memoizes functions to prevent re-creation' },
    { q:'What is reconciliation in React?', opts:['Error handling','Process of comparing virtual DOM to update real DOM','State management','Routing'], ans:'Process of comparing virtual DOM to update real DOM' },
    { q:'What is a Higher Order Component (HOC)?', opts:['A class component','A function that takes a component and returns a new component','A hook','A context'], ans:'A function that takes a component and returns a new component' },
    { q:'Which method is called when a class component mounts?', opts:['componentDidUpdate','render','componentDidMount','constructor'], ans:'componentDidMount' },
    { q:'What is lazy loading in React?', opts:['Loading components eagerly','Loading components only when needed','Caching components','Removing components'], ans:'Loading components only when needed' },

    // ── Node.js / Express / MongoDB (15) ──
    { q:'What is the event loop in Node.js?', opts:['A for loop','Mechanism handling async operations non-blockingly','A database','A module'], ans:'Mechanism handling async operations non-blockingly' },
    { q:'Which method in Express sends a JSON response?', opts:['res.send()','res.json()','res.end()','res.write()'], ans:'res.json()' },
    { q:'What is middleware in Express?', opts:['A database model','Function executing between request and response','A route','A template'], ans:'Function executing between request and response' },
    { q:'Which Node module reads files?', opts:['http','path','fs','os'], ans:'fs' },
    { q:'What is mongoose in Node.js?', opts:['A web framework','ODM for MongoDB','A testing tool','A bundler'], ans:'ODM for MongoDB' },
    { q:'What does `process.env` access?', opts:['Memory','Environment variables','CPU','File system'], ans:'Environment variables' },
    { q:'Which HTTP method is idempotent for updates?', opts:['POST','GET','PUT','DELETE'], ans:'PUT' },
    { q:'What is a MongoDB collection?', opts:['A row','A table equivalent (group of documents)','A column','A schema'], ans:'A table equivalent (group of documents)' },
    { q:'What does `app.use()` do in Express?', opts:['Defines GET route','Mounts middleware','Sends response','Starts server'], ans:'Mounts middleware' },
    { q:'Which aggregation method groups documents in MongoDB?', opts:['$match','$sort','$group','$project'], ans:'$group' },
    { q:'What is JWT used for?', opts:['Database queries','Stateless authentication tokens','File uploads','Routing'], ans:'Stateless authentication tokens' },
    { q:'Which Node.js function makes it non-blocking?', opts:['setTimeout','setInterval','Callbacks/Promises/async-await','eval'], ans:'Callbacks/Promises/async-await' },
    { q:'What does `mongoose.Schema` define?', opts:['A route','Structure of a MongoDB document','A middleware','An API endpoint'], ans:'Structure of a MongoDB document' },
    { q:'What is rate limiting in APIs?', opts:['Speeding up API','Restricting number of requests per time window','Caching responses','Compressing data'], ans:'Restricting number of requests per time window' },
    { q:'Which MongoDB operator finds documents matching a condition?', opts:['$set','$push','$match','$unset'], ans:'$match' },

    // ── Python (10) ──
    { q:'Which Python keyword defines a function?', opts:['func','def','function','fn'], ans:'def' },
    { q:'What data type is `{1, 2, 3}` in Python?', opts:['List','Tuple','Set','Dict'], ans:'Set' },
    { q:'What does `len()` return?', opts:['Last element','Number of elements','First element','Sum'], ans:'Number of elements' },
    { q:'Which Python feature allows multiple return values?', opts:['Lists','Tuples','Both','Generators'], ans:'Tuples' },
    { q:'What is a list comprehension?', opts:['A loop','Concise way to create lists','A class','A decorator'], ans:'Concise way to create lists' },
    { q:'What does `*args` allow in Python?', opts:['Keyword arguments','Variable number of positional arguments','Default args','None'], ans:'Variable number of positional arguments' },
    { q:'Which module is used for regular expressions in Python?', opts:['regex','re','regexp','string'], ans:'re' },
    { q:'What is a Python decorator?', opts:['A class method','A function that wraps another function','A variable','A module'], ans:'A function that wraps another function' },
    { q:'What does `range(5)` generate?', opts:['[1,2,3,4,5]','[0,1,2,3,4]','[0,1,2,3,4,5]','[1,2,3,4]'], ans:'[0,1,2,3,4]' },
    { q:'Which Python keyword is used for exception handling?', opts:['catch','except','error','handle'], ans:'except' },

    // ── Databases / SQL (10) ──
    { q:'Which SQL command retrieves data?', opts:['INSERT','UPDATE','SELECT','DELETE'], ans:'SELECT' },
    { q:'What does PRIMARY KEY ensure?', opts:['Uniqueness and not null','Only uniqueness','Only not null','Foreign reference'], ans:'Uniqueness and not null' },
    { q:'What is a FOREIGN KEY?', opts:['Key from another table linking tables','Primary identifier','Index','Unique constraint'], ans:'Key from another table linking tables' },
    { q:'Which JOIN returns all rows from both tables?', opts:['INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN'], ans:'FULL OUTER JOIN' },
    { q:'What does GROUP BY do in SQL?', opts:['Sorts results','Groups rows sharing a value for aggregation','Filters rows','Joins tables'], ans:'Groups rows sharing a value for aggregation' },
    { q:'What is database normalization?', opts:['Backing up data','Organizing data to reduce redundancy','Encrypting data','Indexing data'], ans:'Organizing data to reduce redundancy' },
    { q:'Which SQL function counts rows?', opts:['SUM()','AVG()','COUNT()','MAX()'], ans:'COUNT()' },
    { q:'What is an index in a database?', opts:['A backup','Data structure to speed up queries','A foreign key','A view'], ans:'Data structure to speed up queries' },
    { q:'What does ACID stand for?', opts:['Access Control ID','Atomicity Consistency Isolation Durability','Async Consistent Indexed Data','None'], ans:'Atomicity Consistency Isolation Durability' },
    { q:'Which SQL clause filters groups after GROUP BY?', opts:['WHERE','HAVING','FILTER','WHEN'], ans:'HAVING' },

    // ── General CS / OS / Networks (5) ──
    { q:'What is a race condition?', opts:['Fast network','Two processes accessing shared data simultaneously causing bugs','CPU overload','Memory leak'], ans:'Two processes accessing shared data simultaneously causing bugs' },
    { q:'What is a deadlock?', opts:['Slow network','Process waiting for resource held by another waiting process','Memory overflow','CPU freeze'], ans:'Process waiting for resource held by another waiting process' },
    { q:'What does DNS stand for?', opts:['Data Network System','Domain Name System','Dynamic Node Service','Distributed Name Server'], ans:'Domain Name System' },
    { q:'What is the OSI model?', opts:['Programming language','7-layer framework for network communication','Database model','CSS framework'], ans:'7-layer framework for network communication' },
    { q:'What is virtual memory?', opts:['RAM extension','Using disk space as extended RAM','GPU memory','Cache memory'], ans:'Using disk space as extended RAM' },
  ];

  const questions = [
    // 5 CODING
    { type:'coding', questionText:'Write a function <code>sumArray(arr)</code> that returns the sum of all numbers in an array.', marks:20, language:'javascript', initialCode:'function sumArray(arr) {\n  // your code here\n}\n', testCases:[{input:'[1,2,3,4,5]',expectedOutput:'15',isHidden:false},{input:'[10,20,30]',expectedOutput:'60',isHidden:false},{input:'[]',expectedOutput:'0',isHidden:true},{input:'[-1,-2,3]',expectedOutput:'0',isHidden:true}] },
    { type:'coding', questionText:'Write a function <code>fibonacci(n)</code> that returns the nth Fibonacci number (0-indexed). fibonacci(0)=0, fibonacci(1)=1.', marks:20, language:'javascript', initialCode:'function fibonacci(n) {\n  // your code here\n}\n', testCases:[{input:'0',expectedOutput:'0',isHidden:false},{input:'1',expectedOutput:'1',isHidden:false},{input:'7',expectedOutput:'13',isHidden:true},{input:'10',expectedOutput:'55',isHidden:true}] },
    { type:'coding', questionText:'Write a function <code>removeDuplicates(arr)</code> that returns an array with duplicate values removed (preserving order).', marks:20, language:'javascript', initialCode:'function removeDuplicates(arr) {\n  // your code here\n}\n', testCases:[{input:'[1,2,2,3,3,3]',expectedOutput:'[1,2,3]',isHidden:false},{input:'[1,1,1]',expectedOutput:'[1]',isHidden:false},{input:'[1,2,3]',expectedOutput:'[1,2,3]',isHidden:true},{input:'[]',expectedOutput:'[]',isHidden:true}] },
    { type:'coding', questionText:'Write a function <code>flatten(arr)</code> that flattens a one-level nested array. e.g. [[1,2],[3,4]] → [1,2,3,4].', marks:20, language:'javascript', initialCode:'function flatten(arr) {\n  // your code here\n}\n', testCases:[{input:'[[1,2],[3,4]]',expectedOutput:'[1,2,3,4]',isHidden:false},{input:'[[1],[2],[3]]',expectedOutput:'[1,2,3]',isHidden:false},{input:'[[]]',expectedOutput:'[]',isHidden:true},{input:'[[1,2,3],[4,5]]',expectedOutput:'[1,2,3,4,5]',isHidden:true}] },
    { type:'coding', questionText:'Write a function <code>capitalize(str)</code> that capitalizes the first letter of each word in a string.', marks:20, language:'javascript', initialCode:'function capitalize(str) {\n  // your code here\n}\n', testCases:[{input:'"hello world"',expectedOutput:'"Hello World"',isHidden:false},{input:'"foo bar baz"',expectedOutput:'"Foo Bar Baz"',isHidden:false},{input:'"a b c"',expectedOutput:'"A B C"',isHidden:true},{input:'"node js"',expectedOutput:'"Node Js"',isHidden:true}] },

    // 5 SHORT ANSWER
    { type:'short', questionText:'Explain the difference between <strong>process</strong> and <strong>thread</strong>. How does Node.js handle concurrency with a single thread?', marks:10 },
    { type:'short', questionText:'What is the difference between <strong>monolithic</strong> and <strong>microservices</strong> architecture? Give one advantage of each.', marks:10 },
    { type:'short', questionText:'What is <strong>memoization</strong>? Give a simple example of where you would apply it.', marks:10 },
    { type:'short', questionText:'Explain the concept of <strong>event bubbling</strong> in the browser DOM. How can you stop it?', marks:10 },
    { type:'short', questionText:'What is the difference between <strong>localStorage</strong> and <strong>sessionStorage</strong>? When would you use each?', marks:10 },

    // 100 MCQ
    ...mcqs.map(m => ({
      type: 'mcq',
      questionText: m.q,
      marks: 3,
      options: m.opts,
      correctAnswer: m.ans
    }))
  ];

  const exam = new Exam({
    title: 'Master Evaluation — 100 MCQ + Coding + Short',
    description: '180-minute comprehensive exam: 100 MCQs across JavaScript, DSA, Web, React, Node.js, Python, Databases, OS & Networks, plus 5 short answers and 5 coding challenges.',
    category: 'Computer Science',
    duration: 180,
    totalMarks: 450,   // 100×3 + 5×10 + 5×20
    passingMarks: 225,
    creator: creator._id,
    status: 'published',
    questions,
  });

  await exam.save();
  console.log(`✅ Exam created: "${exam.title}" (ID: ${exam._id})`);
  console.log(`   📝 100 MCQ + 5 Short + 5 Coding = 110 questions`);
  console.log(`   ⏱  180 min | 🏆 450 marks | Passing: 225`);
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
