const {OrdersModel,sequelize,OrderItemsModel,OrderHistoryModel,ProductModelss,ProductVariantModel,
    ImagesModel,CategoryModel, BrandModel,PaymentModel,CustomerModel,AddressModel,CityModel,StateModel,CountryModel,
    ColourModel,SizeModel,OrderItemStatusHistoryModel,OrderStatusModel} = require('../DbConnection/connect');
const { Op } = require('sequelize');
const {Sequelize}=require('sequelize')


/*const createOrderWithDetails = async (req, res) => {
    const { TenantID, CustomerID, AddressID, OrderItems, OrderStatus = "PENDING"} = req.body;

    // Input validation
    if (!TenantID || !CustomerID || !AddressID || !OrderItems || OrderItems.length === 0) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID, CustomerID, AddressID, and OrderItems are required",
        });
    }

    console.log("Received request body:", req.body); // Debugging log

    const transaction = await sequelize.transaction();

    try {
        // Calculate totals with error handling
        const TotalQuantity = OrderItems.reduce((sum, item) => {
            if (!item.Quantity || item.Quantity <= 0) throw new Error('Invalid item quantity');
            return sum + item.Quantity;
        }, 0);

        const TotalAmount = OrderItems.reduce((sum, item) => {
            if (!item.Price || item.Price < 0) throw new Error('Invalid item price');
            return sum + (item.Quantity * item.Price);
        }, 0);

        // Fetch customer details with error handling
        const customer = await CustomerModel.findByPk(CustomerID, {
            attributes: ['CustomerID', 'FirstName', 'LastName']
        });

        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({
                status: "FAILURE",
                message: "Customer not found",
            });
        }

        const OrderBy = `${customer.FirstName || ''} ${customer.LastName || ''}`.trim();

        // Create Order with comprehensive data
        const order = await OrdersModel.create({
            TenantID,
            CustomerID,
            AddressID,
            TotalQuantity,
            TotalAmount,
            OrderStatus,
            OrderBy,
            CreatedBy: String(customer.CustomerID)
        }, { transaction });

        console.log("Order created successfully:", order.OrderID);

        // Set DeliveryDate as 4 days from CreatedAt
        const deliveryDate = new Date(order.CreatedAt.getTime() + 4 * 24 * 60 * 60 * 1000);
        await order.update({ DeliveryDate: deliveryDate }, { transaction });

        // Add OrderItems
        const orderItemsData = OrderItems.map((item) => ({
            OrderID: order.OrderID,
            TenantID,
            CustomerID,
            ProductID: item.ProductID,
            ProductVariantID: item.ProductVariantID || null,
            Quantity: item.Quantity,
            Price: item.Price
        }));
        const createdOrderItems = await OrderItemsModel.bulkCreate(orderItemsData, { transaction });

        console.log("OrderItems created successfully");

        // Add each OrderItem to OrderHistory
        for (let i = 0; i < OrderItems.length; i++) {
            const item = OrderItems[i];
            const createdItem = createdOrderItems[i]; // Get corresponding created order item
            console.log("Adding to OrderHistory:", item);

            await OrderHistoryModel.create({
                OrderID: order.OrderID,
                TenantID,
                ProductID: item.ProductID,
                OrderItemID: createdItem.OrderItemID, // Use the generated OrderItemID
                CustomerID,
                OrderStatus,
                CreatedBy: String(customer.CustomerID)
            }, { transaction });
        }

        await transaction.commit();

        // Respond with success
        res.status(201).json({
            status: "SUCCESS",
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        // Rollback transaction in case of error
        await transaction.rollback();
        console.error('Order creation error:', error);
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating order",
            error: error.message
        });
    }
}; */

//orderitemhistory
const createOrderWithDetails = async (req, res) => {
    const { TenantID, CustomerID, AddressID, OrderItems } = req.body;

    if (!TenantID || !CustomerID || !AddressID || !OrderItems || OrderItems.length === 0) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID, CustomerID, AddressID, and OrderItems are required",
        });
    }

    const transaction = await sequelize.transaction();

    try {
        // Validate order items and variants
        for (const item of OrderItems) {
            if (!item.ProductID) {
                throw new Error("ProductID is required for all order items");
            }

            if (item.ProductVariantID) {
                const variant = await ProductVariantModel.findOne({
                    where: {
                        VariantID: item.ProductVariantID,
                        ProductID: item.ProductID,
                    },
                });

                if (!variant) {
                    throw new Error(`Invalid ProductVariantID ${item.ProductVariantID} for ProductID ${item.ProductID}`);
                }
            }
        }

        // Calculate totals
        const TotalQuantity = OrderItems.reduce((sum, item) => {
            if (!item.Quantity || item.Quantity <= 0) throw new Error("Invalid item quantity");
            return sum + item.Quantity;
        }, 0);

        const TotalAmount = OrderItems.reduce((sum, item) => {
            if (!item.Price || item.Price < 0) throw new Error("Invalid item price");
            return sum + item.Quantity * item.Price;
        }, 0);

        // Get customer details
        const customer = await CustomerModel.findByPk(CustomerID, {
            attributes: ["CustomerID", "FirstName", "LastName"],
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        // Get initial status (Pending)
        const initialStatus = await OrderStatusModel.findOne({
            where: {
                TenantID,
                OrderStatus: "Pending",
            },
        });

        if (!initialStatus) {
            throw new Error("Order status configuration not found");
        }

        // Create main order
        const order = await OrdersModel.create(
            {
                TenantID,
                CustomerID,
                AddressID,
                TotalQuantity,
                TotalAmount,
                OrderStatus: "Pending",
                OrderBy: `${customer.FirstName || ""} ${customer.LastName || ""}`.trim(),
                CreatedBy: String(customer.CustomerID),
                PaymentStatus: "PENDING",
            },
            { transaction }
        );

        // Process order items
        for (const item of OrderItems) {
            const deliveryDate = calculateEstimatedDeliveryDate(item); //wer are Calculate estimated delivery date

            // Create order item
            const orderItem = await OrderItemsModel.create(
                {
                    OrderID: order.OrderID,
                    TenantID,
                    CustomerID,
                    ProductID: item.ProductID,
                    ProductVariantID: item.ProductVariantID || null,
                    Quantity: item.Quantity,
                    Price: item.Price,
                    DeliveryDate: deliveryDate, 
                    ItemStatus: "Pending",
                },
                { transaction }
            );

            // Create OrderItemStatusHistory entry
            await OrderItemStatusHistoryModel.create(
                {
                    OrderItemId: orderItem.OrderItemID,
                    StatusId: initialStatus.StatusID,
                    OrderStatus: "Pending",
                    ChangedOn: new Date(),
                    Remarks: `Initial status: Pending. Estimated delivery on ${deliveryDate.toLocaleDateString()}`,
                },
                { transaction }
            );

            // Create OrderHistory entry
            await OrderHistoryModel.create(
                {
                    OrderID: order.OrderID,
                    OrderItemID: orderItem.OrderItemID,
                    TenantID,
                    ProductID: item.ProductID,
                    CustomerID,
                    OrderStatus: "Pending",
                    StatusID: initialStatus.StatusID,
                    DeliveryDate: deliveryDate, // Saved  delivery date in history
                    CreatedBy: String(customer.CustomerID),
                    Comments: `Order placed with estimated delivery on ${deliveryDate.toLocaleDateString()}`,
                },
                { transaction }
            );
        }

        await transaction.commit();

        // Fetch complete order details
        // const completeOrder = await OrdersModel.findOne({
        //     where: { OrderID: order.OrderID },
        //     include: [
        //         {
        //             model: OrderItemsModel,
        //             as: "OrderItems",
        //             include: [
        //                 {
        //                     model: ProductModelss,
        //                     as: "Product",
        //                     attributes: ["ProductID", "ProductName"],
        //                 },
        //                 {
        //                     model: ProductVariantModel,
        //                     as: "ProductVariants",
        //                     attributes: ["VariantID"],
        //                 },
        //                 {
        //                     model: OrderItemStatusHistoryModel,
        //                     as: "OrderItemStatusHistory",
        //                     include: [
        //                         {
        //                             model: OrderStatusModel,
        //                             as: "OrderItemStatus",
        //                             attributes: ["OrderStatus", "HexColorCode"],
        //                         },
        //                     ],
        //                 },
        //             ],
        //         },
        //         {
        //             model: CustomerModel,
        //             as: "Customer",
        //             attributes: ["CustomerID", "FirstName", "LastName", "Email"],
        //         },
        //         {
        //             model: AddressModel,
        //             as: "Address",
        //         },
        //         {
        //             model: OrderHistoryModel,
        //             as: "OrderHistory",
        //             include: [
        //                 {
        //                     model: OrderStatusModel,
        //                     as: "OrdersStatus",
        //                     attributes: ["OrderStatus", "HexColorCode"],
        //                 },
        //             ],
        //         },
        //     ],
        // });

        res.status(201).json({
            status: "SUCCESS",
            message: "Order created successfully",
           // data: completeOrder,
        });
    } catch (error) {
        if (transaction.finished !== "commit") {
            await transaction.rollback();
        }

        console.error("Order creation error:", error);

        res.status(error.message.includes("not found") ? 404 : 500).json({
            status: "FAILURE",
            message: error.message || "Error occurred while creating order",
        });
    }
};

const updateOrderItemStatus = async (req, res) => {
    const { OrderItemID, StatusID, remarks } = req.body;
    const { OrderID } = req.params;

    const transaction = await sequelize.transaction();

    try {
        // Find the order item
        const orderItem = await OrderItemsModel.findOne({
            where: { OrderItemID, OrderID }
        });

        if (!orderItem) {
            await transaction.rollback();
            return res.status(404).json({
                status: "FAILURE",
                message: "Order item not found"
            });
        }

        // Find the order status
        const statusRecord = await OrderStatusModel.findByPk(StatusID);
        if (!statusRecord) {
            await transaction.rollback();
            return res.status(400).json({
                status: "FAILURE",
                message: "Invalid StatusID"
            });
        }

        const { OrderStatus } = statusRecord;

        // Update the order item status
        await orderItem.update({
            ItemStatus: OrderStatus
        }, { transaction });

        // Update the OrderItemStatusHistory record
        const statusHistoryRecord = await OrderItemStatusHistoryModel.findOne({
            where: { OrderItemId: OrderItemID } //StatusId: StatusID
        });

        if (statusHistoryRecord) {
            await statusHistoryRecord.update({
                ChangedOn: new Date(),
                Remarks: remarks || `Status updated to ${OrderStatus}`,
                OrderStatus,
                StatusId : StatusID
            }, { transaction });
        } else {
            return res.status(404).json({
                status: "FAILURE",
                message: "OrderItemStatusHistory record not found"
            });
        }

        // Update the OrderHistory record
        const orderHistoryRecord = await OrderHistoryModel.findOne({
            where: { OrderID, OrderItemID }
        });

        if (orderHistoryRecord) {
            await orderHistoryRecord.update({
                OrderStatus,
                StatusID,
                //Comments: remarks || `Status updated to ${OrderStatus}`
            }, { transaction });
        } else {
            return res.status(404).json({
                status: "FAILURE",
                message: "OrderHistory record not found"
            });
        }

        // Check if all order items have the same status
        // const allOrderItems = await OrderItemsModel.findAll({
        //     where: { OrderID }
        // });
        // const allSameStatus = allOrderItems.every(item => item.ItemStatus === OrderStatus);

        // if (allSameStatus) {
        //     const order = await OrdersModel.findByPk(OrderID);
        //     await order.update({
        //         OrderStatus
        //     }, { transaction });
        // }

        await transaction.commit();
        res.json({
            status: "SUCCESS",
            message: "Order item status updated successfully"
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating order item status:", error);
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating status",
            error: error.message
        });
    }
};


// Helper function to calculate estimated delivery date
const calculateEstimatedDeliveryDate = (orderItem) => {
   
    const minDays = 3;
    const maxDays = 7;
    const deliveryDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    return new Date(Date.now() + (deliveryDays * 24 * 60 * 60 * 1000));
};

const getAllOrders = async (req, res) => {
    try {
        const { 
            pageNumber = 1, 
            pageSize = 10,
            searchText = '' 
        } = req.query;

        let queryConditions = {};

        // Add search condition if searchText is provided
        if (searchText) {
            queryConditions = {
                [Op.or]: [
                    { OrderID: { [Op.iLike]: `%${searchText}%` } },
                ]
            };
        }

        // Build the base query options
        let options = {
            where: queryConditions,
            include: [
                {
                    model: CustomerModel,
                    as: 'Customer',
                    attributes: ['CustomerID', 'FirstName', 'LastName', 'Email'],
                    include: [
                        {
                            model: AddressModel,
                            as: 'Addresses',  
                            attributes: ['AddressID', 'AddressLine1', 'AddressLine2', 'Zipcode'],
                            include: [
                                { model: CityModel, as: 'City', attributes: ['CityName'] },
                                { model: StateModel, as: 'State', attributes: ['StateName'] },
                                { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                            ]
                        }
                    ]
                },
                {
                    model: OrderItemsModel,
                    as: 'OrderItems',
                    include: [{
                        model: ProductModelss,
                        as: 'Product',
                        attributes: ['ProductID', 'ProductName', 'ProductDescription'],
                        include: [
                            {
                                model: ImagesModel,
                                as: 'ProductImages',
                                attributes: ['ImageUrl']
                            },
                            {
                                model: BrandModel,
                                as: 'Brand',
                                attributes: ['BrandID', 'BrandName']
                            },
                            {
                                model: CategoryModel,
                                as: 'Category',
                                attributes: ['CategoryID', 'CategoryName']
                            }
                        ]
                    }]
                },
                {
                    model: OrderHistoryModel,
                    as: 'OrderHistory',
                    attributes: ['OrderHistoryID', 'OrderStatus', 'CreatedAt']
                },
                {
                    model: PaymentModel,
                    as: 'Payments',
                    attributes: ['PaymentMethod', 'PaymentStatus', 'MaskedCardNumber', 'PaymentDate', 'PaymentID']
                }
            ],
            order: [['CreatedAt', 'DESC']],
            distinct: true
        };

        // Get total count for pagination
        const totalCount = await OrdersModel.count({
            where: queryConditions,
            include: options.include
        });

        // Apply pagination
        if (pageNumber && pageSize) {
            const offset = (parseInt(pageNumber) - 1) * parseInt(pageSize);
            options.limit = parseInt(pageSize);
            options.offset = offset;
        }

        // Fetch paginated orders
        const orders = await OrdersModel.findAll(options);

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                status: "SUCCESS",
                message: "No orders found",
                data: [],
                totalRecords: 0,
                totalPages: 0,
                currentPage: parseInt(pageNumber)
            });
        }

        // Process image URLs helper function
        const processImageUrls = (imageUrl) => {
            if (!imageUrl) return [];
            return imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
        };

        // Format the orders with customer details
        const formattedOrders = orders.map(order => ({
            orderId: order.OrderID,
            orderNumber: order.OrderNumber,
            orderDate: order.CreatedAt,
            status: order.Status,
            totalAmount: order.TotalAmount,
            createdAt: order.CreatedAt,
            updatedAt: order.UpdatedAt,
            customer: {
                customerId: order.Customer?.CustomerID,
                firstName: order.Customer?.FirstName,
                lastName: order.Customer?.LastName,
                email: order.Customer?.Email,
                addresses: order.Customer?.Addresses?.map(address => ({ 
                    addressId: address?.AddressID,
                    addressLine1: address?.AddressLine1,
                    addressLine2: address?.AddressLine2,
                    zipcode: address?.Zipcode,
                    cityName: address?.City?.CityName || 'N/A',
                    stateName: address?.State?.StateName || 'N/A',
                    countryName: address?.Country?.CountryName || 'N/A',
                })) || []
            },
            orderItems: order.OrderItems.map(item => ({
                orderItemId: item.OrderItemID,
                quantity: item.Quantity,
                price: item.Price,
                product: {
                    productId: item.Product?.ProductID,
                    productName: item.Product?.ProductName,
                    productDescription: item.Product?.ProductDescription,
                    brandId: item.Product?.Brand?.BrandID || 'N/A',
                    brandName: item.Product?.Brand?.BrandName || 'N/A',
                    categoryId: item.Product?.Category?.CategoryID || 'N/A',
                    categoryName: item.Product?.Category?.CategoryName || 'N/A',
                    images: item.Product?.ProductImages?.reduce((urls, img) => {
                        const processedUrls = processImageUrls(img.ImageUrl);
                        return [...urls, ...processedUrls];
                    }, []) || []
                }
            })),
            orderHistory: order.OrderHistory.map(history => ({
                historyId: history.OrderHistoryID,
                status: history.OrderStatus,
                createdAt: history.CreatedAt
            })),
            Payments: order.Payments.map(payments => ({
                PaymentID: payments.PaymentID,
                PaymentMethod: payments.PaymentMethod,
                PaymentStatus: payments.PaymentStatus,
                MaskedCardNumber: payments.MaskedCardNumber,
                PaymentDate: payments.PaymentDate,
            }))
        }));

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / parseInt(pageSize));

        res.status(200).json({
            status: "SUCCESS",
            message: "Orders retrieved successfully",
            data: formattedOrders,
            totalRecords: totalCount,
            totalPages: totalPages,
            currentPage: parseInt(pageNumber),
            pageSize: parseInt(pageSize)
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching orders",
            error: error.message
        });
    }
};

// Get All Orders with Filters for CustomerID and OrderDate Range
const getAllOrdersFilters = async (req, res) => {
    const { CustomerID, startDate, endDate } = req.query;

    // Build filter conditions based on query parameters
    const filters = {};
    
    if (CustomerID) {
        filters.CustomerID = CustomerID;
    }
    
    if (startDate && endDate) {
        filters.OrderDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
        filters.OrderDate = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
        filters.OrderDate = { [Op.lte]: new Date(endDate) };
    }

    try {
        const orders = await OrdersModel.findAll({
            where: filters,
            include: [
                { model: OrderItemsModel, as: 'OrderItems' },
                { model: OrderHistoryModel, as: 'OrderHistory' }
            ]
        });
        res.status(200).json({
            status: "SUCCESS",
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching orders with filters",
            error: error.message
        });
    }
};


const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await OrdersModel.findByPk(id, {
            include: [
                {
                    model: OrderItemsModel,
                    as: 'OrderItems',
                    include: [{
                        model: ProductModelss,
                        as: 'Product',
                        attributes: ['ProductID', 'ProductName', 'ProductDescription'],
                        include: [
                            {
                                model: ImagesModel,
                                as: 'ProductImages',
                                attributes: ['ImageUrl']
                            },
                            {
                                model: BrandModel,
                                as: 'Brand',
                                attributes: ['BrandID', 'BrandName']
                            },
                            {
                                model: CategoryModel,
                                as: 'Category',
                                attributes: ['CategoryID', 'CategoryName']
                            }
                        ]
                    }]
                },
                {
                    model: OrderHistoryModel,
                    as: 'OrderHistory',
                    attributes: ['OrderHistoryID', 'OrderItemID', 'StatusID', 'OrderStatus', 'DeliveryDate'] // Include OrderItemID here
                },
                {
                    model: CustomerModel,
                    as: 'Customer',
                    attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber']
                },
                {
                    model: AddressModel,
                    as: 'Address',
                    include: [
                        { model: CityModel, as: 'City', attributes: ['CityName'] },
                        { model: StateModel, as: 'State', attributes: ['StateName'] },
                        { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                    ]
                },
            ]
        });

        if (!order) {
            return res.status(404).json({
                status: "FAILURE",
                message: "Order not found"
            });
        }

        const processImageUrls = (imageUrl) => {
            if (!imageUrl) return [];
            return imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
        };

        const formattedOrderItems = order.OrderItems.map(item => {
            // Match the order history by OrderItemID
            const orderHistoryForItem = order.OrderHistory.find(history => history.OrderItemID === item.OrderItemID) || {};

            return {
                orderItemId: item.OrderItemID,
                quantity: item.Quantity,
                price: item.Price,
                product: {
                    productId: item.Product?.ProductID,
                    productName: item.Product?.ProductName,
                    productDescription: item.Product?.ProductDescription,
                    brandId: item.Product?.Brand?.BrandID || 'N/A',
                    brandName: item.Product?.Brand?.BrandName || 'N/A',
                    categoryId: item.Product?.Category?.CategoryID || 'N/A',
                    categoryName: item.Product?.Category?.CategoryName || 'N/A',
                    images: item.Product?.ProductImages?.reduce((urls, img) => {
                        const processedUrls = processImageUrls(img.ImageUrl);
                        return [...urls, ...processedUrls];
                    }, []) || [],
                    orderHistory: {
                        orderHistoryId: orderHistoryForItem.OrderHistoryID || null,
                        statusId: orderHistoryForItem.StatusID || null,
                        status: orderHistoryForItem.OrderStatus || null,
                        deliveryDate: orderHistoryForItem.DeliveryDate || null
                    }
                }
            };
        });

        const customerDetails = {
            id: order.Customer.CustomerID,
            name: `${order.Customer.FirstName} ${order.Customer.LastName}`,
            email: order.Customer.Email,
            phoneNumber: order.Customer.PhoneNumber
        };

        const addressDetails = {
            addressLine1: order.Address?.AddressLine1 || null,
            addressLine2: order.Address?.AddressLine2 || null,
            city: order.Address?.City?.CityName || null,
            state: order.Address?.State?.StateName || null,
            country: order.Address?.Country?.CountryName || null
        };

        const formattedOrder = {
            orderId: order.OrderID,
            orderDate: order.CreatedAt,
            totalAmount: order.TotalAmount,
            customerDetails,
            address: addressDetails,
            orderItems: formattedOrderItems
        };

        res.status(200).json({
            status: "SUCCESS",
            data: formattedOrder
        });

    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving order",
            error: error.message
        });
    }
};



const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { OrderStatus, Items, UpdatedBy } = req.body;
    
    const transaction = await sequelize.transaction();
    try {
        const [updated] = await OrdersModel.update(req.body, { where: { OrderID: id }, transaction });
        
        if (updated) {
            // Update Order Items if provided
            if (Items) {
                await OrderItemsModel.destroy({ where: { OrderID: id }, transaction });
                const orderItems = Items.map(item => ({
                    OrderID: id,
                    TenantID: req.body.TenantID,
                    CustomerID: req.body.CustomerID,
                    ProductVariantID: item.ProductVariantID,
                    Quantity: item.Quantity,
                    Price: item.Price
                }));
                await OrderItemsModel.bulkCreate(orderItems, { transaction });
            }

            // Add new Order History entry for status change
            if (OrderStatus) {
                await OrderHistoryModel.create({
                    OrderID: id,
                    TenantID: req.body.TenantID,
                    UserID: req.user.id,  // Assumed user ID from session
                    OrderStatus,
                    CreatedBy: UpdatedBy || 'System',
                    CreatedAt: new Date()
                }, { transaction });
            }

            await transaction.commit();
            res.status(200).json({
                status: "SUCCESS",
                message: "Order updated successfully"
            });
        } else {
            await transaction.rollback();
            res.status(404).json({
                status: "FAILURE",
                message: "Order not found"
            });
        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating order",
            error: error.message
        });
    }
};

// Delete Order, Items, and Order History
const deleteOrder = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();
    try {
        // Delete Order Items and History first to maintain referential integrity
        await OrderItemsModel.destroy({ where: { OrderID: id }, transaction });
        await OrderHistoryModel.destroy({ where: { OrderID: id }, transaction });

        const deleted = await OrdersModel.destroy({ where: { OrderID: id }, transaction });
        
        if (deleted) {
            await transaction.commit();
            res.status(200).json({
                status: "SUCCESS",
                message: "Order deleted successfully"
            });
        } else {
            await transaction.rollback();
            res.status(404).json({
                status: "FAILURE",
                message: "Order not found"
            });
        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting order",
            error: error.message
        });
    }
};

const getOrdersByCustomerId = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { pageNumber = 1, pageSize = 10, startDate, endDate } = req.query;

        // Input validation
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({
                status: "FAILURE",
                message: 'Invalid customer ID provided'
            });
        }

        // Build the query options
        let options = {
            where: {
                CustomerID: customerId,
            },
            include: [
                {
                    model: OrderItemsModel,
                    as: 'OrderItems',
                    include: [{
                        model: ProductModelss,
                        as: 'Product',
                        attributes: ['ProductID', 'ProductName', 'ProductDescription'],
                        include: [
                            {
                                model: ImagesModel,
                                as: 'ProductImages',
                                attributes: ['ImageUrl']
                            },
                            {
                                model: BrandModel,
                                as: 'Brand',
                                attributes: ['BrandID', 'BrandName']
                            },
                            {
                                model: CategoryModel,
                                as: 'Category',
                                attributes: ['CategoryID', 'CategoryName']
                            }
                        ]
                    }]
                },
                {
                    model: OrderHistoryModel,
                    as: 'OrderHistory',
                    attributes: ['OrderHistoryID', 'OrderItemID', 'StatusID', 'OrderStatus', 'DeliveryDate']
                },
                {
                    model: CustomerModel,
                    as: 'Customer',
                    attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber']
                },
                {
                    model: AddressModel,
                    as: 'Address',
                    include: [
                        { model: CityModel, as: 'City', attributes: ['CityName'] },
                        { model: StateModel, as: 'State', attributes: ['StateName'] },
                        { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                    ]
                }
            ],
            order: [['CreatedAt', 'DESC']],
            distinct: true
        };

        // Apply date filter if provided
        if (startDate || endDate) {
            options.where.CreatedAt = {};
            if (startDate) {
                options.where.CreatedAt[Sequelize.Op.gte] = new Date(startDate);
            }
            if (endDate) {
                options.where.CreatedAt[Sequelize.Op.lte] = new Date(endDate);
            }
        }

        // Get total count for pagination
        const totalCount = await OrdersModel.count({
            where: options.where,
            include: options.include
        });

        // Apply pagination
        if (pageNumber && pageSize) {
            const offset = (parseInt(pageNumber) - 1) * parseInt(pageSize);
            options.limit = parseInt(pageSize);
            options.offset = offset;
        }

        // Fetch orders with all related data
        const orders = await OrdersModel.findAll(options);

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                status: "SUCCESS",
                message: "No orders found for this customer",
                data: [],
                totalRecords: 0,
                totalPages: 0,
                currentPage: parseInt(pageNumber)
            });
        }

        // Helper function to process image URLs
        const processImageUrls = (imageUrl) => {
            if (!imageUrl) return [];
            return imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
        };

        // Format the orders with comprehensive details
        const formattedOrders = orders.map(order => {
            const formattedOrderItems = order.OrderItems.map(item => {
                // Match the order history by OrderItemID
                const orderHistoryForItem = order.OrderHistory.find(history => history.OrderItemID === item.OrderItemID) || {};

                return {
                    orderItemId: item.OrderItemID,
                    quantity: item.Quantity,
                    price: item.Price,
                    product: {
                        productId: item.Product?.ProductID,
                        productName: item.Product?.ProductName,
                        productDescription: item.Product?.ProductDescription,
                        brandId: item.Product?.Brand?.BrandID || 'N/A',
                        brandName: item.Product?.Brand?.BrandName || 'N/A',
                        categoryId: item.Product?.Category?.CategoryID || 'N/A',
                        categoryName: item.Product?.Category?.CategoryName || 'N/A',
                        images: item.Product?.ProductImages?.reduce((urls, img) => {
                            const processedUrls = processImageUrls(img.ImageUrl);
                            return [...urls, ...processedUrls];
                        }, []) || [],
                        orderHistory: {
                            orderHistoryId: orderHistoryForItem.OrderHistoryID || null,
                            statusId: orderHistoryForItem.StatusID || null,
                            status: orderHistoryForItem.OrderStatus || null,
                            deliveryDate: orderHistoryForItem.DeliveryDate || null
                        }
                    }
                };
            });

            const customerDetails = {
                id: order.Customer.CustomerID,
                name: `${order.Customer.FirstName} ${order.Customer.LastName}`,
                email: order.Customer.Email,
                phoneNumber: order.Customer.PhoneNumber
            };

            const addressDetails = {
                addressLine1: order.Address?.AddressLine1 || null,
                addressLine2: order.Address?.AddressLine2 || null,
                city: order.Address?.City?.CityName || null,
                state: order.Address?.State?.StateName || null,
                country: order.Address?.Country?.CountryName || null
            };

            return {
                orderId: order.OrderID,
                orderDate: order.CreatedAt,
                totalAmount: order.TotalAmount,
                customerDetails,
                address: addressDetails,
                orderItems: formattedOrderItems
            };
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / parseInt(pageSize));

        return res.status(200).json({
            status: "SUCCESS",
            message: "Orders retrieved successfully",
            data: formattedOrders,
            totalRecords: totalCount,
            totalPages: totalPages,
            currentPage: parseInt(pageNumber),
            pageSize: parseInt(pageSize)
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching orders",
            error: error.message
        });
    }
};



module.exports = {createOrderWithDetails,getAllOrders,getOrderById,updateOrder,updateOrderItemStatus,
    deleteOrder,getAllOrdersFilters,getOrdersByCustomerId};