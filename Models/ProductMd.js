const { DataTypes } = require('sequelize');

module.exports = (sequelize)=>{
   return sequelize.define('Product', {
    ProductID: {
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
    ProductTypeID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ProductType', // reference to the ProjectType model
            key: 'ProductTypeID'
        },
    },
    ProductName: {
        type: DataTypes.STRING,
    },
    ProductDescription: {
        type: DataTypes.TEXT,
    },
    Gender: {
        type: DataTypes.STRING(20),
      },
    BrandID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Brand', // reference to the Brand model
            key: 'BrandID'
        },
        onDelete: 'SET NULL'
    },
    CategoryID: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Category', // reference to the Category model
            key: 'CategoryID'
        },
        onDelete: 'SET NULL'
    },
    MRP: {
        type: DataTypes.DECIMAL,
    },
    ProductDiscount: { // Field to store the discounted price
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    CreatedBy: DataTypes.STRING,
    CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    UpdatedBy: DataTypes.STRING,
    UpdatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'Product',
    timestamps: false 
});
};