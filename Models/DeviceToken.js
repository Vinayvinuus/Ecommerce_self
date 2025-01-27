// DeviceToken.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('DeviceToken', {
        DeviceTokenID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        FCMToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        DeviceID: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        DeviceName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
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
        tableName: 'DeviceTokens',
        timestamps: true,
    });
};

