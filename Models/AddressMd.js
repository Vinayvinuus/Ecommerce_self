const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Address', {
        AddressID: {
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
        CustomerID:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            },
            onDelete: 'CASCADE' 
        },
        AddressLine1: {
            type: DataTypes.STRING,
            allowNull: true
        },
        AddressLine2: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CityID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        StateID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        CountryID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Zipcode: {
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
        tableName: 'Address',
        timestamps: false
    });
};
