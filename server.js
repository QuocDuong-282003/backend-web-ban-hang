
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const web = require('./src/router/web');
const { scheduleCleanup } = require('./src/cron/cleanup');



connectDB();

const app = express();

// Cho phép CORS
app.use(cors());


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // cho form data


app.use('/api', web);
scheduleCleanup();

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
