const { CartModel, CartItemsModel, sequelize } = require('../DbConnection/connect');
const { Op } = require('sequelize');

// Create Cart with Items
const createCartWithItems = async (req, res) => {
    const { TenantID, CustomerID, CartItems } = req.body;

    if (!TenantID || !CustomerID || !CartItems || CartItems.length === 0) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID, CustomerID, and CartItems are required fields"
        });
    }

    const transaction = await sequelize.transaction();

    try {
        // Step 1: Create Cart
        const cart = await CartModel.create({
            TenantID,
            CustomerID,
            TotalQuantity: CartItems.reduce((sum, item) => sum + item.Quantity, 0),
            TotalAmount: CartItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0),
            CreatedBy: req.user ? req.user.username : 'system',
        }, { transaction });

        if (!cart) {
            throw new Error("Cart creation failed");
        }

        // Step 2: Add Cart Items
        const cartItemsData = CartItems.map(item => ({
            CartID: cart.CartID,
            TenantID: TenantID,
            CustomerID: CustomerID,
            ProductVariantID: item.ProductVariantID,
            Quantity: item.Quantity,
            Price: item.Price
        }));

        await CartItemsModel.bulkCreate(cartItemsData, { transaction });

        // Commit transaction if all is well
        await transaction.commit();

        res.status(201).json({
            status: "SUCCESS",
            message: "Cart created successfully",
            data: cart
        });

    } catch (error) {
        // Rollback transaction on any failure
        await transaction.rollback();

        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating cart with items",
            error: error.message
        });
    }
};

// Get Cart by CustomerID
const getCartByCustomerId = async (req, res) => {
    const { CustomerID } = req.params;
    
    try {
        const cart = await CartModel.findOne({
            where: { CustomerID },
            include: [{ model: CartItemsModel, as: 'CartItems' }]
        });

        if (cart) {
            res.status(200).json({
                status: "SUCCESS",
                data: cart
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Cart not found"
            });
        }

    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving cart",
            error: error.message
        });
    }
};

// Update Cart and Cart Items
const updateCart = async (req, res) => {
    const { id } = req.params;
    const { CartItems, UpdatedBy } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const cart = await CartModel.findByPk(id);

        if (!cart) {
            return res.status(404).json({
                status: "FAILURE",
                message: "Cart not found"
            });
        }

        // Update Cart Items
        if (CartItems) {
            await CartItemsModel.destroy({ where: { CartID: id }, transaction });
            const cartItemsData = CartItems.map(item => ({
                CartID: id,
                TenantID: req.body.TenantID,
                CustomerID: req.body.CustomerID,
                ProductVariantID: item.ProductVariantID,
                Quantity: item.Quantity,
                Price: item.Price
            }));
            await CartItemsModel.bulkCreate(cartItemsData, { transaction });

            // Update Total Quantity and Amount
            const totalQuantity = CartItems.reduce((sum, item) => sum + item.Quantity, 0);
            const totalAmount = CartItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

            await cart.update({
                TotalQuantity: totalQuantity,
                TotalAmount: totalAmount,
                UpdatedBy: UpdatedBy || 'System'
            }, { transaction });
        }

        // Commit transaction
        await transaction.commit();
        res.status(200).json({
            status: "SUCCESS",
            message: "Cart updated successfully"
        });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating cart",
            error: error.message
        });
    }
};

// Delete Cart and Cart Items
const deleteCart = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();
    try {
        // Delete Cart Items first to maintain referential integrity
        await CartItemsModel.destroy({ where: { CartID: id }, transaction });

        const deleted = await CartModel.destroy({ where: { CartID: id }, transaction });

        if (deleted) {
            await transaction.commit();
            res.status(200).json({
                status: "SUCCESS",
                message: "Cart deleted successfully"
            });
        } else {
            await transaction.rollback();
            res.status(404).json({
                status: "FAILURE",
                message: "Cart not found"
            });
        }

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting cart",
            error: error.message
        });
    }
};

module.exports = { createCartWithItems, getCartByCustomerId, updateCart, deleteCart };
