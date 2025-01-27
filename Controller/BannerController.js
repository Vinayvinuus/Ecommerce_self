const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');
require('dotenv').config();

const { BannerimageModel  } = require('../DbConnection/connect');

const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR;
const PUBLIC_URL_BASE = process.env.PUBLIC_URL_BASE;

// Configure storage for banner images
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const fullPath = path.join(UPLOAD_BASE_DIR, 'documents/banners');
        console.log('Saving banner image to directory:', fullPath);
        await fs.mkdir(fullPath, { recursive: true });
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const finalFileName = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;
        console.log('Generated filename:', finalFileName);
        cb(null, finalFileName);
    }
});

const bannerUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for banner images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
            return;
        }
        cb(null, true);
    }
}).fields([
    { name: 'BannerImage', maxCount: 1 }
]);

// Function to get public URL for banner image
const getBannerImageUrl = (filename) => {
    return `${PUBLIC_URL_BASE}/documents/banners/${filename}`;
};

// Create Banner
exports.createBanner = async (req, res) => {
    bannerUpload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                StatusCode: 'ERROR',
                message: 'File upload error',
                details: err.message
            });
        } else if (err) {
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Server error during file upload',
                details: err.message
            });
        }

        try {
            const data = req.body.data ? JSON.parse(req.body.data) : req.body;
            const { TenantID, BannerName, CreatedBy } = data;

            if (!TenantID) {
                return res.status(400).json({
                    StatusCode: 'ERROR',
                    message: 'TenantID is required'
                });
            }

            // Handle banner image upload
            let bannerImageUrl = null;
            if (req.files && req.files['BannerImage']) {
                const bannerImage = req.files['BannerImage'][0];
                bannerImageUrl = getBannerImageUrl(bannerImage.filename);
            }

            const banner = await BannerimageModel.create({
                TenantID,
                BannerName,
                BannerImage: bannerImageUrl,
                CreatedBy,
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                UpdatedBy: CreatedBy
            });

            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Banner created successfully',
                BannerID: banner.BannerID
            });

        } catch (error) {
            console.error('Error creating banner:', error);
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Internal Server Error',
                details: error.message
            });
        }
    });
};

// Update Banner
exports.updateBanner = async (req, res) => {
    bannerUpload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                StatusCode: 'ERROR',
                message: 'File upload error',
                details: err.message
            });
        } else if (err) {
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Server error during file upload',
                details: err.message
            });
        }

        try {
            const { BannerID } = req.params;
            const data = req.body.data ? JSON.parse(req.body.data) : req.body;
            const { TenantID, BannerName, UpdatedBy } = data;

            const banner = await BannerimageModel.findByPk(BannerID);

            if (!banner) {
                return res.status(404).json({
                    StatusCode: 'ERROR',
                    message: 'Banner not found'
                });
            }

            // Handle banner image upload
            let bannerImageUrl = banner.BannerImage;
            if (req.files && req.files['BannerImage']) {
                const bannerImage = req.files['BannerImage'][0];
                bannerImageUrl = getBannerImageUrl(bannerImage.filename);
            }

            await banner.update({
                TenantID,
                BannerName,
                BannerImage: bannerImageUrl,
                UpdatedAt: new Date(),
                UpdatedBy
            });

            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Banner updated successfully',
                BannerID: banner.BannerID
            });

        } catch (error) {
            console.error('Error updating banner:', error);
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Internal Server Error',
                details: error.message
            });
        }
    });
};

// Get Banner by ID
exports.getBannerById = async (req, res) => {
    try {
        const { BannerID } = req.params;

        const banner = await BannerimageModel.findByPk(BannerID);

        if (!banner) {
            return res.status(404).json({
                StatusCode: 'ERROR',
                message: 'Banner not found'
            });
        }

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            data: banner
        });

    } catch (error) {
        console.error('Error fetching banner:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error',
            details: error.message
        });
    }
};

// Get All Banners
exports.getAllBanners = async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 10, searchText = '' } = req.query;

        // Build query options
        const queryOptions = {
            where: {},
            order: [['CreatedAt', 'DESC']], // Adjust ordering field if necessary
            offset: (pageNumber - 1) * pageSize,
            limit: parseInt(pageSize),
        };

        // Add search conditions if searchText is provided
        if (searchText) {
            queryOptions.where = {
                [Op.or]: [
                    { BannerName: { [Op.iLike]: `%${searchText}%` } }, // Adjust the field name as per your model
                ]
            };
        }

        // Fetch banners with pagination
        const { count: totalRecords, rows: banners } = await BannerimageModel.findAndCountAll(queryOptions);

        if (!banners || banners.length === 0) {
            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'No banners found',
                data: [],
                totalRecords: 0,
                totalPages: 0,
                currentPage: parseInt(pageNumber),
                pageSize: parseInt(pageSize)
            });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / pageSize);

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'Banners retrieved successfully',
            data: banners,
            totalRecords,
            totalPages,
            currentPage: parseInt(pageNumber),
            pageSize: parseInt(pageSize)
        });

    } catch (error) {
        console.error('Error fetching banners:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error',
            details: error.message
        });
    }
};
