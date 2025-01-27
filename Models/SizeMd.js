const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
     return   sequelize.define('Size', {
    SizeID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    TenantID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Label: {
        type: DataTypes.STRING,
        allowNull: true
    },
    NumericSize: {
        type: DataTypes.STRING,
        allowNull: true
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
    tableName: 'Size',
    timestamps: false 
});
};

