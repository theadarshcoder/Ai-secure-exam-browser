const { io } = require("socket.io-client");

const socketUrl = "http://localhost:5001";


// Simulation: 1 Student and 1 Mentor
const studentSocket = io(socketUrl);
const mentorSocket = io(socketUrl);

mentorSocket.on("connect", () => {
    console.log("✅ Mentor Connected to Socket");
});

mentorSocket.on("mentor_alert", (data) => {
    console.log("🚨 Mentor Received Alert:", data);
    process.exit(0); // Exit after successful test
});

studentSocket.on("connect", () => {
    console.log("✅ Student Connected to Socket");
    
    // Send violation alert after 1 second
    setTimeout(() => {
        console.log("📤 Student sending violation...");
        studentSocket.emit("student_violation", {
            studentId: "123",
            reason: "Tab Switching detected",
            timestamp: new Date()
        });
    }, 1000);
});

// Timeout fail
setTimeout(() => {
    console.log("❌ Test failed: Timeout");
    process.exit(1);
}, 5000);
