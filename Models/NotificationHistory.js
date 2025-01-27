// NotificationHistory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('NotificationHistory', {
        NotificationID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        Title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        Body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        ImageUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        Status: {
            type: DataTypes.ENUM('SENT', 'FAILED'),
            allowNull: false,
        },
        DeviceTokenID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'DeviceTokens',
                key: 'DeviceTokenID'
            },
            onDelete: 'CASCADE',
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        tableName: 'NotificationHistory',
        timestamps: true,
    });
};