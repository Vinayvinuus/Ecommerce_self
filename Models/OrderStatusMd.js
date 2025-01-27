const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderStatus', {
        StatusID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        OrderStatus: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        HexColorCode:{
            type: DataTypes.STRING,
            allowNull: true
        },
        CreatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'OrderStatus',
        timestamps: false
    });
};


// -- Insert for a new Order Status "Pending"
// INSERT INTO "public"."OrderStatus" ("TenantID", "OrderStatus", "HexColorCode", "CreatedBy", "UpdatedBy")
// VALUES (1, 'Pending', '#FFA500', 'Admin', 'Admin');

// -- Insert for a new Order Status "Processing"
// INSERT INTO "public"."OrderStatus" ("TenantID", "OrderStatus", "HexColorCode", "CreatedBy", "UpdatedBy")
// VALUES (1, 'Processing', '#1E90FF', 'Admin', 'Admin');

// -- Insert for a new Order Status "Shipped"
// INSERT INTO "public"."OrderStatus" ("TenantID", "OrderStatus", "HexColorCode", "CreatedBy", "UpdatedBy")
// VALUES (1, 'Shipped', '#32CD32', 'Admin', 'Admin');

// -- Insert for a new Order Status "Delivered"
// INSERT INTO "public"."OrderStatus" ("TenantID", "OrderStatus", "HexColorCode", "CreatedBy", "UpdatedBy")
// VALUES (1, 'Delivered', '#228B22', 'Admin', 'Admin');

// -- Insert for a new Order Status "Cancelled
// INSERT INTO "public"."OrderStatus" ("TenantID", "OrderStatus", "HexColorCode", "CreatedBy", "UpdatedBy")
// VALUES (1, 'Cancelled', '#FF0000', 'Admin', 'Admin');
