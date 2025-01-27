// NotificationHistory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('SilentNotification', {
        SilentNotificationID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        componentName: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        dynamicUi: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            //defaultValue: false,
        },
        component: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        Status: {
            type: DataTypes.ENUM('SENT', 'FAILED'),
            allowNull: false,
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        tableName: 'SilentNotification',
        timestamps: true,
    });
};