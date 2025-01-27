const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Payment', {
        PaymentID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references:{
                model:'Orders',
                key:'OrderID'
            }
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Tenant',
                key: 'TenantID'
            }
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            }
        },
        PaymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        Amount: {
            type: DataTypes.DECIMAL(10, 2)
        },
        PaymentMethod: {
            type: DataTypes.STRING(50)
        },
        PaymentStatus: {
            type: DataTypes.STRING(50)
        },
        MaskedCardNumber: {
            type: DataTypes.STRING(20)
        }
    }, {
        tableName: 'Payment',
        timestamps: false
    });
};
