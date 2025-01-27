const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('UserManagement', {
        UserID: {
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
            },
            onDelete: 'CASCADE'
        },
        FirstName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        LastName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        EmployeeID: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false,
            defaultValue: () => `EMP-${Math.floor(Math.random() * 1000000)}` 
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        Password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        PhoneNumber: {
            type: DataTypes.STRING,
            unique: true
        },
        Gender: {
            type: DataTypes.CHAR(1),
            allowNull: true,
            validate: {
                isIn: [['M', 'F']]
            }
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Role',
                key: 'RoleID'
            }
        },
        ProfileImageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        AddressLine: {
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
        Pincode: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'UserManagement',
        timestamps: false
    });
};

       
