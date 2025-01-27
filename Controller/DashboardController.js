const { sequelize, OrderModel, PaymentModel, CustomerModel } = require('../ConnectionDB/Connect');
const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment');

// Input validation middleware
const validateDateRange = (startDate, endDate) => {
    if ((startDate && !endDate) || (!startDate && endDate)) {
        throw new Error('Both startDate and endDate must be provided together');
    }
    if (startDate && endDate && moment(startDate).isAfter(endDate)) {
        throw new Error('StartDate cannot be after EndDate');
    }
};

// Get overall dashboard data
exports.getOverallDashboardData = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body;

        // Validate date range if provided
        validateDateRange(startDate, endDate);

        // Base where clauses
        const baseWhere = tenantId ? { tenantId } : {};
        
        // Add date filters if provided
        const dateFilter = {};
        if (startDate && endDate) {
            const startDateTime = moment(startDate).startOf('day').toDate();
            const endDateTime = moment(endDate).endOf('day').toDate();
            dateFilter.orderDate = { [Sequelize.Op.between]: [startDateTime, endDateTime] };
            dateFilter.paymentDate = { [Sequelize.Op.between]: [startDateTime, endDateTime] };
            dateFilter.createdAt = { [Sequelize.Op.between]: [startDateTime, endDateTime] };
        }

        // Fetch dashboard metrics in parallel
        const [totalOrders, totalPayments, totalCustomers, orderStatusCounts] = await Promise.all([
            OrderModel.count({
                where: { ...baseWhere, ...dateFilter.orderDate }
            }),
            PaymentModel.sum('amount', {
                where: { ...baseWhere, ...dateFilter.paymentDate }
            }),
            CustomerModel.count({
                where: { ...baseWhere, ...dateFilter.createdAt }
            }),
            OrderModel.findAll({
                where: { ...baseWhere, ...dateFilter.orderDate },
                attributes: [
                    'orderStatus',
                    'paymentStatus',
                    [Sequelize.fn('COUNT', Sequelize.col('orderId')), 'count']
                ],
                group: ['orderStatus', 'paymentStatus']
            })
        ]);

        // Format order status counts
        const formattedOrderStatusCounts = orderStatusCounts.map(status => ({
            orderStatus: status.orderStatus,
            paymentStatus: status.paymentStatus,
            count: parseInt(status.getDataValue('count'))
        }));

        // Calculate payment summary
        const paymentSummary = {
            pending: 0,
            paid: 0,
            failed: 0,
            refunded: 0
        };

        formattedOrderStatusCounts.forEach(status => {
            if (paymentSummary.hasOwnProperty(status.paymentStatus.toLowerCase())) {
                paymentSummary[status.paymentStatus.toLowerCase()] += status.count;
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalPayments: totalPayments || 0,
                totalCustomers,
                orderStatusCounts: formattedOrderStatusCounts,
                paymentSummary
            }
        });

    } catch (error) {
        console.error('Error in getOverallDashboardData:', error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

// Get monthly sales and payment report
exports.getMonthlySalesReport = async (req, res) => {
    try {
        const { tenantId, year = new Date().getFullYear() } = req.body;

        const whereClause = {
            ...(tenantId && { tenantId }),
            orderDate: {
                [Sequelize.Op.between]: [
                    new Date(`${year}-01-01`),
                    new Date(`${year}-12-31`)
                ]
            }
        };

        // Fetch orders and payments data in parallel
        const [ordersByMonth, paymentsByMonth] = await Promise.all([
            OrderModel.findAll({
                where: whereClause,
                attributes: [
                    [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')), 'month'],
                    [Sequelize.fn('COUNT', Sequelize.col('orderId')), 'orderCount'],
                    [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount']
                ],
                group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate'))]
            }),
            PaymentModel.findAll({
                where: {
                    ...whereClause,
                    paymentStatus: 'PAID'
                },
                attributes: [
                    [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('paymentDate')), 'month'],
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalPayments']
                ],
                group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('paymentDate'))]
            })
        ]);

        // Initialize monthly report structure
        const monthlyReport = Array.from({ length: 12 }, (_, index) => ({
            month: moment().month(index).format('MMMM'),
            orderCount: 0,
            totalAmount: 0,
            totalPayments: 0
        }));

        // Populate orders data
        ordersByMonth.forEach(order => {
            const monthIndex = moment(order.getDataValue('month')).month();
            monthlyReport[monthIndex].orderCount = parseInt(order.getDataValue('orderCount'));
            monthlyReport[monthIndex].totalAmount = parseFloat(order.getDataValue('totalAmount') || 0);
        });

        // Populate payments data
        paymentsByMonth.forEach(payment => {
            const monthIndex = moment(payment.getDataValue('month')).month();
            monthlyReport[monthIndex].totalPayments = parseFloat(payment.getDataValue('totalPayments') || 0);
        });

        // Calculate summary
        const summary = monthlyReport.reduce((acc, month) => ({
            totalOrders: acc.totalOrders + month.orderCount,
            totalAmount: acc.totalAmount + month.totalAmount,
            totalPayments: acc.totalPayments + month.totalPayments
        }), { totalOrders: 0, totalAmount: 0, totalPayments: 0 });

        return res.status(200).json({
            success: true,
            data: {
                year,
                monthlyReport,
                summary
            }
        });

    } catch (error) {
        console.error('Error in getMonthlySalesReport:', error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};