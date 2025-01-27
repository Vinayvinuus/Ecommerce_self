const {OrdersModel,sequelize,OrderItemsModel,OrderHistoryModel,PaymentModel} = require('../DbConnection/connect');


// Create a new order item
const createOrderItem = async (req, res) => {
    const { OrderID, TenantID, CustomerID, ProductVariantID, Quantity, Price } = req.body;

    // Check required fields
    if (!OrderID || !TenantID || !CustomerID || !ProductVariantID) {
        return res.status(400).json({
            status: "FAILURE",
            message: "OrderID, TenantID, CustomerID, and ProductVariantID are required fields"
        });
    }

    try {
        const orderItem = await OrderItemsModel.create({
            OrderID,
            TenantID,
            CustomerID,
            ProductVariantID,
            Quantity,
            Price
        });
        res.status(201).json({
            status: "SUCCESS",
            message: "Order item created successfully",
            data: orderItem
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating order item",
            error: error.message
        });
    }
};

// Get all order items
const getAllOrderItems = async (req, res) => {
    try {
        const orderItems = await OrderItemsModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: orderItems
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching order items",
            error: error.message
        });
    }
};

// Get order item by ID (Composite Primary Key)
const getOrderItemById = async (req, res) => {
    const { OrderID, ProductVariantID } = req.params;

    try {
        const orderItem = await OrderItemsModel.findOne({
            where: { OrderID, ProductVariantID }
        });
        if (orderItem) {
            res.status(200).json({
                status: "SUCCESS",
                data: orderItem
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order item not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving order item",
            error: error.message
        });
    }
};

// Update an order item
const updateOrderItem = async (req, res) => {
    const { OrderID, ProductVariantID } = req.params;

    if (!OrderID || !ProductVariantID) {
        return res.status(400).json({
            status: "FAILURE",
            message: "OrderID and ProductVariantID are required"
        });
    }

    try {
        const [updateCount] = await OrderItemsModel.update(req.body, {
            where: { OrderID, ProductVariantID }
        });

        if (updateCount > 0) {
            const updatedOrderItem = await OrderItemsModel.findOne({ where: { OrderID, ProductVariantID } });
            res.status(200).json({
                status: "SUCCESS",
                message: "Order item updated successfully",
                data: updatedOrderItem
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order item not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating order item",
            error: error.message
        });
    }
};

// Delete an order item
const deleteOrderItem = async (req, res) => {
    const { OrderID, ProductVariantID } = req.params;

    try {
        const deleted = await OrderItemsModel.destroy({
            where: { OrderID, ProductVariantID }
        });
        if (deleted) {
            res.status(200).json({
                status: "SUCCESS",
                message: "Order item deleted successfully"
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Order item not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting order item",
            error: error.message
        });
    }
};

module.exports = {createOrderItem,getAllOrderItems,getOrderItemById,updateOrderItem,deleteOrderItem};

