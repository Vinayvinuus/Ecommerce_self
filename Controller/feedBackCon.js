const {feedBackModel,OrdersModel,CustomerModel,sequelize,OrderItemsModel,} = require('../DbConnection/connect');
const { Sequelize } = require('sequelize'); // Import Sequelize
const moment = require('moment'); // Import moment
const supabase = require('../middleWare/supabase');
const multer = require('multer');
const path = require('path');


const upload = multer({ storage: multer.memoryStorage() }).any();

const uploadFileToSupabase = async (file) => {
    try {
        const sanitizedFileName = file.originalname
            .replace(/[^\w\.-]/g, '_')
            .replace(/\.+/g, '.') // Replace multiple dots with a single dot
            .replace(/\.[^.]*$/, ''); // Remove the original extension
        
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;
        
        const { data, error } = await supabase
            .storage
            .from('FeedBackImage')
            .upload(`FeedBack/${fileNameWithTimestamp}`, file.buffer, {
                contentType: file.mimetype
            });
        
        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new Error('Error uploading file to Supabase: ' + error.message);
        }
        
        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/FeedBackImage/FeedBack/${fileNameWithTimestamp}`;
        const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;
        
        return { publicUrl, downloadUrl, originalFileName: file.originalname };
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
};

exports.createOrUpdateFeedback = async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                StatusCode: 'ERROR',
                message: 'File upload error',
                details: err.message,
            });
        } else if (err) {
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Server error during file upload',
                details: err.message,
            });
        }

        try {
            // Parse and validate input data
            const data = req.body.data ? JSON.parse(req.body.data) : req.body;
            const { FeedbackID, OrderID, OrderItemID, Rating, Comment } = data;

            if (!OrderID || !OrderItemID || !Rating) {
                return res.status(400).json({
                    StatusCode: 'ERROR',
                    message: 'OrderID, OrderItemID, and Rating are required.',
                });
            }

            // Handle feedback image upload
            let feedbackImageData = null;
            if (req.files && req.files.length > 0) {
                try {
                    const feedbackImage = req.files.find(file => file.fieldname === 'FeedbackImage');
                    if (feedbackImage) {
                        feedbackImageData = await uploadFileToSupabase(feedbackImage); // Upload helper function
                    }
                } catch (uploadError) {
                    return res.status(500).json({
                        StatusCode: 'ERROR',
                        message: 'Error uploading feedback image',
                        details: uploadError.message,
                    });
                }
            }

            // Fetch order item details
            const orderItem = await OrderItemsModel.findOne({
                where: { OrderItemID, OrderID },
                attributes: ['OrderID', 'CustomerID', 'ProductID'], // Fetch required fields
            });

            if (!orderItem) {
                return res.status(404).json({
                    StatusCode: 'ERROR',
                    message: 'Order item not found.',
                });
            }

            const { CustomerID, ProductID } = orderItem;

            // Handle feedback creation or update
            if (FeedbackID && FeedbackID !== 0) {
                // Update feedback
                const feedback = await feedBackModel.findByPk(FeedbackID);

                if (!feedback) {
                    return res.status(404).json({
                        StatusCode: 'ERROR',
                        message: 'Feedback not found.',
                    });
                }

                await feedback.update({
                    OrderID,
                    OrderItemID,
                    CustomerID,
                    ProductID,
                    Rating,
                    Comment,
                    FeedbackImageUrl: feedbackImageData ? feedbackImageData.publicUrl : feedback.FeedbackImageUrl,
                    UpdatedBy: CustomerID,
                });

                return res.status(200).json({
                    StatusCode: 'SUCCESS',
                    message: 'Feedback updated successfully.',
                    feedback,
                });
            } else {
                // Create feedback
                const feedback = await feedBackModel.create({
                    OrderID,
                    OrderItemID,
                    CustomerID,
                    ProductID,
                    Rating,
                    Comment,
                    FeedbackImageUrl: feedbackImageData ? feedbackImageData.publicUrl : null,
                    CreatedBy: CustomerID,
                });

                return res.status(201).json({
                    StatusCode: 'SUCCESS',
                    message: 'Feedback created successfully.',
                    feedback,
                });
            }
        } catch (error) {
            console.error('Error creating or updating feedback:', error);
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Internal Server Error',
                details: error.message,
            });
        }
    });
};

exports.getFeedbackByProductId = async (req, res) => {
    const { ProductID } = req.params; // Extract FeedbackID from the request parameters

    // Validate FeedbackID
    if (!ProductID) {
        return res.status(400).json({
            status: "FAILURE",
            message: "FeedbackID is required",
        });
    }

    try {
        // Fetch feedback data
        const feedback = await feedBackModel.findOne({
            where: { ProductID }, // Use FeedbackID as the key
            attributes: [
                'FeedbackID',
                'ProductID',
                'OrderID',
                'OrderItemID',
                'CustomerID',
                'Rating',
                'FeedbackImageUrl',
                'Comment',
                'CreatedAt',
            ],
            include: [
                {
                    model: CustomerModel, // Customer details
                    as: 'Customer', // Ensure this matches the alias in the association
                    attributes: ['FirstName', 'LastName'], // Include names
                },
            ],
        });

        // Check if feedback exists
        if (!feedback) {
            return res.status(404).json({
                status: "FAILURE",
                message: "No feedback found for the specified FeedbackID",
            });
        }

        // Respond with the feedback data
        res.status(200).json({
            status: "SUCCESS",
            message: "Feedback retrieved successfully",
            data: {
                FeedbackID: feedback.FeedbackID,
                ProductID: feedback.ProductID,
                OrderID: feedback.OrderID,
                OrderItemID: feedback.OrderItemID,
                CustomerName: `${feedback.Customer.FirstName} ${feedback.Customer.LastName}`,
                Rating: feedback.Rating,
                FeedbackImageUrl: feedback.FeedbackImageUrl,
                Comment: feedback.Comment,
                CreatedAt: feedback.CreatedAt,
            },
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({
            status: "FAILURE",
            message: "An error occurred while retrieving feedback",
            error: error.message,
        });
    }
};



/*exports.CreateOrderFeedBack = async (req, res) => {
    try {
        const { OrderID, OrderItemID, Rating, Comment } = req.body;

        // Validate inputs
        if (!OrderID || !OrderItemID || !Rating) {
            return res.status(400).json({
                error: 'OrderID, OrderItemID, and Rating are required.'
            });
        }

        // Fetch the order item details, including CustomerID and ProductID
        const orderItem = await OrderItemsModel.findOne({
            where: { OrderItemID, OrderID },
            attributes: ['OrderID', 'CustomerID', 'ProductID'] // Fetch relevant fields
        });

        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found.' });
        }

        const { CustomerID, ProductID } = orderItem;

        // Create feedback entry
        const feedback = await feedBackModel.create({
            OrderID,
            OrderItemID,
            CustomerID,
            ProductID,
            Rating,
            Comment,
            CreatedBy: CustomerID // Assuming CreatedBy is the same as CustomerID
        });

        res.status(201).json({
            message: 'Thank you for your feedback!',
            feedback
        });
    } catch (error) {
        console.error('Error creating feedback:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
}; */

// GET All Feedbacks
exports.GetAllFeedBacks = async (req, res) => {
    const { pageNumber = 1, pageSize = 10, ProductID, StartDate, EndDate } = req.query;
    const searchText = req.query.searchText?.toLowerCase() || '';

    try {
        const offset = (pageNumber - 1) * pageSize;

        const whereConditions = {
            [Sequelize.Op.or]: [
                { Comment: { [Sequelize.Op.iLike]: `%${searchText}%` } }
            ]
        };

        if (ProductID) whereConditions.ProductID = ProductID;

        if (StartDate && EndDate) {
            whereConditions.CreatedAt = {
                [Sequelize.Op.between]: [
                    new Date(StartDate),
                    new Date(EndDate).setUTCHours(23, 59, 59, 999)
                ]
            };
        }

        const { count, rows } = await feedBackModel.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: CustomerModel,
                    as: 'Customer',
                    attributes: ['FirstName', 'LastName']
                }
            ],
            order: [[Sequelize.literal('GREATEST("Feedback"."CreatedAt", "Feedback"."UpdatedAt")'), 'DESC']],
            limit: parseInt(pageSize),
            offset
        });

        const formattedFeedbacks = rows.map(fb => ({
            FeedbackID: fb.FeedbackID,
            ProductID: fb.ProductID,
            CustomerName: `${fb.Customer.FirstName} ${fb.Customer.LastName}`,
            Rating: fb.Rating,
            feedBackimage :fb.FeedbackImageUrl ,
            Comment: fb.Comment,
            CreatedAt: fb.CreatedAt
        }));

        res.status(200).json({
            statusCode: 'SUCCESS',
            page: parseInt(pageNumber),
            pageSize: parseInt(pageSize),
            totalItems: count,
            totalPages: Math.ceil(count / pageSize),
            feedbacks: formattedFeedbacks
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error.message); // Log the error
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// GET Feedback by OrderID
exports.GetFeedBackByOrderID = async (req, res) => {
    try {
        const feedback = await feedBackModel.findOne({ where: { OrderID: req.params.id } });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// UPDATE Feedback
exports.UpdateFeedBack = async (req, res) => {
    try {
        const feedback = await feedBackModel.findOne({ where: { FeedbackID: req.params.feedbackId } });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        const { 
            Rating, 
            Comment, 
            UpdatedBy 
        } = req.body;

        await feedback.update({
            ...(Rating && { Rating }),
            ...(Comment && { Comment }),
            UpdatedBy
        });

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// DELETE Feedback
exports.DeleteFeedBack = async (req, res) => {
    try {
        const feedback = await feedBackModel.findOne({ where: { FeedbackID: req.params.feedbackId } });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        await feedback.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
