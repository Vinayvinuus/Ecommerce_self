const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Feedback', {
        FeedbackID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        ProductID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Product', // Reference to the Product model
                key: 'ProductID'
            }
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Orders',
                key: 'OrderID'
            }
        },
        OrderItemID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'OrderItems',
                key: 'OrderItemID'
            }
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customer', // Reference to the User model
                key: 'CustomerID'
            }
        },
        Rating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        FeedbackImageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Comment: {
            type: DataTypes.TEXT,
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
        tableName: 'Feedback',
        timestamps: false
        
    });


};
