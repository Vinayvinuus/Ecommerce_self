const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Role', {
        RoleID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        RoleName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        Status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            allowNull: false,
            defaultValue: 'Active',
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        CreatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        UpdatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true,
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
        tableName: 'Role',
        timestamps: false,
    });
};
