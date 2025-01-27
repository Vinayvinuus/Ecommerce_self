const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize)=>{
    return sequelize.define('Image', {
    ImageID: {
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
    ProductID:{
        type: DataTypes.INTEGER,
        references: {
            model: 'Product',
            key: 'ProductID'
        }
    },
    ColourID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Colour',
            key: 'ColourID'
        }
    },
    UserID: {
        type: DataTypes.INTEGER
    },
    ImageUrl: {
        type: DataTypes.STRING(500),
    },
    Description: {
        type: DataTypes.STRING
    },
    Default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    VariantID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ProductVariant',
            key: 'VariantID'
        },
        onDelete: 'SET NULL'
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
    tableName: 'Image',
    timestamps: false 
});
};