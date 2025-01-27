const { UserManagementModel,ProductModelss, ImagesModel, BrandModel,ColourModel,SizeModel,ProductVariantModel, 
    feedBackModel,CustomerModel,CategoryModel,sequelize,ProductTypeModel } = require('../DbConnection/connect');

    const { Sequelize } = require('sequelize');
// Create ProductType
exports.createProductType = async (req, res) => {
    const { ProductTypeName, Status } = req.body;

    if (!ProductTypeName) {
        return res.status(400).json({
            status: "FAILURE",
            message: "ProductTypeName is a required field"
        });
    }

    try {
        // Check if ProductTypeName already exists
        const existingProductType = await ProductTypeModel.findOne({
            where: { ProductTypeName }
        });

        if (existingProductType) {
            return res.status(400).json({
                status: "FAILURE",
                message: "ProductTypeName already exists"
            });
        }

        // Create new ProductType
        const productType = await ProductTypeModel.create({
            ProductTypeName,
            Status,
        });

        res.status(201).json({
            status: "SUCCESS",
            message: "ProductType created successfully",
            data: productType
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating ProductType",
            error: error.message
        });
    }
};


// Get All ProductTypes
exports.getAllProductTypes = async (req, res) => {
    try {
        const productTypes = await ProductTypeModel.findAll();

        res.status(200).json({
            status: "SUCCESS",
            data: productTypes
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching ProductTypes",
            error: error.message
        });
    }
};

// Get ProductType by ID
exports.getProductTypeById = async (req, res) => {
    try {
        const productType = await ProductTypeModel.findByPk(req.params.id);

        if (productType) {
            res.status(200).json({
                status: "SUCCESS",
                data: productType
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "ProductType not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching ProductType",
            error: error.message
        });
    }
};

// Update ProductType
exports.updateProductType = async (req, res) => {
    const { ProductTypeName, Status } = req.body;

    if (!ProductTypeName) {
        return res.status(400).json({
            status: "FAILURE",
            message: "ProductTypeName is a required field"
        });
    }

    try {
        const { id } = req.params;

        // Check if ProductType with the given ID exists
        const existingProductType = await ProductTypeModel.findByPk(id);

        if (!existingProductType) {
            return res.status(404).json({
                status: "FAILURE",
                message: "ProductType not found"
            });
        }

        // Check if a different ProductType with the same name already exists
        const duplicateProductType = await ProductTypeModel.findOne({
            where: { 
                ProductTypeName,
                ProductTypeID: { [Sequelize.Op.ne]: id } // Ensure it’s not the same record
            }
        });

        if (duplicateProductType) {
            return res.status(400).json({
                status: "FAILURE",
                message: "ProductTypeName already exists"
            });
        }

        // Update ProductType
        await existingProductType.update({ ProductTypeName, Status });

        res.status(200).json({
            status: "SUCCESS",
            message: "ProductType updated successfully",
            data: existingProductType
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating ProductType",
            error: error.message
        });
    }
};


// Delete ProductType
exports.deleteProductType = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await ProductTypeModel.destroy({
            where: { ProductTypeID: id }
        });

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "ProductType not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting ProductType",
            error: error.message
        });
    }
};

