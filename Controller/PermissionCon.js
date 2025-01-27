const { PermissionsModel,MapRolePermissionsModel,RoleModel} = require('../DbConnection/connect');



exports.createPermission = async (req, res) => {
    const { Module, Name, Code, TenantID, CreatedBy } = req.body;

    if (!Module || !Name || !Code || !TenantID || !CreatedBy) {
        return res.status(400).json({ StatusCode: 'ERROR', message: 'All fields are required.' });
    }

    try {
        const newPermission = await PermissionsModel.create({
            Module,
            Name,
            Code,
            TenantID,
            CreatedBy,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        res.status(201).json({ StatusCode: 'SUCCESS', message: 'Permission created successfully', PermissionID: newPermission.ID });
    } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({ StatusCode: 'ERROR', message: 'Internal Server Error' });
    }
};
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await PermissionsModel.findAll();
        res.status(200).json({ StatusCode: 'SUCCESS', Permissions: permissions });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ StatusCode: 'ERROR', message: 'Internal Server Error' });
    }
};
exports.getAllPermissionsByRoleId = async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);

    try {
        const allPermissions = await PermissionsModel.findAll({
            attributes: ['ID', 'Module', 'Name', 'Code'],
        });

        if (roleId === 0) {
            const result = allPermissions.map(permission => ({
                RolePermissionId: 0,
                PermissionId: permission.ID,
                PermissionModule: permission.Module,
                PermissionName: permission.Name,
                PermissionCode: permission.Code,
                IsChecked: false,
            }));
            return res.status(200).json(result);
        }

        const rolePermissions = await MapRolePermissionsModel.findAll({
            where: { RoleID: roleId },
            attributes: ['PermissionID', 'ID'],
        });

        const result = allPermissions.map(permission => {
            const mapped = rolePermissions.find(rp => rp.PermissionID === permission.ID);
            return {
                RolePermissionId: mapped ? mapped.ID : 0,
                PermissionId: permission.ID,
                PermissionModule: permission.Module,
                PermissionName: permission.Name,
                PermissionCode: permission.Code,
                IsChecked: !!mapped,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'An error occurred.', error });
    }
};
exports.createOrUpdateRolePermissions = async (req, res) => {
    const { roleId, roleName, permissions, TenantID } = req.body;

    try {
        let role;

        if (roleId === 0) {
            role = await RoleModel.create({ RoleName: roleName, Status: 'Active', TenantID: TenantID });
        } else {
            role = await RoleModel.findByPk(roleId);

            if (!role) {
                return res.status(404).json({ message: 'Role not found' });
            }

            role.RoleName = roleName;
            role.TenantID = TenantID;
            await role.save();
        }

        for (const permission of permissions) {
            const { permissionId, isChecked } = permission;

            if (isChecked) {
                const existingMapping = await MapRolePermissionsModel.findOne({
                    where: { RoleID: role.RoleID, PermissionID: permissionId },
                });

                if (!existingMapping) {
                    await MapRolePermissionsModel.create({ RoleID: role.RoleID, PermissionID: permissionId, TenantID: TenantID });
                }
            } else {
                await MapRolePermissionsModel.destroy({
                    where: { RoleID: role.RoleID, PermissionID: permissionId },
                });
            }
        }

        res.status(200).json({ message: 'Role and permissions updated successfully' });
    } catch (error) {
        console.error('Error creating or updating role permissions:', error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};


