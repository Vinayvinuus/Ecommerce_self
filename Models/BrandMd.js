const { DataTypes } = require('sequelize');


module.exports = (sequelize)=>{
return sequelize.define('Brand', {
    BrandID: {
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
    BrandName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    CategoryID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    BrandCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    IsActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
    tableName: 'Brand',
    timestamps: false 
});

};


