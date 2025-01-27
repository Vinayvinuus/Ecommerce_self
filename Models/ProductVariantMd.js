const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('ProductVariant', {
        VariantID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        ProductID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Product',
                key: 'ProductID'
            },
            onDelete: 'CASCADE'
        },
        ColourID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Colour',
                key: 'ColourID'
            },
            onDelete: 'SET NULL'
        },
        SizeID: {
            type: DataTypes.STRING,
            references: {
                model: 'Size',
                key: 'SizeID'
            },
            onDelete: 'SET NULL'
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        SellingPrice: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0.00
        },
        CreatedBy: DataTypes.STRING,
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: DataTypes.STRING,
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ProductVariant',
        timestamps: false 
    });
};
