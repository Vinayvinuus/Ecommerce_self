const {SizeModel,sequelize} = require('../DbConnection/connect');

const createSize = async (req, res) => {
    const { TenantID, SizeType, Label, NumericSize, CreatedBy, UpdatedBy } = req.body;
    if (!TenantID || !SizeType || !Label || !NumericSize) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID and SizeType are required fields"
        });
    }
    try {
        const size = await SizeModel.create({
            TenantID, SizeType, Label, NumericSize, CreatedBy, UpdatedBy
        });
        res.status(201).json({
            status: "SUCCESS",
            message: "Size created successfully",
            data: size
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating size",
            error: error.message
        });
    }
};

// Get All Sizes
const getAllSizes = async (req, res) => {
    try {
        const sizes = await SizeModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: sizes
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching sizes",
            error: error.message
        });
    }
};
// Get Size by ID
const getSizeById = async (req, res) => {
    try {
        const size = await SizeModel.findByPk(req.params.id);
        if (size) {
            res.status(200).json({
                status: "SUCCESS",
                data: size
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Size not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching size",
            error: error.message
        });
    }
};

// Update Size
const updateSize = async (req, res) => {
    try {
        const [updated] = await SizeModel.update(req.body, {
            where: { SizeID: req.params.id },
            returning: true
        });
        if (updated) {
            const updatedSize = await SizeModel.findByPk(req.params.id);
            res.status(200).json({
                status: "SUCCESS",
                message: "Size updated successfully",
                data: updatedSize
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Size not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating size",
            error: error.message
        });
    }
};

// Delete Size
const deleteSize = async (req, res) => {
    try {
        const deleted = await SizeModel.destroy({
            where: { SizeID: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Size not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting size",
            error: error.message
        });
    }
};

module.exports = {createSize,getAllSizes,getSizeById,updateSize,deleteSize};