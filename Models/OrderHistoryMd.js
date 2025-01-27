const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderHistory', {
        OrderHistoryID: {
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
        OrderItemID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'OrderItems',
                key: 'OrderItemID'
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
            references:{
                model: 'Customer',
                key:'CustomerID'
            }
        },ProductID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Product',
                key: 'ProductID'
            }
        },
        OrderStatus: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        StatusID: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'OrderHistory',
        timestamps: false
    });

};
