const {OrdersModel,sequelize,OrderItemsModel,OrderHistoryModel,PaymentModel} = require('../DbConnection/connect');
const { Op } = require('sequelize');

// Create Payment
const createPayment = async (req, res) => {
    const { OrderID, TenantID, CustomerID, Amount, PaymentMethod, PaymentStatus, MaskedCardNumber } = req.body;

    if (!OrderID || !TenantID || !CustomerID || !Amount || !PaymentMethod || !PaymentStatus) {
        return res.status(400).json({
            status: "FAILURE",
            message: "OrderID, TenantID, CustomerID, Amount, PaymentMethod, and PaymentStatus are required fields"
        });
    }

    const transaction = await sequelize.transaction();

    try {
        const payment = await PaymentModel.create(
            {
                OrderID,
                TenantID,
                CustomerID,
                PaymentDate: new Date(),
                Amount,
                PaymentMethod,
                PaymentStatus,
                MaskedCardNumber
            },
            { transaction }
        );

        await transaction.commit();
        res.status(201).json({
            status: "SUCCESS",
            message: "Payment created successfully",
            data: payment
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating payment",
            error: error.message
        });
    }
};

// Get All Payments
const getAllPayments = async (req, res) => {
    try {
        const payments = await PaymentModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching payments",
            error: error.message
        });
    }
};

// Get Payment by ID
const getPaymentById = async (req, res) => {
    const { id } = req.params;
    try {
        const payment = await PaymentModel.findByPk(id);
        if (payment) {
            res.status(200).json({
                status: "SUCCESS",
                data: payment
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Payment not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving payment",
            error: error.message
        });
    }
};

// Update Payment
const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { Amount, PaymentMethod, PaymentStatus, MaskedCardNumber } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const [updated] = await PaymentModel.update(
            { Amount, PaymentMethod, PaymentStatus, MaskedCardNumber },
            { where: { PaymentID: id }, transaction }
        );

        if (updated) {
            await transaction.commit();
            res.status(200).json({
                status: "SUCCESS",
                message: "Payment updated successfully"
            });
        } else {
            await transaction.rollback();
            res.status(404).json({
                status: "FAILURE",
                message: "Payment not found"
            });
        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating payment",
            error: error.message
        });
    }
};

// Delete Payment
const deletePayment = async (req, res) => {
    const { id } = req.params;

    const transaction = await sequelize.transaction();

    try {
        const deleted = await PaymentModel.destroy({ where: { PaymentID: id }, transaction });

        if (deleted) {
            await transaction.commit();
            res.status(200).json({
                status: "SUCCESS",
                message: "Payment deleted successfully"
            });
        } else {
            await transaction.rollback();
            res.status(404).json({
                status: "FAILURE",
                message: "Payment not found"
            });
        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting payment",
            error: error.message
        });
    }
};

module.exports = { createPayment, getAllPayments, getPaymentById, updatePayment, deletePayment };
