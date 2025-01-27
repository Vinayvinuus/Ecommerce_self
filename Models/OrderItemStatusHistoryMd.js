const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderItemStatusHistory', {
        StatusHistoryId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        OrderItemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'OrderItems', 
                key: 'OrderItemID', // Replace with the actual primary key of the OrderItems table
            },
        },
        StatusId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'OrderStatus', 
                key: 'StatusID', // Replace with the actual primary key of the OrderItemStatus table
            },
        },
        OrderStatus: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        ChangedOn: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        Remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'OrderItemStatusHistory',
        timestamps: false,
    });
};
