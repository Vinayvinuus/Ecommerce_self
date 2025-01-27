const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Customer', {
        CustomerID: {
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
        FirstName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        LastName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        Password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        PhoneNumber: {
            type: DataTypes.STRING,
            unique: true
        },
        Gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: true
        },
        DateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        OTP: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        OTPExpiry: {
            type: DataTypes.DATE,
            allowNull: true
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Role',
                key: 'RoleID'
            }
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
        tableName: 'Customer',
        timestamps: false
    });
};
