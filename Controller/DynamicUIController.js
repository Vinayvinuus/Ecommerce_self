const express = require('express');
const router = express.Router();
const { DynamicUIComponentModel } = require('../DbConnection/connect');
// const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware

// POST API for admin to create/update dynamic UI components
const createdynamicui  = async (req, res) => {
    try {
        const { componentName, componentCode } = req.body;

        if (!componentName || !componentCode) {
            return res.status(400).json({
                success: false,
                message: 'Component name and code are required'
            });
        }

        // Check if component already exists
        let component = await DynamicUIComponentModel.findOne({
            where: { 
                ComponentName: componentName,
                IsActive: true
            }
        });

        if (component) {
            // Update existing component with new version
            await component.update({
                ComponentCode: componentCode,
                Version: component.Version + 1,
                UpdatedAt: new Date(),
                CreatedBy: 1
            });
        } else {
            // Create new component
            component = await DynamicUIComponentModel.create({
                ComponentName: componentName,
                ComponentCode: componentCode,
                CreatedBy: 1
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Component saved successfully',
            data: {
                componentId: component.ComponentID,
                version: component.Version
            }
        });
    } catch (error) {
        console.error('Error in dynamic UI creation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// PUT API for admin to update existing dynamic UI component
const updatedynamicui = async (req, res) => {
    try {
        const { componentId, componentCode } = req.body;

        if (!componentId || !componentCode) {
            return res.status(400).json({
                success: false,
                message: 'Component ID and code are required'
            });
        }

        // Check if the component exists
        let component = await DynamicUIComponentModel.findOne({
            where: {
                ComponentID: componentId,
                IsActive: true
            }
        });

        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        // Update the component with the new code and version increment
        await component.update({
            ComponentCode: componentCode,
            Version: component.Version + 1, // Increment version
            UpdatedAt: new Date(),
            UpdatedBy: 1 // Assuming the user performing the update is identified as '1'
        });

        return res.status(200).json({
            success: true,
            message: 'Component updated successfully',
            data: {
                componentId: component.ComponentID,
                version: component.Version
            }
        });

    } catch (error) {
        console.error('Error updating dynamic UI component:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// GET API to fetch dynamic UI components
const getdynamicui = async (req, res) => {
    try {
        const { componentName } = req.params;
        
        const component = await DynamicUIComponentModel.findOne({
            where: {
                ComponentName: componentName,
                IsActive: true
            },
            attributes: ['ComponentID', 'ComponentName', 'ComponentCode', 'Version', 'CreatedAt']
        });

        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: component
        });
    } catch (error) {
        console.error('Error fetching dynamic UI:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

//Getall API to fetch dynamicui
const getAllDynamicUI = async (req, res) => {
    try {
        const components = await DynamicUIComponentModel.findAll({
            where: { IsActive: true }, // Fetch only active components
            attributes: ['ComponentID', 'ComponentName', ]
            //attributes: ['ComponentID', 'ComponentName', 'ComponentCode', 'Version', 'CreatedAt']
        });

        if (!components || components.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No components found'
            });
        }

        return res.status(200).json({
            success: true,
            data: components
        });
    } catch (error) {
        console.error('Error fetching all dynamic UI components:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createdynamicui,
    getdynamicui, 
    updatedynamicui,
    getAllDynamicUI 
};