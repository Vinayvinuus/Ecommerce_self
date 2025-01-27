const express = require('express');
const admin = require("firebase-admin");
const { DeviceTokenModel, NotificationHistoryModel,SilentNotificationModel,DynamicUIComponentModel } = require('../DbConnection/connect');
const path = require('path');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs').promises;

// Register device token
const Registerdevice = async (req, res) => {
    try {
        const { fcmToken, deviceId, deviceName } = req.body;

        // Validate required fields
        if (!fcmToken || !deviceId || !deviceName) {
            return res.status(400).json({ 
                message: "FCM Token, Device ID, and Device Name are required" 
            });
        }

        // Create or update device token
        const [device, created] = await DeviceTokenModel.findOrCreate({
            where: { DeviceID: deviceId },
            defaults: {
                FCMToken: fcmToken,
                DeviceName: deviceName,
                IsActive: true
            }
        });

        if (!created) {
            await device.update({
                FCMToken: fcmToken,
                DeviceName: deviceName,
                IsActive: true
            });
        }

        res.status(200).json({ 
            message: "Device registered successfully",
            deviceId: device.DeviceTokenID 
        });

    } catch (err) {
        res.status(500).json({ 
            message: "Error registering device", 
            error: err.message 
        });
    }
};

const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR;
const PUBLIC_URL_BASE = process.env.PUBLIC_URL_BASE;

// Configure storage for banner images
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const fullPath = path.join(UPLOAD_BASE_DIR, 'documents/Notificationimages');
        console.log('Saving Notification image to directory:', fullPath);
        await fs.mkdir(fullPath, { recursive: true });
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const finalFileName = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;
        console.log('Generated filename:', finalFileName);
        cb(null, finalFileName);
    }
});

const NotificationimagesUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for Notification images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
            return;
        }
        cb(null, true);
    }
}).fields([
    { name: 'Notificationimage', maxCount: 1 }
]);

// Function to get public URL for Notification image
const getNotificationImageUrl = (filename) => {
    return `${PUBLIC_URL_BASE}/documents/Notificationimages/${filename}`;
};
// Send notification
const sendnotifications = async (req, res) => {
    NotificationimagesUpload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    StatusCode: 'ERROR',
                    message: 'File upload error',
                    details: err.message
                });
            } else if (err) {
                return res.status(500).json({
                    StatusCode: 'ERROR',
                    message: 'Server error during file upload',
                    details: err.message
                });
            }

    try {
        const data = req.body.data ? JSON.parse(req.body.data) : req.body;
        const { title, body } =  data;

        // Validate required fields
        if (!title || !body) {
            return res.status(400).json({ 
                message: "Title and body are required" 
            });
        }
         // Handle Notification image upload
        let NotificationimageImageUrl = null;
        if (req.files && req.files['Notificationimage']) {
        const notificationimage = req.files['Notificationimage'][0];
        NotificationimageImageUrl = getNotificationImageUrl(notificationimage.filename);
        }
        // Get all active devices
        const activeDevices = await DeviceTokenModel.findAll({
            where: { IsActive: true }
        });

        if (activeDevices.length === 0) {
            return res.status(404).json({ 
                message: "No active devices found" 
            });
        }

      
        // Send notifications to all active devices
        const notificationPromises = activeDevices.map(async (device) => {
            try {
                await admin.messaging().send({
                    token: device.FCMToken,
                    notification: {
                        title: title,
                        body: body,
                        imageUrl: NotificationimageImageUrl,
                    },
                    android: {
                        notification: {
                            imageUrl: NotificationimageImageUrl
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default"
                            }
                        }
                    }
                });
                console.log('Sending to token:', device.FCMToken);

                // Log successful notification
                await NotificationHistoryModel.create({
                    Title: title,
                    Body: body,
                    ImageUrl: NotificationimageImageUrl,
                    Status: 'SENT',
                    DeviceTokenID: device.DeviceTokenID
                });

              
                return { success: true, deviceId: device.DeviceID };
                
            } catch (error) {
                console.error('Error sending message:', error);

                // Log failed notification
                await NotificationHistoryModel.create({
                    Title: title,
                    Body: body,
                    ImageUrl: NotificationimageImageUrl,
                    Status: 'FAILED',
                    DeviceTokenID: device.DeviceTokenID
                });

                return { success: false, deviceId: device.DeviceID, error: error.message };
            }
        });

        const results = await Promise.all(notificationPromises);
        
        res.status(200).json({
            message: "Notification process completed",
            results: results
        });

    } catch (err) {
        res.status(500).json({ 
            message: "Error sending notifications", 
            error: err.message 
        });
    }})
};


// const sendSilentNotifications = async (req, res) => {
//     try {
//         const { componentName, dataPayload } = req.body;   
        
//          // Validate input
//          if (!componentName) {
//             return res.status(400).json({ message: "componentName is required" });
//         }
//         // Check if the componentName exists in the database
//         const notification = await DynamicUIComponentModel.findOne({ where: { ComponentName: componentName } });
//         if (!notification) {
//             return res.status(404).json({
//                 message: `Notification with componentName "${componentName}" not found in the database`
//             });
//         }
//         // Get all active devices
//         const activeDevices = await DeviceTokenModel.findAll({
//             where: { IsActive: true }
//         });

//         if (activeDevices.length === 0) {
//             return res.status(404).json({
//                 message: "No active devices found"
//             });
//         }

//         // Send notifications to all active devices
//         const notificationPromises = activeDevices.map(async (device) => {
//             try {
//                 const message = {
//                     token: device.FCMToken,
//                     data: dataPayload || {}, // Custom data payload
//                     android: {
//                         priority: "high"
//                     },
//                     apns: {
//                         payload: {
//                             aps: {
//                                 'content-available': 1,
//                                 sound: "default"
//                             }
//                         }
//                     }
//                 };

//                 await admin.messaging().send(message);
//                 console.log('Sending to token:', device.FCMToken);

//                 // Log successful notification
//                 await SilentNotificationModel.create({
//                     ComponentName: componentName,
//                     //Body: body,
//                     Status: 'SENT',
//                    // DeviceTokenID: device.DeviceTokenID,
//                     Payload: JSON.stringify(dataPayload)
//                 });

//                 return {
//                     success: true,
//                     deviceId: device.DeviceID
//                 };

//             } catch (error) {
//                 console.error('Error sending message:', error);

//                 // Log failed notification
//                 await SilentNotificationModel.create({
//                     ComponentName: componentName,
//                     //Body: body,
//                     Status: 'FAILED',
//                     //DeviceTokenID: device.DeviceTokenID,
//                     Payload: JSON.stringify(dataPayload),
//                     ErrorMessage: error.message
//                 });

//                 return {
//                     success: false,
//                     deviceId: device.DeviceID,
//                     error: error.message
//                 };
//             }
//         });

//         const results = await Promise.all(notificationPromises);

//         res.status(200).json({
//             message: "SilentNotification process completed",
//             results: results
//         });

//     } catch (error) {
//         console.error('Error in sendSilentNotifications:', error);
//         res.status(500).json({
//             message: "Error sending notifications",
//             error: error.message
//         });
//     }
// };

// const sendSilentNotifications = async (req, res) => {
//     try {
//         const { componentName, dataPayload } = req.body;

//         // Validate input
//         if (!componentName) {
//             return res.status(400).json({ message: "componentName is required" });
//         }

//         // Check if the componentName exists in the database
//         const notification = await DynamicUIComponentModel.findOne({
//             where: { ComponentName: componentName }
//         });
//         if (!notification) {
//             return res.status(404).json({
//                 message: `Notification with componentName "${componentName}" not found in the database`
//             });
//         }

//         // Get all active devices
//         const activeDevices = await DeviceTokenModel.findAll({
//             where: { IsActive: true }
//         });

//         if (activeDevices.length === 0) {
//             return res.status(404).json({
//                 message: "No active devices found"
//             });
//         }

//         // Convert dataPayload values to strings (Firebase requires string values)
//         const stringifiedPayload = {};
//         for (const key in dataPayload) {
//             stringifiedPayload[key] = String(dataPayload[key]);
//         }

//         // Send notifications to all active devices
//         const notificationPromises = activeDevices.map(async (device) => {
//             try {
//                 const message = {
//                     token: device.FCMToken,
//                     data: stringifiedPayload, // Custom data payload with string values
//                     android: {
//                         priority: "high"
//                     },
//                     apns: {
//                         payload: {
//                             aps: {
//                                 'content-available': 1,
//                                 sound: "default"
//                             }
//                         }
//                     }
//                 };

//                 await admin.messaging().send(message);
//                 console.log('Notification sent to token:', device.FCMToken);

//                 // Log successful notification
//                 await SilentNotificationModel.create({
//                     componentName: componentName,
//                     JsonPayload: JSON.stringify(dataPayload), // Save original JSON payload
//                     Status: 'SENT'
//                 });

//                 return {
//                     success: true,
//                     deviceId: device.DeviceID
//                 };
//             } catch (error) {
//                 console.error('Error sending message:', error);

//                 // Log failed notification
//                 await SilentNotificationModel.create({
//                     componentName: componentName,
//                     JsonPayload: JSON.stringify(dataPayload), // Save original JSON payload
//                     Status: 'FAILED',
//                     ErrorMessage: error.message
//                 });

//                 return {
//                     success: false,
//                     deviceId: device.DeviceID,
//                     error: error.message
//                 };
//             }
//         });

//         const results = await Promise.all(notificationPromises);

//         res.status(200).json({
//             message: "SilentNotification process completed",
//             results: results
//         });

//     } catch (error) {
//         console.error('Error in sendSilentNotifications:', error);
//         res.status(500).json({
//             message: "Error sending notifications",
//             error: error.message
//         });
//     }
// };
/*version2*/
const sendSilentNotifications = async (req, res) => {
    try {
        const { componentName, dataPayload } = req.body;

        // Validate input
        if (!componentName || !dataPayload || !dataPayload.component) {
            return res.status(400).json({ 
                message: "componentName and dataPayload.component are required" 
            });
        }

        // Check if the componentName exists in the database
        const notification = await DynamicUIComponentModel.findOne({
            where: { ComponentName: componentName }
        });
        
        if (!notification) {
            return res.status(404).json({
                message: `Notification with componentName "${componentName}" not found in the database`
            });
        }

        // Get all active devices
        const activeDevices = await DeviceTokenModel.findAll({
            where: { IsActive: true }
        });

        if (activeDevices.length === 0) {
            return res.status(404).json({
                message: "No active devices found"
            });
        }

        // Send notifications to all active devices
        const notificationPromises = activeDevices.map(async (device) => {
            try {
                const message = {
                    token: device.FCMToken,
                    data: {
                        //componentName: componentName,
                        dynamicUi: String(dataPayload.dynamicUi || false),
                        component: dataPayload.component,
                       
                    },
                    android: {
                        priority: "high"
                    },
                    apns: {
                        payload: {
                            aps: {
                                'content-available': 1,
                                sound: "default"
                            }
                        }
                    }
                };
                    
                await admin.messaging().send(message);
                console.log('Notification sent to token:', device.FCMToken);

                // Log successful notification with new schema
                await SilentNotificationModel.create({
                    componentName: componentName,
                    dynamicUi: dataPayload.dynamicUi || false,
                    component: dataPayload.component,
                    Status: 'SENT'
                });

                return {
                    success: true,
                    deviceId: device.DeviceID
                };
            } catch (error) {
                console.error('Error sending message:', error);

                // Log failed notification with new schema
                await SilentNotificationModel.create({
                    componentName: componentName,
                    dynamicUi: dataPayload.dynamicUi || false,
                    component: dataPayload.component,
                    Status: 'FAILED',
                    ErrorMessage: error.message
                });

                return {
                    success: false,
                    deviceId: device.DeviceID,
                    error: error.message
                };
            }
        });

        const results = await Promise.all(notificationPromises);

        res.status(200).json({
            message: "SilentNotification process completed",
            results: results
        });

    } catch (error) {
        console.error('Error in sendSilentNotifications:', error);
        res.status(500).json({
            message: "Error sending notifications",
            error: error.message
        });
    }
}; 






module.exports = {
    Registerdevice,
    sendnotifications,
    sendSilentNotifications
};

// KI0smE4kboER52hC