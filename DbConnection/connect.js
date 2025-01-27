require('dotenv').config();

const { Sequelize } = require('sequelize');
 
const sequelize = new Sequelize(
   {
  dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      max: 10,         // Maximum number of connections in the pool
      min: 0,          // Minimum number of connections in the pool
      acquire: 30000,  // Maximum time, in ms, to acquire a connection
      idle: 10000      // Maximum time, in ms, that a connection can be idle
    },
  logging: false, 
  dialectOptions: {
    ssl: {
        require: true,
        rejectUnauthorized: false 
    }
 }


});


//importing models users
const TenantModel = require('../Models/TenantMd')(sequelize);
const UserManagementModel = require('../Models/UserManagementMd')(sequelize);
const StoreModel= require('../Models/StoreMd')(sequelize);
const MapStoreUser = require('../Models/MapStoreUserMd')(sequelize);

const CustomerModel = require('../Models/CustomerMd')(sequelize);
const AddressModel = require('../Models/AddressMd')(sequelize);
const CityModel= require('../Models/CityMd')(sequelize);
const StateModel=require('../Models/StateMd')(sequelize);
const CountryModel=require('../Models/CountryMd')(sequelize,);

//permissions
const RoleModel=require('../Models/RoleMd')(sequelize);
const PermissionsModel= require('../Models/PermissionsMd')(sequelize);
const MapRolePermissionsModel= require('../Models/MapRolePermissionsMd')(sequelize);



//importing models dynamic data
const ProductModelss = require('../Models/ProductMd')(sequelize)
const ProductVariantModel = require('../Models/ProductVariantMd')(sequelize)
const ImagesModel = require('../Models/ImageMd')(sequelize)
const OrdersModel = require('../Models/OrdersMd')(sequelize)
const OrderItemsModel = require('../Models/OrderItemsMd')(sequelize)
const OrderHistoryModel = require('../Models/OrderHistoryMd')(sequelize)
const OrderItemStatusHistoryModel = require('../Models/OrderItemStatusHistoryMd')(sequelize)

const PaymentModel = require('../Models/PaymentMd')(sequelize);
const feedBackModel = require('../Models/FeedbackMd')(sequelize);
const ProductTypeModel = require('../Models/ProductTypeMd')(sequelize);
const NotificationHistoryModel = require('../Models/NotificationHistory')(sequelize);
const DeviceTokenModel = require('../Models/DeviceToken')(sequelize);
const DynamicUIComponentModel = require('../Models/DynamicUIMd')(sequelize);
const SilentNotificationModel = require('../Models/SilentNotificationMd')(sequelize);

//importing models static data
const SizeModel = require('../Models/SizeMd')(sequelize);
const ColourModel = require('../Models/ColourMd')(sequelize);
const CategoryModel = require('../Models/CategoryMd')(sequelize)
const BrandModel = require('../Models/BrandMd')(sequelize) 
const OrderStatusModel=require('../Models/OrderStatusMd')(sequelize,);
const BannerimageModel = require('../Models/BannerMd')(sequelize);




UserManagementModel.belongsTo(CityModel, {
  foreignKey: 'CityID',
  as: 'City', // Alias for the association
});

UserManagementModel.belongsTo(StateModel, {
  foreignKey: 'StateID',
  as: 'State', // Alias for the association
});

UserManagementModel.belongsTo(CountryModel, {
  foreignKey: 'CountryID',
  as: 'Country', // Alias for the association
});


// In Store model
StoreModel.belongsTo(CityModel, { foreignKey: 'CityID', as: 'City' });

// In City model
CityModel.hasMany(StoreModel, { foreignKey: 'CityID', as: 'Stores' });

// In Store model
StoreModel.belongsTo(StateModel, { foreignKey: 'StateID', as: 'State' });

// In StateProvince model
StateModel.hasMany(StoreModel, { foreignKey: 'StateID', as: 'Stores' });
// Store.js
StoreModel.belongsTo(CountryModel, { foreignKey: 'CountryID', as: 'Country' });
// Country.js
CountryModel.hasMany(StoreModel, { foreignKey: 'CountryID', as: 'Stores' });


// UserManagement to Store association
StoreModel.hasMany(UserManagementModel, { foreignKey: 'StoreID', as: 'Users' });
UserManagementModel.belongsTo(StoreModel, { foreignKey: 'StoreID', as: 'Store' });

// UserManagement to MapStoreUser
UserManagementModel.hasMany(MapStoreUser, { foreignKey: 'UserID', as: 'MappedStores' });
MapStoreUser.belongsTo(UserManagementModel, { foreignKey: 'UserID', as: 'User' });

// Store to MapStoreUser
StoreModel.hasMany(MapStoreUser, { foreignKey: 'StoreID', as: 'MappedUsers' });
MapStoreUser.belongsTo(StoreModel, { foreignKey: 'StoreID', as: 'Store' });


// Role to Store association
StoreModel.hasMany(RoleModel, {foreignKey: 'StoreID',as: 'Role'});
RoleModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'Store'});

//permissions
// Role to MapRolePermissionsModel
RoleModel.hasMany(MapRolePermissionsModel, { foreignKey: 'RoleID', as: 'RolePermissions' });
MapRolePermissionsModel.belongsTo(RoleModel, { foreignKey: 'RoleID' });

// Permissions to MapRolePermissionsModel
MapRolePermissionsModel.belongsTo(PermissionsModel, { foreignKey: 'PermissionID' });
PermissionsModel.hasMany(MapRolePermissionsModel, { foreignKey: 'PermissionID', as: 'MappedRoles' });

// UserManaement to Roles association
UserManagementModel.belongsTo(RoleModel, { foreignKey: 'RoleID', as: 'UserRole' });
RoleModel.hasMany(UserManagementModel, { foreignKey: 'RoleID' });

// Customer to Roles association
CustomerModel.belongsTo(RoleModel, { foreignKey: 'RoleID', as: 'CustomerRole' });
RoleModel.hasMany(CustomerModel, { foreignKey: 'RoleID' });

/*---- users realted associations ----*/
// Tenant and UserManagement (One-to-many: A Tenant has many UserManagement entries)
TenantModel.hasMany(UserManagementModel, { foreignKey: 'TenantID', as: 'UserManagements' });
UserManagementModel.belongsTo(TenantModel, { foreignKey: 'TenantID', as: 'Tenant' });

// Tenant and Customer (One-to-many: A Tenant has many Customers)
TenantModel.hasMany(CustomerModel, { foreignKey: 'TenantID', as: 'Customers' });
CustomerModel.belongsTo(TenantModel, { foreignKey: 'TenantID', as: 'Tenant' });

// Address and Customer (One-to-many: An Address can have many Customers)
// AddressModel.hasMany(CustomerModel, { foreignKey: 'AddressID', as: 'Customers' });
// CustomerModel.belongsTo(AddressModel, { foreignKey: 'AddressID', as: 'Address' });


AddressModel.belongsTo(CustomerModel,{foreignKey:'CustomerID',as :'Customers'} );
CustomerModel.hasMany(AddressModel,{foreignKey:'CustomerID',as:'Addresses'});


// Address belongs to City
AddressModel.belongsTo(CityModel, { foreignKey: 'CityID', as: 'City' });
CityModel.hasMany(AddressModel, { foreignKey: 'CityID', as: 'Address' });

// Address belongs to State
AddressModel.belongsTo(StateModel, { foreignKey: 'StateID', as: 'State' });
StateModel.hasMany(AddressModel, { foreignKey: 'StateID', as: 'Address' });

// Address belongs to Country
AddressModel.belongsTo(CountryModel, { foreignKey: 'CountryID', as: 'Country' });
CountryModel.hasMany(AddressModel, { foreignKey: 'CountryID', as: 'Address' });



/*---- product related associations -----*/
// Product and ProductVariant Associations
// One-to-Many
ProductModelss.hasMany(ProductVariantModel, { foreignKey: 'ProductID', as: 'ProductVariants' });
ProductVariantModel.belongsTo(ProductModelss, { foreignKey: 'ProductID', as: 'Product' });

// Product and Image Associations
// One-to-Many
ProductModelss.hasMany(ImagesModel, { foreignKey: 'ProductID', as: 'ProductImages' }); // Updated alias to 'ProductImages'
ImagesModel.belongsTo(ProductModelss, { foreignKey: 'ProductID', as: 'Product' });

// ProductVariant and Image Associations
// One-to-Many
ProductVariantModel.hasMany(ImagesModel, { foreignKey: 'VariantID', as: 'VariantImages' }); // Updated alias to 'VariantImages'
ImagesModel.belongsTo(ProductVariantModel, { foreignKey: 'VariantID', as: 'ProductVariants' }); // Updated alias to 'ProductVariant'

// Product and Category Association
// Many-to-One
ProductModelss.belongsTo(CategoryModel, { foreignKey: 'CategoryID', as: 'Category' });

// Product and Brand Association
// Many-to-One
ProductModelss.belongsTo(BrandModel, { foreignKey: 'BrandID', as: 'Brand' });

// Brand model definition
BrandModel.hasMany(ProductModelss, {
  foreignKey: 'BrandID',  // Make sure the foreign key matches in both models
  as: 'Product'
});

ProductModelss.belongsTo(ProductTypeModel, { 
  foreignKey: 'ProductTypeID', 
  as: 'ProductType' 
});

ProductTypeModel.hasMany(ProductModelss, { 
  foreignKey: 'ProductTypeID' 
});

// ProductVariant and Size Association
// One-to-Many
SizeModel.hasMany(ProductVariantModel, { foreignKey: 'SizeID', as: 'ProductVariants' }); // Updated alias to 'SizeVariants'
ProductVariantModel.belongsTo(SizeModel, { foreignKey: 'SizeID', as: 'Size' });

// ProductVariant and Colour Association
// Many-to-One
ProductVariantModel.belongsTo(ColourModel, { foreignKey: 'ColourID', as: 'Colour' }); 
// Colour and ProductVariant Associations
ColourModel.hasMany(ProductVariantModel, {  foreignKey: 'ColourID',as: 'ProductVariants'});



//Orders
/*OrdersModel.belongsTo(CustomerModel, { 
  foreignKey: 'CustomerID', 
  as: 'Customer' 
});

OrdersModel.belongsTo(AddressModel, { 
  foreignKey: 'AddressID', 
  as: 'Address' 
});

OrdersModel.hasMany(OrderItemsModel, { 
  foreignKey: 'OrderID', 
  as: 'OrderItems' 
});

OrdersModel.hasMany(OrderHistoryModel, { 
  foreignKey: 'OrderID', 
  as: 'OrderHistory' 
});

OrdersModel.hasMany(PaymentModel, { 
  foreignKey: 'OrderID', 
  as: 'Payments' 
});

OrdersModel.hasMany(feedBackModel, { 
  foreignKey: 'OrderID', 
  as: 'Feedback' 
});

//OrderHistory to OrderStatus association
OrderStatusModel.hasMany(OrderHistoryModel, {foreignKey: 'StatusID', as: 'OrdersStatus'});
OrderHistoryModel.belongsTo(OrderStatusModel, {foreignKey: 'StatusID', as: 'OrdersStatus'});


//OrderItems
OrderItemsModel.belongsTo(OrdersModel, { foreignKey: 'OrderID', as: 'Orders' });
OrderItemsModel.belongsTo(ProductModelss, { foreignKey: 'ProductID', as: 'Product' });
OrderItemsModel.belongsTo(ProductVariantModel, { foreignKey: 'VariantID' , as: 'ProductVariants'});



//OrderHistory
OrderHistoryModel.belongsTo(OrdersModel, { foreignKey: 'OrderID', as: 'Orders' });
OrderHistoryModel.belongsTo(CustomerModel, { foreignKey: 'CustomerID', as: 'Customer' });
OrderHistoryModel.belongsTo(ProductModelss, { foreignKey: 'ProductID', as: 'Product' }); */


// Orders
OrdersModel.belongsTo(CustomerModel, { 
  foreignKey: 'CustomerID', 
  as: 'Customer' 
});

OrdersModel.belongsTo(AddressModel, { 
  foreignKey: 'AddressID', 
  as: 'Address' 
});

OrdersModel.hasMany(OrderItemsModel, { 
  foreignKey: 'OrderID', 
  as: 'OrderItems' 
});

OrdersModel.hasMany(OrderHistoryModel, { 
  foreignKey: 'OrderID', 
  as: 'OrderHistory' 
});

OrdersModel.hasMany(PaymentModel, { 
  foreignKey: 'OrderID', 
  as: 'Payments' 
});

OrdersModel.hasMany(feedBackModel, { 
  foreignKey: 'OrderID', 
  as: 'Feedback' 
});

// OrderItems
OrderItemsModel.belongsTo(OrdersModel, { 
  foreignKey: 'OrderID', 
  as: 'Orders' 
});

OrderItemsModel.belongsTo(ProductModelss, { 
  foreignKey: 'ProductID', 
  as: 'Product' 
});

OrderItemsModel.belongsTo(ProductVariantModel, { 
  foreignKey: 'ProductVariantID', 
  as: 'ProductVariants' 
});

// OrderItems to OrderItemStatusHistory association
OrderItemsModel.hasMany(OrderItemStatusHistoryModel, { 
  foreignKey: 'OrderItemId', 
  as: 'OrderItemStatusHistory' 
});

OrderItemStatusHistoryModel.belongsTo(OrderItemsModel, { 
  foreignKey: 'OrderItemId', 
  as: 'OrderItems' 
});

// OrderHistory
OrderHistoryModel.belongsTo(OrdersModel, { 
  foreignKey: 'OrderID', 
  as: 'Orders' 
});

OrderHistoryModel.belongsTo(CustomerModel, { 
  foreignKey: 'CustomerID', 
  as: 'Customer' 
});

OrderHistoryModel.belongsTo(ProductModelss, { 
  foreignKey: 'ProductID', 
  as: 'Product' 
});

// OrderHistory to OrderStatus association
OrderStatusModel.hasMany(OrderHistoryModel, { 
  foreignKey: 'StatusID', 
  as: 'OrdersStatus' 
});

OrderHistoryModel.belongsTo(OrderStatusModel, { 
  foreignKey: 'StatusID', 
  as: 'OrdersStatus' 
});

// OrderItemStatusHistory to OrderStatus association
OrderStatusModel.hasMany(OrderItemStatusHistoryModel, { 
  foreignKey: 'StatusId', 
  as: 'OrderItemStatus' 
});

OrderItemStatusHistoryModel.belongsTo(OrderStatusModel, { 
  foreignKey: 'StatusId', 
  as: 'OrderItemStatus' 
});




//Payment
PaymentModel.belongsTo(OrdersModel, { foreignKey: 'OrderID', as: 'Orders' });

// Feedback Associations
feedBackModel.belongsTo(ProductModelss, { foreignKey: 'ProductID', as: 'Product' });
feedBackModel.belongsTo(CustomerModel, { foreignKey: 'CustomerID', as: 'Customer' });
feedBackModel.belongsTo(OrdersModel, { foreignKey: 'OrderID', as: 'Orders' });
feedBackModel.belongsTo(OrderItemsModel, { foreignKey: 'OrderItemID', as: 'OrderItem' });




//
ProductModelss.hasMany(feedBackModel, { foreignKey: 'ProductID', as: 'Feedback' });
CustomerModel.hasMany(feedBackModel, { foreignKey: 'CustomerID', as: 'Feedback' });
CustomerModel.hasMany(OrdersModel, { 
  foreignKey: 'CustomerID', 
  as: 'Orders' 
});

CustomerModel.hasMany(OrderItemsModel, { 
  foreignKey: 'CustomerID', 
  as: 'OrderItems' 
});

ProductModelss.hasMany(OrderItemsModel, { 
  foreignKey: 'ProductID', 
  as: 'OrderItems' 
});

ProductVariantModel.hasMany(OrderItemsModel, { 
  foreignKey: 'ProductVariantID', 
  as: 'OrderItems' 
});


// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database.:', err);
  });

  // Sync models
sequelize.sync({ alter: true }).then(() => {
    console.log('Database & tables created!');
});
//force :true => sequelize.sync({ force: true }).then(() => {
  //   console.log('Database & tables created!');
  // });
module.exports = { sequelize,TenantModel, UserManagementModel,CustomerModel,AddressModel,CityModel,StateModel,CountryModel,
                    ProductModelss, ProductVariantModel, ImagesModel, CategoryModel, BrandModel,SizeModel,ColourModel,
                    OrdersModel,OrderItemsModel,OrderHistoryModel,PaymentModel,feedBackModel,ProductTypeModel,
                    RoleModel,PermissionsModel,MapRolePermissionsModel,DeviceTokenModel,NotificationHistoryModel,
                    DynamicUIComponentModel ,OrderStatusModel ,BannerimageModel,StoreModel,MapStoreUser,
                    SilentNotificationModel,OrderItemStatusHistoryModel
                  }
                  