const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_BASE = 'http://localhost:5001/api';

const dummyImagePath = path.join(__dirname, 'dummy.jpg');

async function downloadDummyImage() {
    const res = await axios.get('https://picsum.photos/20', { responseType: 'stream' });
    const writer = fs.createWriteStream(dummyImagePath);
    res.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}


async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function runTest() {
    console.log("=== STARTING eKYC & CLOUDINARY INTEGRATION TEST ===");

    try {
        await downloadDummyImage();
        console.log("Downloaded valid dummy image.");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("\n[1] Registering temporary test users in MongoDB directly...");
        const studentEmail = `student_${Date.now()}@test.com`;
        const adminEmail = `admin_${Date.now()}@test.com`;
        
        const student = await User.create({ name: 'Test Student', email: studentEmail, password: 'password123', role: 'student' });
        const admin = await User.create({ name: 'Test Admin', email: adminEmail, password: 'password123', role: 'admin' });

        const studentLogin = await axios.post(`${API_BASE}/auth/login`, { email: studentEmail, password: 'password123' });
        const studentToken = studentLogin.data.token;
        const studentId = studentLogin.data.user.id;

        const adminLogin = await axios.post(`${API_BASE}/auth/login`, { email: adminEmail, password: 'password123' });
        const adminToken = adminLogin.data.token;

        console.log("✅ Student and Admin registered & logged in.");


        // ---------------------------------------------------------
        // 2. Upload Profile Picture to Cloudinary (Student)
        // ---------------------------------------------------------
        console.log("\n[2] Testing Cloudinary Upload: Profile Picture (/api/upload/profile)...");
        const form1 = new FormData();
        form1.append('image', fs.createReadStream(dummyImagePath));
        
        const profileRes = await axios.post(`${API_BASE}/upload/profile`, form1, {
            headers: {
                ...form1.getHeaders(),
                Authorization: `Bearer ${studentToken}`
            }
        });
        console.log("✅ Profile Upload Response:", profileRes.data.url);
        if (!profileRes.data.url.includes('cloudinary.com')) throw new Error("Upload did not go to Cloudinary!");

        // ---------------------------------------------------------
        // 3. Upload ID Card to Cloudinary (Student)
        // ---------------------------------------------------------
        console.log("\n[3] Testing Cloudinary Upload: ID Card (/api/upload/id-card)...");
        const form2 = new FormData();
        form2.append('image', fs.createReadStream(dummyImagePath));

        const idCardRes = await axios.post(`${API_BASE}/upload/id-card`, form2, {
            headers: {
                ...form2.getHeaders(),
                Authorization: `Bearer ${studentToken}`
            }
        });
        console.log("✅ ID Card Upload Response:", idCardRes.data.url);

        // ---------------------------------------------------------
        // 4. Admin fetch Candidates
        // ---------------------------------------------------------
        console.log("\n[4] Admin Dashboard checking candidates (/api/admin/candidates)...");
        const candidatesRes = await axios.get(`${API_BASE}/admin/candidates?search=${studentEmail}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const candidate = candidatesRes.data.find(c => c.email === studentEmail);
        
        console.log("✅ Candidate extracted from API:", {
            name: candidate.name,
            profilePicture: candidate.profilePicture ? 'Attached' : 'Missing',
            idCardUrl: candidate.idCardUrl ? 'Attached' : 'Missing',
            isVerified: candidate.isVerified,
            isLive: candidate.isLive
        });

        if (!candidate.profilePicture || !candidate.idCardUrl) throw new Error("Database did not correctly save Cloudinary URLs.");

        // ---------------------------------------------------------
        // 5. Admin verify Candidate
        // ---------------------------------------------------------
        console.log("\n[5] Admin Verifying Candidate (/api/admin/candidates/verify)...");
        const verifyRes = await axios.put(`${API_BASE}/admin/candidates/verify/${candidate._id}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✅ Candidate verification status:", verifyRes.data.user.isVerified ? 'VERIFIED' : 'FAILED');

        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");

    } catch (error) {
        console.error("\n❌ TEST FAILED:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    } finally {
        if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
    }
}

runTest();
