const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Permissions', {
        ID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        Module: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        IsChecked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'Permissions',
        timestamps: false,
    });
};
