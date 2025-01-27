const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Bannerimage', {
        BannerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        BannerName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        BannerImage: {
            type: DataTypes.STRING, 
            allowNull: true
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        tableName: 'Bannerimage',
        timestamps: false
    });
};
