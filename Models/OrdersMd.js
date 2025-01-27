const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Orders', {
        OrderID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
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
            references:{
                model: 'Customer',
                key:'CustomerID'
            }
        },
        OrderDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        TotalQuantity: {
            type: DataTypes.INTEGER
        },
        AddressID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references:{
                model:'Address',
                key: 'AddressID'
            }
        },
        TotalAmount: {
            type: DataTypes.DECIMAL(10, 2)
        },
        OrderStatus: {
            type: DataTypes.STRING(50)
        },
        PaymentStatus: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
            defaultValue: 'PENDING'
        },
        Comments: {
            type: DataTypes.TEXT
        },
        OrderBy: {
            type: DataTypes.STRING
        },
        DeliveryDate: {
            type: DataTypes.DATE
        },
        CreatedBy: {
            type: DataTypes.STRING
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Orders',
        timestamps: false
    });

};
