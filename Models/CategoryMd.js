const { DataTypes } = require('sequelize');

module.exports = (sequelize)=>{
return sequelize.define('Category', {
    CategoryID: {
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
    CategoryName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    CategoryDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    CategoryImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ParentCategoryId: {
        type: DataTypes.INTEGER,
        allowNull:true
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
    tableName: 'Category',
    timestamps: false
});
};
