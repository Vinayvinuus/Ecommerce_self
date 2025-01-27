const { RoleModel  ,StoreModel} = require('../DbConnection/connect'); 
const {Sequelize}=require('sequelize')



// Create a new Role
exports.createOrUpdateRole = async (req, res) => {
    const { RoleID, TenantID,StoreID, RoleName, Status, CreatedBy, UpdatedBy } = req.body; 

    try {
        
        if (RoleID && RoleID != 0) {
          
            const role = await RoleModel.findByPk(RoleID); 

            if (!role) {
                return res.status(200).json({
                    StatusCode: 'NOT_FOUND',
                    message: 'Role not found'
                });
            }

            // Update the role with the new values
            await role.update({
                TenantID,
                RoleName,
                Status,
                StoreID,
                UpdatedBy,
                UpdatedAt: new Date()
            });

            
            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Role updated successfully',
                RoleID:role.RoleID
            });
        } else {
            // If RoleID is not provided or is 0, create a new role
            const newRole = await RoleModel.create({
                TenantID,
                RoleName,
                Status,
                StoreID,
                CreatedBy,
                UpdatedBy,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            });

            // Return success response for create
            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Role created successfully',
                RoleID: newRole.RoleID // Return the new RoleID in the response
            });
        }
    } catch (error) {
        // Handle any errors that occur
        console.error('Error creating or updating role:', error);
        res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error'
        });
    }
};



// Get Role details by ID
exports.getRoleById = async (req, res) => {
    const { id } = req.params;

    try {
        const role = await RoleModel.findByPk(id ,{
                include: [
                  { 
                    model: StoreModel, as: 'Store', attributes: ['StoreID', 'StoreName'] 
                  }
                ],
                attributes: ['RoleID', 'RoleName', 'Status'],
              });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const formattedOrder = {
            RoleID: role.RoleID,
            RoleName: role.RoleName,
            Status:role.Status,
            StoreID: role.Store?.StoreID || null,
            StoreName: role.Store?.StoreName || null,
            
         
          };
      

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            role:formattedOrder
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getAllRoles = async (req, res) => {
    const { page = 1, limit = 10, StoreIDs, SearchText = '' } = req.query;

    try {
        const pageNumber = Math.max(parseInt(page, 10), 1);
        const pageSize = Math.max(parseInt(limit, 10), 1);

        // Build dynamic query
        const queryConditions = {
            [Sequelize.Op.and]: []
        };

        if (SearchText) {
            queryConditions[Sequelize.Op.and].push({
                [Sequelize.Op.or]: [
                    { RoleName: { [Sequelize.Op.iLike]: `%${SearchText}%` } },
                    Sequelize.where(Sequelize.cast(Sequelize.col('Status'), 'text'), { [Sequelize.Op.iLike]: `%${SearchText}%` }),
                    Sequelize.where(Sequelize.col('"Store"."StoreName"'), { [Sequelize.Op.iLike]: `%${SearchText}%` })
                ]
            });
        }

        if (StoreIDs) {
            const storeIdsArray = Array.isArray(StoreIDs) ? StoreIDs : StoreIDs.split(',');
            queryConditions[Sequelize.Op.and].push({ StoreID: { [Sequelize.Op.in]: storeIdsArray } });
        }

        const totalItems = await RoleModel.count({
            where: queryConditions,
            include: [{ model: StoreModel, as: 'Store', attributes: ['StoreID', 'StoreName'] }]
        });

        const roles = await RoleModel.findAll({
            where: queryConditions,
            include: [{ model: StoreModel, as: 'Store', attributes: ['StoreID', 'StoreName'] }],
            limit: pageSize,
            offset: (pageNumber - 1) * pageSize,
            // order: [
            //     [Sequelize.fn('GREATEST', Sequelize.col('"CreatedAt"'), Sequelize.col('"UpdatedAt"')), 'DESC'],
            //     ['RoleName', 'ASC']
            // ],
            attributes: ['RoleID', 'RoleName', 'Status']
        });

        const formattedRoles = roles.map(role => ({
            RoleID: role.RoleID,
            RoleName: role.RoleName,
            Status: role.Status,
            StoreID: role.Store?.StoreID || null,
            StoreName: role.Store?.StoreName || null,
            
        }));

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            page: pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            roles: formattedRoles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({ 
            StatusCode: 'ERROR', 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};


exports.deleteRole = async (req, res) => {
    const { id } = req.params;
  
    try {
      const role = await RoleModel.findByPk(id);
  
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
  
      await role.destroy();
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
