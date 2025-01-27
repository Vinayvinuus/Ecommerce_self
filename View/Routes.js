const express = require('express');
const router = express.Router();

const{tenantSignup,tenantlogin} = require('../Authentication/TenantAuth');
const{createOrUpdateUser,loginUser,getAllUsers, getUserById, deleteUser,
    forgotUserPassword, validateUserOtp ,validateOtpAndUpdateUserPassword, updateUserPassword} = require('../Authentication/UserAuth');
const {customerLogin,initiateRegistration, verifyOTP,completeRegistration,
    getCustomerById,getAllCustomers,updateCustomer,deleteCustomer,
    forgotPassword,verifyForgotPasswordOTP,resetPassword } = require('../Authentication/CustomerAuth');
const CityController=require('../Controller/CitiesbyState');
const StateController=require('../Controller/StatesbyCountry');

const{createBrand,getAllBrands,getBrandById,updateBrand,deleteBrand} = require('../Controller/BrandCon');
const{productWithImages,getProductDetails, getProductById,updateProductWithImages,deleteProductWithImages, getFilteredProducts} = require('../Controller/ProductCon');
const{createColour,getAllColours,getColourById,updateColour,deleteColour} = require('../Controller/ColourCon');
const{createSize,getAllSizes,getSizeById,updateSize,deleteSize} = require('../Controller/SizeCon');

const{Registerdevice,sendnotifications,sendSilentNotifications} = require('../Controller/NotificationController');
const{createdynamicui,getdynamicui,getAllDynamicUI,updatedynamicui} = require('../Controller/DynamicUIController');

const {createOrderWithDetails,getAllOrders,getOrderById,updateOrder,deleteOrder,getAllOrdersFilters,getOrdersByCustomerId,updateOrderItemStatus} = require('../Controller/OrderCon');

const {createOrderHistory,getAllOrderHistories,getOrderHistoryById,updateOrderHistory,deleteOrderHistory} = require('../Controller/OrderHistoryCon')

const {createOrderItem,getAllOrderItems,getOrderItemById,updateOrderItem,deleteOrderItem} = require('../Controller/OrderItemsCon');

const { createPayment, getAllPayments, getPaymentById, updatePayment, deletePayment } = require('../Controller/PaymentCon');

const { createOrUpdateMapStoreUser, getAllMapStoreUsers, getMapStoreUserById,getMapStoreUserByUserId ,deleteMapStoreUser} = require('../Controller/MapStoreUserController');


const CategoryController = require('../Controller/CategoryCon');
const PermissionController=require('../Controller/PermissionCon');
const FeedBackController = require('../Controller/feedBackCon');
const ProductTypeController = require('../Controller/ProductTypeCon');
const OrderStatusController=require('../Controller/OrderStatusController');
const BannerController=require('../Controller/BannerController');
const StoreController = require('../Controller/StoreController');
const roleController= require('../Controller/RoleCon');
const AddressController=require('../Controller/AddressController');
const { feedBackModel } = require('../DbConnection/connect');



router.post('/userlogin',loginUser);
router.post('/customerLogin', customerLogin);

const {verifyToken,isAdmin,isUser,isCustomer} = require('../middleWare/verifyToken'); 

router.use(verifyToken);
// /* ----Tenant---- */
// // Register Tenant route 
// router.post('/tenantSignup',tenantSignup);
// // Login Tenant route  
// router.post('/tenantlogin',tenantlogin);

// // Register User route 
// router.post('/userCreateOrUpdate',createOrUpdateUser); 
// router.post('/userlogin',loginUser);
// router.get('/getAllUsers',getAllUsers);
// router.get('/getUserById/:id',getUserById)
// router.delete('/deleteUser/:id',deleteUser);

// router.post('/updateUserPassword',updateUserPassword);
// router.post('/forgotUserPassword',forgotUserPassword);
// router.post('/validateUserOtp',validateUserOtp);
// router.post('/validateOtpAndUpdateUserPassword',validateOtpAndUpdateUserPassword);


// /* ----customer{EndUser}---- */
// // Login customer route  
// router.post('/customerLogin',customerLogin);
// //forgot password

// router.post('/forgotPassword',forgotPassword);
// router.post('/verifyForgotPasswordOTP',verifyForgotPasswordOTP);
// router.post('/resetPassword',resetPassword);

// router.post('/generateOTP',initiateRegistration);
// router.post('/verifyOtpOtp',verifyOTP);
// router.post('/completeRegistration',completeRegistration);

// router.get('/getAllCustomers',getAllCustomers);
// router.get('/getCustomerById/:id',getCustomerById);
// router.put('/updateCustomer/:id',updateCustomer);
// router.delete('/deleteCustomer/:id',deleteCustomer);

// //Routes for StatesbyCountry and Getcitiesbystate
// router.get('/getCitiesByState',CityController.getCitiesByState);
// router.get('/getStatesByCountry',StateController.getStatesByCountry);
// router.get('/getCountries',StateController.getCountries);

// //Routes for Stores
// router.post('/createOrUpdateStore', StoreController.createOrUpdateStore);
// router.get('/getAllStores', StoreController.getAllStores);
// router.get('/getStoreById/:id', StoreController.getStoreById); 
// router.delete('/deleteStore/:id', StoreController.deleteStore);
// router.get('/getStoresForUser', StoreController.getStoresForUser);

// //Routes for Roles
// router.post('/createOrUpdateRole',roleController.createOrUpdateRole);
// router.get('/getAllRoles',roleController.getAllRoles);
// router.get('/getRoleById/:id', roleController.getRoleById); 
// router.delete('/deleteRole/:id',roleController.deleteRole);

// // Routes for MapStoreUser
// router.post('/mapstoreuser', createOrUpdateMapStoreUser);
// router.get('/getallmapstoreuser', getAllMapStoreUsers);
// router.get('/mapstoreuser/:id', getMapStoreUserById);
// router.get('/mapstoreuserbyUserID/:id', getMapStoreUserByUserId);
// router.delete('/deleteMapStoreUser/:MapStoreUserID', deleteMapStoreUser);

// //category
// router.post('/categoryWithImages',CategoryController.createCategory);
// router.get('/getAllCategories',CategoryController.getAllCategories);
// router.get('/getCategoryById/:id',CategoryController.getCategoryById);
// router.put('/updateCategory/:id',CategoryController.updateCategory);
// router.delete('/deleteCategory/:id',CategoryController.deleteCategory);

// //brnad
// router.post('/createBrand',createBrand);
// router.get('/getAllBrands',getAllBrands);
// router.get('/getBrandById/:id',getBrandById);
// router.put('/updateBrand/:id',updateBrand);
// router.delete('/deleteBrand/:id',deleteBrand);

// //product
// router.post('/productWithImages',productWithImages);
// router.get('/getProductDetails',getProductDetails);
// router.get('/getProductById/:id',getProductById);
// router.put('/updateProductWithImages/:id',updateProductWithImages);
// router.delete('/deleteProductWithImages/:id',deleteProductWithImages);
// router.get('/getFilteredProducts', getFilteredProducts);

// //ProducttType
// router.post('/createProductType',ProductTypeController.createProductType);
// router.get('/getAllProductTypes',ProductTypeController.getAllProductTypes);
// router.get('/getProductTypeById/:id',ProductTypeController.getProductTypeById);
// router.put('/updateProductType/:id',ProductTypeController.updateProductType);
// router.delete('/deleteProductType/:id',ProductTypeController.deleteProductType);

// //colour
// router.post('/createColour',createColour);
// router.get('/getAllColours',getAllColours);
// router.get('/getColourById/:id',getColourById);
// router.put('/updateColour/:id',updateColour);
// router.delete('/deleteColour/:id',deleteColour);
// //size
// router.post('/createSize',createSize);
// router.get('/getAllSizes',getAllSizes);
// router.get('/getSizeById/:id',getSizeById);
// router.put('/updateSize/:id',updateSize);
// router.delete('/deleteSize/:id',deleteSize);



// // routes for order with orderitems and orderhistory
// router.post('/createOrderWithDetails',createOrderWithDetails);
// router.get('/getAllOrders',getAllOrders);
// router.get('/getOrderById/:id',getOrderById);
// router.get('/getAllOrdersFilters',getAllOrdersFilters);
// router.put('/updateOrder/:id',updateOrder);
// router.delete('/deleteOrder/:id',deleteOrder);
// router.get('/getOrdersByCustomerId/:customerId',getOrdersByCustomerId);

// //order Status Update 
// router.put('/updateOrderItemStatus/:OrderID',updateOrderItemStatus);

// //orderhistory
// router.post('/createOrderHistory',createOrderHistory);
// router.get('/getAllOrderHistories',getAllOrderHistories);
// router.get('/getOrderHistoryById/:id',getOrderHistoryById);
// router.put('/updateOrderHistory/:id',updateOrderHistory);
// router.delete('/deleteOrderHistory/:id',deleteOrderHistory);

// //orderitems
// router.post('/createOrderItem',createOrderItem);
// router.get('/getAllOrderItems',getAllOrderItems);
// router.get('/getOrderItemById/:OrderID',getOrderItemById);
// router.put('/updateOrderItem/:OrderID',updateOrderItem);
// router.delete('/deleteOrderItem/:OrderID',deleteOrderItem);

// //routes for payments
// router.post('/createPayment',createPayment);
// router.put('/updatePayment/:id',updatePayment);
// router.get('/getAllPayments',getAllPayments);
// router.get('/getPaymentById/:id',getPaymentById);
// router.delete('/deletePayment/:id',deletePayment);



// //Rotes for Permissions
// router.post('/createPermission',PermissionController.createPermission);
// router.get('/getAllPermissions',PermissionController.getAllPermissions);
// router.get('/getAllPermissionsByRoleId/:roleId', PermissionController.getAllPermissionsByRoleId);
// // router.post('/addRolePermissionController',PermissionController.addRolePermissionController);
// router.post('/createOrUpdateRolePermissions',PermissionController.createOrUpdateRolePermissions);



// //routes for feedback
// router.post('/createOrUpdateFeedback',FeedBackController.createOrUpdateFeedback)
// router.get('/GetAllFeedBacks',FeedBackController.GetAllFeedBacks)
// router.get('/GetFeedBackByOrderID/:id',FeedBackController.GetFeedBackByOrderID)
// router.put('/UpdateFeedBack/:id',FeedBackController.UpdateFeedBack)
// router.delete('/DeleteFeedBack/:id',FeedBackController.DeleteFeedBack)
// router.get('/getFeedbackByProductId/:ProductID',FeedBackController.getFeedbackByProductId)

// //Routes for OrderStatus
// router.post('/CreateorupdateStatus',OrderStatusController.CreateorupdateStatus);
// router.get('/getAllOrderStatus',OrderStatusController.getAllOrderStatus);
// router.get('/getOrderStatusById/:StatusID',OrderStatusController.getOrderStatusById);
// router.delete('/deleteOrderStatusById/:StatusID',OrderStatusController.deleteOrderStatusById);


// //Routes for sendnotifications
// router.post('/Registerdevice',Registerdevice);
// router.post('/sendnotifications',sendnotifications);
// router.post('/notifications/silent',sendSilentNotifications)


// //Routes for Dynamicui
// router.post('/createdynamicui',createdynamicui);
// router.get('/getdynamicui/:componentName',getdynamicui);
// router.get('/getAllDynamicUI',getAllDynamicUI);

// //Routes for Banners
// router.post('/banners', BannerController.createBanner);
// router.put('/banners/:BannerID', BannerController.updateBanner);
// router.get('/banners/:BannerID', BannerController.getBannerById);
// router.get('/getAllBanners', BannerController.getAllBanners);

// //Routes for Address
// router.post('/createOrUpdateAddress',AddressController.createOrUpdateAddress);
// router.get('/getAllAddresses', AddressController.getAllAddresses);
// router.get('/getAddressById/:id', AddressController.getAddressById); 
// router.delete('/deleteAddress/:id', AddressController.deleteAddress); 
// router.get('/getAddressDetailsById/:id',AddressController.getAddressDetailsById);
// router.get('/getAddressesByCustomerId/:customerId',AddressController.getAddressesByCustomerId);




// Admin Routes: Admin can access everything
 // Ensure token is verified for all routes
// router.use(isAdmin);

router.use('/tenantSignup', isAdmin);  // Apply 'isAdmin' for tenantSignup route
router.use('/tenantlogin', isAdmin)
// Tenant routes
router.post('/tenantSignup', tenantSignup);
router.post('/tenantlogin', tenantlogin);

// Customer management
router.get('/getAllCustomers', getAllCustomers);
router.get('/getCustomerById/:id', getCustomerById);
router.put('/updateCustomer/:id', updateCustomer);
router.delete('/deleteCustomer/:id', deleteCustomer);

// Payment management
router.post('/createPayment',createPayment);
router.put('/updatePayment/:id',updatePayment);
router.get('/getAllPayments',getAllPayments);
router.get('/getPaymentById/:id',getPaymentById);
router.delete('/deletePayment/:id',deletePayment);

// Dynamic UI
router.post('/createdynamicui', createdynamicui);
router.put('/update-dynamic-ui',updatedynamicui);
router.get('/getdynamicui/:componentName',getdynamicui);
router.get('/getAllDynamicUI', getAllDynamicUI);

//Routes for Banners
router.post('/banners', BannerController.createBanner);
router.put('/banners/:BannerID', BannerController.updateBanner);
router.get('/banners/:BannerID', BannerController.getBannerById);
router.get('/getAllBanners', BannerController.getAllBanners);

//Routes for sendnotifications
router.post('/Registerdevice',Registerdevice);
router.post('/sendnotifications',sendnotifications);
router.post('/notifications/silent',sendSilentNotifications)


// Feedback
router.post('/createOrUpdateFeedback',FeedBackController.createOrUpdateFeedback)
router.get('/GetAllFeedBacks',FeedBackController.GetAllFeedBacks)
router.get('/GetFeedBackByOrderID/:id',FeedBackController.GetFeedBackByOrderID)
router.put('/UpdateFeedBack/:id',FeedBackController.UpdateFeedBack)
router.delete('/DeleteFeedBack/:id',FeedBackController.DeleteFeedBack)
router.get('/getFeedbackByProductId/:ProductID',FeedBackController.getFeedbackByProductId)


// Routes with mixed access levels (Admins & Users/Employees)
// router.use(verifyToken);


router.use(isUser); 
router.post('/userCreateOrUpdate',createOrUpdateUser); 
router.get('/getAllUsers',getAllUsers);
router.get('/getUserById/:id',getUserById)
router.delete('/deleteUser/:id',deleteUser);
router.post('/updateUserPassword',updateUserPassword);
router.post('/forgotUserPassword',forgotUserPassword);
router.post('/validateUserOtp',validateUserOtp);
router.post('/validateOtpAndUpdateUserPassword',validateOtpAndUpdateUserPassword);


// Order management
router.post('/createOrderWithDetails', createOrderWithDetails);
router.get('/getAllOrders', getAllOrders);
router.get('/getOrderById/:id', getOrderById);
router.put('/updateOrder/:id', updateOrder);
router.delete('/deleteOrder/:id', deleteOrder);
router.get('/getAllOrdersFilters',getAllOrdersFilters);
router.get('/getOrdersByCustomerId/:customerId',getOrdersByCustomerId);
router.put('/updateOrderItemStatus/:OrderID',updateOrderItemStatus);

// Product management
router.post('/productWithImages', productWithImages);
router.get('/getProductDetails', getProductDetails);
router.get('/getProductById/:id', getProductById);
router.put('/updateProductWithImages/:id', updateProductWithImages);
router.delete('/deleteProductWithImages/:id', deleteProductWithImages);
router.get('/getFilteredProducts', getFilteredProducts);

//orderitems
router.post('/createOrderItem',createOrderItem);
router.get('/getAllOrderItems',getAllOrderItems);
router.get('/getOrderItemById/:OrderID',getOrderItemById);
router.put('/updateOrderItem/:OrderID',updateOrderItem);
router.delete('/deleteOrderItem/:OrderID',deleteOrderItem);

// Store management
router.post('/createOrUpdateStore', StoreController.createOrUpdateStore);
router.get('/getAllStores', StoreController.getAllStores);
router.delete('/deleteStore/:id', StoreController.deleteStore);

// Roles and Permissions
router.post('/createOrUpdateRole', roleController.createOrUpdateRole);
router.get('/getAllRoles', roleController.getAllRoles);
router.get('/getRoleById/:id', roleController.getRoleById); 
router.delete('/deleteRole/:id',roleController.deleteRole);
router.post('/createPermission',PermissionController.createPermission);
router.get('/getAllPermissions',PermissionController.getAllPermissions);
router.get('/getAllPermissionsByRoleId/:roleId', PermissionController.getAllPermissionsByRoleId);
router.post('/createOrUpdateRolePermissions',PermissionController.createOrUpdateRolePermissions);

// OrderStatus
router.post('/CreateorupdateStatus',OrderStatusController.CreateorupdateStatus);
router.get('/getAllOrderStatus',OrderStatusController.getAllOrderStatus);
router.get('/getOrderStatusById/:StatusID',OrderStatusController.getOrderStatusById);
router.delete('/deleteOrderStatusById/:StatusID',OrderStatusController.deleteOrderStatusById);

//orderhistory
router.post('/createOrderHistory',createOrderHistory);
router.get('/getAllOrderHistories',getAllOrderHistories);
router.get('/getOrderHistoryById/:id',getOrderHistoryById);
router.put('/updateOrderHistory/:id',updateOrderHistory);
router.delete('/deleteOrderHistory/:id',deleteOrderHistory);


//ProducttType
router.post('/createProductType',ProductTypeController.createProductType);
router.get('/getAllProductTypes',ProductTypeController.getAllProductTypes);
router.get('/getProductTypeById/:id',ProductTypeController.getProductTypeById);
router.put('/updateProductType/:id',ProductTypeController.updateProductType);
router.delete('/deleteProductType/:id',ProductTypeController.deleteProductType);

//colour
router.post('/createColour',createColour);
router.get('/getAllColours',getAllColours);
router.get('/getColourById/:id',getColourById);
router.put('/updateColour/:id',updateColour);
router.delete('/deleteColour/:id',deleteColour);

//size
router.post('/createSize',createSize);
router.get('/getAllSizes',getAllSizes);
router.get('/getSizeById/:id',getSizeById);
router.put('/updateSize/:id',updateSize);
router.delete('/deleteSize/:id',deleteSize);

//category
router.post('/categoryWithImages',CategoryController.createCategory);
router.get('/getAllCategories',CategoryController.getAllCategories);
router.get('/getCategoryById/:id',CategoryController.getCategoryById);
router.put('/updateCategory/:id',CategoryController.updateCategory);
router.delete('/deleteCategory/:id',CategoryController.deleteCategory);

//brnad
router.post('/createBrand',createBrand);
router.get('/getAllBrands',getAllBrands);
router.get('/getBrandById/:id',getBrandById);
router.put('/updateBrand/:id',updateBrand);
router.delete('/deleteBrand/:id',deleteBrand);

// Routes for MapStoreUser
router.post('/mapstoreuser', createOrUpdateMapStoreUser);
router.get('/getallmapstoreuser', getAllMapStoreUsers);
router.get('/mapstoreuser/:id', getMapStoreUserById);
router.get('/mapstoreuserbyUserID/:id', getMapStoreUserByUserId);
router.delete('/deleteMapStoreUser/:MapStoreUserID', deleteMapStoreUser);

// Routes accessible by Customers
// // router.use(verifyToken);

router.use(isCustomer);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyForgotPasswordOTP', verifyForgotPasswordOTP);
router.post('/resetPassword', resetPassword);
router.post('/generateOTP',initiateRegistration);
router.post('/verifyOtpOtp',verifyOTP);
router.post('/completeRegistration',completeRegistration);
router.get('/getAddressesByCustomerId/:customerId', AddressController.getAddressesByCustomerId);
router.get('/getOrdersByCustomerId/:customerId', getOrdersByCustomerId);

//Routes for Address
router.post('/createOrUpdateAddress',AddressController.createOrUpdateAddress);
router.get('/getAllAddresses', AddressController.getAllAddresses);
router.get('/getAddressById/:id', AddressController.getAddressById); 
router.delete('/deleteAddress/:id', AddressController.deleteAddress); 
router.get('/getAddressDetailsById/:id',AddressController.getAddressDetailsById);
router.get('/getAddressesByCustomerId/:customerId',AddressController.getAddressesByCustomerId);

//Routes for StatesbyCountry and Getcitiesbystate
router.get('/getCitiesByState',CityController.getCitiesByState);
router.get('/getStatesByCountry',StateController.getStatesByCountry);
router.get('/getCountries',StateController.getCountries);

module.exports = router;

