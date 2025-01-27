const {OrdersModel,sequelize,OrderItemsModel,OrderHistoryModel, OrderStatusModel,PaymentModel} = require('../DbConnection/connect');


// Create a new order history record
const createOrderHistory = async (req, res) => {
    const { OrderID, TenantID, UserID,StatusID, CreatedBy } = req.body;

    // Check required fields
    if (!OrderID || !TenantID || !UserID) {
        return res.status(400).json({
            status: "FAILURE",
            message: "OrderID, TenantID, and UserID are required fields"
        });
    }
           // Check if status is valid
            const orderStatus = await OrderStatusModel.findByPk(StatusID);
            if (!orderStatus) {
                return res.status(400).json({ error: 'Invalid StatusId.' });
            }
            const { OrderStatus } = orderStatus;

    try {
        const orderHistory = await OrderHistoryModel.create({
            OrderID,
            TenantID,
            UserID,
            StatusID,
            OrderStatus:OrderStatus,
            CreatedBy
        });
        res.status(201).json({
            status: "SUCCESS",
            message: "Order history created successfully",
            data: orderHistory
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating order history",
            error: error.message
        });
    }
};

// Get all order history records
const getAllOrderHistories = async (req, res) => {
    try {
        const orderHistories = await OrderHistoryModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: orderHistories
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching order histories",
            error: error.message
        });
    }
};

// Get order history by ID
const getOrderHistoryById = async (req, res) => {
    try {
        const orderHistory = await OrderHistoryModel.findByPk(req.params.id);
        if (orderHistory) {
            res.status(200).json({
                status: "SUCCESS",
                data: orderHistory
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order history not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving order history",
            error: error.message
        });
    }
};

// Update an order history record
const updateOrderHistory = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                status: "FAILURE",
                message: "OrderHistoryID is required"
            });
        }

        const [updateCount] = await OrderHistoryModel.update(req.body, {
            where: { OrderHistoryID: id }
        });

        if (updateCount > 0) {
            const updatedOrderHistory = await OrderHistoryModel.findByPk(id);
            res.status(200).json({
                status: "SUCCESS",
                message: "Order history updated successfully",
                data: updatedOrderHistory
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order history not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating order history",
            error: error.message
        });
    }
};

// Delete an order history record
const deleteOrderHistory = async (req, res) => {
    try {
        const deleted = await OrderHistoryModel.destroy({
            where: { OrderHistoryID: req.params.id }
        });
        if (deleted) {
            res.status(200).json({
                status: "SUCCESS",
                message: "Order history deleted successfully"
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order history not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting order history",
            error: error.message
        });
    }
};

module.exports = {createOrderHistory,getAllOrderHistories,getOrderHistoryById,updateOrderHistory,deleteOrderHistory};
