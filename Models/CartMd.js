const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Cart', {
        CartID: {
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
            references: {
                model: 'Customer',
                key: 'CustomerID'
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
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Cart',
        timestamps: false
    });
};
