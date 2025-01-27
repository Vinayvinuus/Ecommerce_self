const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Colour', {
    ColourID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    TenantID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Tenant',
            key: 'TenantID'
        }
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    HexCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    RgbCode: {
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
    tableName: 'Colour',
    timestamps: false 
});
};

