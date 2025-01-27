const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderItems', {
        OrderItemID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Orders',
                key: 'OrderID'
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
        ProductID: { 
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Product',
                key: 'ProductID'
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
        ProductVariantID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'ProductVariant',
                key: 'VariantID'
            }
        },
        Quantity: {
            type: DataTypes.INTEGER
        },
        Price: {
            type: DataTypes.DECIMAL
        },
        DeliveryDate: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'OrderItems',
        timestamps: false
    });

};
