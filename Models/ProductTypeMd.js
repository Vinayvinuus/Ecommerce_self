const { DataTypes } = require("sequelize")

module.exports = (sequelize) =>{
    return sequelize.define('ProductType',{
        ProductTypeID:{
            type:DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        ProductTypeName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        Status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            allowNull: false,
            defaultValue: 'Active'
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
    },{
        tableName: 'ProductType',
        timestamps: false,
    });
}