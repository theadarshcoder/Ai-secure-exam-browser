const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Dynamic folder structure
        const isCSV = file.originalname.endsWith('.csv');
        const folder = req.baseUrl.includes('admin') || isCSV ? 'vision/csv-imports' : 'vision/proctoring-snapshots';
        
        return {
            folder: folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'csv'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            resource_type: isCSV ? 'raw' : 'image' // CSVs need to be 'raw' in Cloudinary
        };
    }
});

// File Filter (Security)
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.originalname.endsWith('.csv')) {
        return cb(new Error('Invalid file type! Only images and CSVs are allowed.'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

module.exports = upload;
