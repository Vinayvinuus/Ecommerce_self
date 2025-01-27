const multer = require('multer');
const path = require('path');
const moment = require('moment');
const fs = require('fs');
const { Op } = require('sequelize');
const {CategoryModel,sequelize} = require('../DbConnection/connect')
const supabase = require('../middleWare/supabase');


const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'UploadCategoryImages', maxCount: 10 }
]);

// Function to upload a file to Supabase
const uploadFileToSupabase = async (file) => {
    try {
        // Sanitize the file name by removing special characters except allowed ones
        const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');

        // Generate a unique file name with the current date and time
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;

        // Upload the file to Supabase
        const { data, error } = await supabase
            .storage
            .from('UploadCategoryImages')
            .upload(`CategoryImages/${fileNameWithTimestamp}`, file.buffer, {
                contentType: file.mimetype
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new Error('Error uploading file to Supabase: ' + error.message);
        }

        // Construct the public URL manually with download and file name headers
        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/UploadCategoryImages/CategoryImages/${fileNameWithTimestamp}`;
        const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;

        console.log('File uploaded successfully:', publicUrl);
        return { publicUrl, downloadUrl, originalFileName: file.originalname };
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
};
exports.createCategory = async (req, res) => {
    try {
        // Use multer to handle the file upload
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err instanceof multer.MulterError || err) {
                    console.error('Upload Error:', err);
                    reject(new Error("Failed to upload image"));
                } else {
                    resolve();
                }
            });
        });

        // Check if image files were uploaded
        if (!req.files || !req.files['UploadCategoryImages']) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        // Process uploaded files and upload to Supabase
        const uploadedFiles = req.files['UploadCategoryImages'];
        const uploadResults = await Promise.all(uploadedFiles.map(file => uploadFileToSupabase(file)));
        const imageUrls = uploadResults.map(result => result.publicUrl).join(', ');

        // Get data from the request body
        const { TenantID, CategoryName, CategoryDescription, CreatedBy } = req.body;

        // Validate required fields
        if (!TenantID || !CategoryName || !CreatedBy) {
            return res.status(400).json({ message: 'TenantID, CategoryName, and CreatedBy are required.' });
        }

        // Determine the ParentCategoryId
        const lastCategory = await CategoryModel.findOne({
            where: { TenantID },
            order: [['CategoryID', 'DESC']]
        });
        const ParentCategoryId = lastCategory ? lastCategory.CategoryID : 0;

        // Create a new Category entry
        const newCategory = await CategoryModel.create({
            TenantID,
            CategoryName,
            CategoryDescription,
            CategoryImage: imageUrls,  // Save URLs of uploaded images
            CreatedBy,
            ParentCategoryId,
            CreatedAt: new Date(),
            UpdatedAt: new Date()
        });

        res.status(201).json({
            message: 'Category created successfully!',
            category: newCategory
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'An error occurred while creating the category.' });
    }
};

// exports.createCategory = async (req, res) => {
//     try {
//         // Use multer to handle the file upload
//         await new Promise((resolve, reject) => {
//             upload(req, res, (err) => {
//                 if (err instanceof multer.MulterError || err) {
//                     console.error('Upload Error:', err);
//                     reject(new Error("Failed to upload image"));
//                 } else {
//                     resolve();
//                 }
//             });
//         });

//         // Check if image files were uploaded
//         if (!req.files || !req.files['UploadCategoryImages']) {
//             return res.status(400).json({ message: 'No images uploaded' });
//         }

//         // Process uploaded files and upload to Supabase
//         const uploadedFiles = req.files['UploadCategoryImages'];
//         const uploadResults = await Promise.all(uploadedFiles.map(file => uploadFileToSupabase(file)));
//         const imageUrls = uploadResults.map(result => result.publicUrl).join(', ');

//         // Get data from the request body
//         const { TenantID, CategoryName, CategoryDescription, CreatedBy } = req.body;

//         // Validate required fields
//         if (!TenantID || !CategoryName || !CreatedBy) {
//             return res.status(400).json({ message: 'TenantID, CategoryName, and CreatedBy are required.' });
//         }

//         // Create a new Category entry
//         const newCategory = await CategoryModel.create({
//             TenantID,
//             CategoryName,
//             CategoryDescription,
//             CategoryImage: imageUrls,  // Save URLs of uploaded images
//             CreatedBy,
//             CreatedAt: new Date(),
//             UpdatedAt: new Date()
//         });

//         res.status(201).json({
//             message: 'Category created successfully!',
//             category: newCategory
//         });
//     } catch (error) {
//         console.error('Error creating category:', error);
//         res.status(500).json({ message: 'An error occurred while creating the category.' });
//     }
// };

// Create Category
// exports.createCategory = async (req, res) => {
//     try {
//         // Get the JSON data from the request
//         const categoryData = JSON.parse(req.body.data || '{}');
        
//         // Validate required fields
//         if (!categoryData.TenantID) {
//             return res.status(400).json({
//                 statusCode: 'FAILURE',
//                 message: 'TenantID is required'
//             });
//         }

//         const newCategory = {
//             TenantID: categoryData.TenantID,
//             CategoryName: categoryData.CategoryName,
//             CategoryDescription: categoryData.CategoryDescription,
//             CreatedBy: categoryData.CreatedBy,
//             UpdatedBy: categoryData.CreatedBy,
//             CreatedAt: new Date(),
//             UpdatedAt: new Date()
//         };

//         // If there's a file, add the image path
//         if (req.file) {
//             newCategory.CategoryImage = `/uploads/categories/${req.file.filename}`;
//         }

//         // Create the category in the database
//         const createdCategory = await CategoryModel.create(newCategory);

//         res.status(201).json({
//             statusCode: 'SUCCESS',
//             message: 'Category created successfully',
//             Data: createdCategory
//         });
//     } catch (error) {
//         // Delete uploaded file if there's an error
//         if (req.file) {
//             const filePath = path.join('uploads/categories', req.file.filename);
//             if (fs.existsSync(filePath)) {
//                 fs.unlinkSync(filePath);
//             }
//         }
        
//         console.error('Error creating category:', error);
//         res.status(500).json({
//             statusCode: 'FAILURE',
//             message: 'Error creating category',
//             error: error.message
//         });
//     }
// };

// Get All Categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.findAll({
            order: [['CategoryID', 'ASC']]
        });

        res.status(200).json({
            statusCode: 'SUCCESS',
            message: 'Categories retrieved successfully',
            Data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get Category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await CategoryModel.findByPk(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Category not found'
            });
        }

        res.status(200).json({
            statusCode: 'SUCCESS',
            message: 'Category retrieved successfully',
            Data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Handle file upload and field parsing using multer
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err instanceof multer.MulterError || err) {
                    console.error('Upload Error:', err);
                    reject(new Error("Failed to upload image"));
                } else {
                    resolve();
                }
            });
        });

        // Retrieve parsed fields from req.body
        const { TenantID, CategoryName, CategoryDescription, UpdatedBy } = req.body;

        // Check if category exists
        const existingCategory = await CategoryModel.findByPk(id);
        if (!existingCategory) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Category not found'
            });
        }

        let imageUrls = existingCategory.CategoryImage; // Keep existing image URLs by default

        // Process new file uploads if present
        if (req.files && req.files['UploadCategoryImages']) {
            const uploadedFiles = req.files['UploadCategoryImages'];
            const uploadResults = await Promise.all(uploadedFiles.map(file => uploadFileToSupabase(file)));
            
            // Update imageUrls with new uploaded images
            imageUrls = uploadResults.map(result => result.publicUrl).join(', ');
        }

        // Validate required fields
        if (!TenantID || !CategoryName || !UpdatedBy) {
            return res.status(400).json({
                statusCode: 'FAILURE',
                message: 'TenantID, CategoryName, and UpdatedBy are required.'
            });
        }

        // Update the category
        const updatedCategory = await existingCategory.update({
            TenantID,
            CategoryName,
            CategoryDescription,
            CategoryImage: imageUrls,
            UpdatedBy,
            UpdatedAt: new Date()
        });

        // Send success response
        res.status(200).json({
            statusCode: 'SUCCESS',
            message: 'Category updated successfully!',
            Data: {
                category: {
                    CategoryID: updatedCategory.CategoryID,
                    TenantID: updatedCategory.TenantID,
                    CategoryName: updatedCategory.CategoryName,
                    CategoryDescription: updatedCategory.CategoryDescription,
                    CategoryImage: updatedCategory.CategoryImage,
                    UpdatedBy: updatedCategory.UpdatedBy,
                    UpdatedAt: updatedCategory.UpdatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'An error occurred while updating the category.',
            error: error.message
        });
    }
};


// Delete Category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findByPk(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Category not found'
            });
        }

        // Delete associated image if it exists
        if (category.CategoryImage) {
            const imagePath = path.join('uploads/categories', category.CategoryImage.split('/').pop());
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await category.destroy();

        res.status(200).json({
            statusCode: 'SUCCESS',
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error deleting category',
            error: error.message
        });
    }
};
