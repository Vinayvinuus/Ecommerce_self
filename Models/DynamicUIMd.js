const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('DynamicUIComponent', {
        ComponentID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ComponentName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ComponentCode: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Stores the dynamic UI configuration in JSON format'
        },
        Version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Admin ID who created the component'
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        tableName: 'DynamicUIComponents',
        timestamps: true,
    });
};