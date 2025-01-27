const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { OrdersModel,sequelize,OrderItemsModel,OrderHistoryModel,PaymentModel,
    CustomerModel, CustomerModel, PaymentModel } = require('../DbConnection/connect'); // Adjust your model paths accordingly

    exports.generateOrderReport = async (req, res) => {
        const { StartDate, EndDate, TenantID, CustomerID, OrderID } = req.body;
    
        try {
            let whereClause = {};
            if (StartDate && EndDate) {
                const startDate = new Date(StartDate);
                const endDate = new Date(EndDate);
                endDate.setUTCHours(23, 59, 59, 999);
                whereClause.CreatedAt = { [Op.between]: [startDate, endDate] };
            }
            if (TenantID) whereClause.TenantID = TenantID;
            if (CustomerID) whereClause.CustomerID = CustomerID;
            if (OrderID) whereClause.OrderID = OrderID;
    
            const orders = await OrdersModel.findAll({
                where: whereClause,
                include: [
                    { model: Customer, attributes: ['FirstName', 'LastName', 'Email', 'PhoneNumber'] },
                    { model: Payment, attributes: ['Amount'] },
                ],
                attributes: ['OrderID', 'OrderNumber', 'OrderDate', 'TotalAmount', 'OrderStatus', 'CreatedAt', 'UpdatedAt']
            });
    
            if (!orders.length) {
                return res.status(404).json({ message: 'No orders found for the given criteria' });
            }
    
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Order Report');
            worksheet.columns = [
                { header: 'Order Number', key: 'OrderNumber', width: 15 },
                { header: 'Order Date', key: 'OrderDate', width: 15 },
                { header: 'Order Status', key: 'OrderStatus', width: 15 },
                { header: 'Customer Name', key: 'CustomerName', width: 25 },
                { header: 'Customer Email', key: 'CustomerEmail', width: 25 },
                { header: 'Customer Phone', key: 'CustomerPhone', width: 15 },
                { header: 'Total Amount', key: 'TotalAmount', width: 15 },
                { header: 'Payment Amount', key: 'PaymentAmount', width: 15 },
            ];
    
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF622F0F' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
    
            orders.forEach((order) => {
                worksheet.addRow({
                    OrderNumber: order.OrderNumber,
                    OrderDate: order.OrderDate?.toISOString().split('T')[0] || 'N/A',
                    OrderStatus: order.OrderStatus || 'N/A',
                    CustomerName: `${order.Customer?.FirstName || ''} ${order.Customer?.LastName || ''}`.trim(),
                    CustomerEmail: order.Customer?.Email || 'N/A',
                    CustomerPhone: order.Customer?.PhoneNumber || 'N/A',
                    TotalAmount: order.TotalAmount || 0,
                    PaymentAmount: order.Payments?.reduce((sum, p) => sum + (p.Amount || 0), 0) || 0,
                });
            });
    
            const reportsDir = path.join(__dirname, '../reports');
            const fileName = `OrderReport_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
            const filePath = path.join(reportsDir, fileName);
    
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
            await workbook.xlsx.writeFile(filePath);
    
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    res.status(500).send('Error downloading file');
                }
            });
        } catch (error) {
            console.error('Error generating order report:', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    };
    


exports.generatePaymentReport = async (req, res) => {
    const { StartDate, EndDate, TenantID, PaymentMethod } = req.body;

    try {
        let whereClause = {};
        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999);
            whereClause.PaymentDate = { [Op.between]: [startDate, endDate] };
        }
        if (TenantID) whereClause.TenantID = TenantID;
        if (PaymentMethod) whereClause.PaymentMethod = PaymentMethod;

        const payments = await PaymentModel.findAll({
            where: whereClause,
            include: [{ model: Orders, attributes: ['OrderNumber'] }],
            attributes: ['PaymentID', 'OrderID', 'Amount', 'PaymentDate', 'PaymentMethod', 'CreatedAt'],
        });

        if (!payments.length) {
            return res.status(404).json({ message: 'No payments found for the given criteria' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payment Report');
        worksheet.columns = [
            { header: 'Payment ID', key: 'PaymentID', width: 15 },
            { header: 'Order Number', key: 'OrderNumber', width: 15 },
            { header: 'Payment Date', key: 'PaymentDate', width: 15 },
            { header: 'Payment Method', key: 'PaymentMethod', width: 15 },
            { header: 'Amount', key: 'Amount', width: 10 },
        ];

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF622F0F' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        payments.forEach((payment) => {
            worksheet.addRow({
                PaymentID: payment.PaymentID,
                OrderNumber: payment.Order?.OrderNumber || 'N/A',
                PaymentDate: payment.PaymentDate?.toISOString().split('T')[0] || 'N/A',
                PaymentMethod: payment.PaymentMethod || 'N/A',
                Amount: payment.Amount || 0,
            });
        });

        const reportsDir = path.join(__dirname, '../reports');
        const fileName = `PaymentReport_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
        const filePath = path.join(reportsDir, fileName);

        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });
    } catch (error) {
        console.error('Error generating payment report:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
