const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Map_Role_Permissions', {
        ID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Role',
                key: 'RoleID',
            },
        },
        PermissionID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Permissions',
                key: 'ID',
            },
        },
        StoreID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'Map_Role_Permissions',
        timestamps: false,
    });
};
