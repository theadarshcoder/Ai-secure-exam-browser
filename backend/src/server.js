const express = require('express');
const connectDB = require('./config/db.js');
require('dotenv').config();

const app = express();

connectDB();

app.get('/', (req, res) => {
    res.send('<h1>Sir G dekh rhe ho akdm prfect chal rha h</h1>');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
