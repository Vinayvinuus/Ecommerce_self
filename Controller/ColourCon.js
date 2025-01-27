const {ColourModel,sequelize}= require('../DbConnection/connect');


// Create Colour
const createColour = async (req, res) => {
    const { TenantID, Name, HexCode, RgbCode, CreatedBy,UpdatedBy } = req.body;
     // Check required fields
     if (!TenantID || !HexCode) {
        return res.status(400).json({
            status: "FAILURE",
            message: "TenantID and HexCode are required fields"
        });
    }
    try {
         
        const colour = await ColourModel.create({
            TenantID, Name, HexCode, RgbCode, CreatedBy,UpdatedBy
        });
        res.status(201).json({
            status: "SUCCESS",
            message: "Colour created successfully",
            data: colour
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while creating colour",
            error: error.message
        });
    }
};

// Get All Colours
const getAllColours = async (req, res) => {
    try {
        const aColours = await ColourModel.findAll();
        res.status(200).json({
            status: "SUCCESS",
            data: aColours
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching colours",
            error: error.message
        });
    }
};

// Get Colour by ID
const getColourById = async (req, res) => {
    try {
        const colour = await ColourModel.findByPk(req.params.id);
        if (colour) {
            res.status(200).json({
                status: "SUCCESS",
                data: colour
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Colour not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while fetching colour",
            error: error.message
        });
    }
};

// Update Colour
const updateColour = async (req, res) => {
    try {
        const [updated] = await ColourModel.update(req.body, {
            where: { ColourID: req.params.id },
            returning: true
        });
        if (updated) {
            const updatedColour = await ColourModel.findByPk(req.params.id);
            res.status(200).json({
                status: "SUCCESS",
                message: "Colour updated successfully",
                data: updatedColour
            });
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Colour not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while updating colour",
            error: error.message
        });
    }
};

// Delete Colour
const deleteColour = async (req, res) => {
    try {
        const deleted = await ColourModel.destroy({
            where: { ColourID: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({
                status: "FAILURE",
                message: "Colour not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while deleting colour",
            error: error.message
        });
    }
};

module.exports = {createColour,getAllColours,getColourById,updateColour,deleteColour};