const {BrandModel,sequelize} = require('../DbConnection/connect');


const createBrand = async (req, res) => {
    const { TenantID, BrandName, CreatedBy, CategoryID, BrandCode, IsActive } = req.body;
    
    // Check required fields
    if (!TenantID || !CategoryID) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID and CategoryID are required fields"
        });
    }
    
    try {
        const brand = await BrandModel.create({
            TenantID,
            BrandName,
            CreatedBy,
            CategoryID,
            BrandCode,
            IsActive
        });
        res.status(201).json({
            status: "SUCCESS",
            message: "Brand created successfully",
            data: brand
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating brand",
            error: error.message
        });
    }
};


const getAllBrands = async (req, res) => {
    try {
        const aBrands = await BrandModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: aBrands
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching brands",
            error: error.message
        });
    }
};

const getBrandById = async (req, res) => {
    try {
        const brand = await BrandModel.findByPk(req.params.id);
        if (brand) {
            res.status(200).json({ statusCode: "SUCCESS", data: brand });
        } else {
            res.status(404).json({ status: "FAILURE", message: "Brand not found" });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving Brand",
            error: error.message
        });
    }
};

const updateBrand = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                status: "FAILURE",
                message: "Brand ID is required"
            });
        }

        const [updateCount] = await BrandModel.update(req.body, {
            where: { BrandID: id },
        });

        if (updateCount > 0) {
            const updatedBrand = await BrandModel.findByPk(id);
            if (updatedBrand) {
                res.status(200).json({
                    status: "SUCCESS",
                    message: "Brand updated successfully",
                    data: updatedBrand
                });
            } else {
                res.status(404).json({
                    status: "FAILURE",
                    message: "Brand not found after update"
                });
            }
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Brand not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating Brand",
            error: error.message
        });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const deleted = await BrandModel.destroy({
            where: { BrandID: req.params.id }
        });
        if (deleted) {
            res.status(200).json({
                statusCode: "SUCCESS",
                message: "Brand deleted successfully"
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Brand not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting Brand",
            error: error.message
        });
    }
};



module.exports = {createBrand,getAllBrands,getBrandById,updateBrand,deleteBrand};