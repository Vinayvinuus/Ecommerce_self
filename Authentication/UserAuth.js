//Token
const jwt = require('jsonwebtoken');
const supabase = require('../middleWare/supabase');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const moment = require('moment'); // Import moment

//Importing Models
const {UserManagementModel,RoleModel,PermissionsModel,MapRolePermissionsModel,MapStoreUser,
    CityModel,StateModel,CountryModel,StoreModel} = require('../DbConnection/connect')

//const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Multer configuration
const upload = multer({ storage: multer.memoryStorage() }).any();

// Supabase file upload function
const uploadFileToSupabase = async (file) => {
    try {
        const sanitizedFileName = file.originalname
            .replace(/[^\w\.-]/g, '_')
            .replace(/\.+/g, '.') // Replace multiple dots with a single dot
            .replace(/\.[^.]*$/, ''); // Remove the original extension

        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;

        const { data, error } = await supabase
            .storage
            .from('UserProfile')
            .upload(`Images/${fileNameWithTimestamp}`, file.buffer, {
                contentType: file.mimetype
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new Error('Error uploading file to Supabase: ' + error.message);
        }

        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/UserProfile/Images/${fileNameWithTimestamp}`;
        const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;

        return { publicUrl, downloadUrl, originalFileName: file.originalname };
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
};

const createOrUpdateUser = async (req, res) => {
    upload(req, res, async function (err) {
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

            const {
                UserID,
                TenantID,
                FirstName,
                LastName,
                Email,
                Password,
                PhoneNumber,
                Gender,
                RoleID,
                AddressLine,
                CityID,
                StateID,
                CountryID,
                Pincode
            } = data;

            // Validate required fields
            if (!TenantID || !FirstName || !Email || !CityID || !StateID || !CountryID) {
                return res.status(400).json({
                    StatusCode: 'ERROR',
                    message: 'Required fields are missing'
                });
            }

            // Handle profile image upload to Supabase
            let profileImageData = null;
            if (req.files && req.files.length > 0) {
                try {
                    const profileImage = req.files.find(file => file.fieldname === 'ProfileImage');
                    if (profileImage) {
                        profileImageData = await uploadFileToSupabase(profileImage);
                    }
                } catch (uploadError) {
                    return res.status(500).json({
                        StatusCode: 'ERROR',
                        message: 'Error uploading profile image',
                        details: uploadError.message
                    });
                }
            }

            if (UserID && UserID !== 0) {
                // Update User
                const user = await UserManagementModel.findByPk(UserID);

                if (!user) {
                    return res.status(404).json({
                        StatusCode: 'ERROR',
                        message: 'User not found'
                    });
                }

                // Check for duplicate email
                const existingUser = await UserManagementModel.findOne({
                    where: {
                        Email,
                        UserID: { [Op.ne]: UserID }
                    }
                });

                if (existingUser) {
                    return res.status(400).json({
                        StatusCode: 'ERROR',
                        message: 'A user with this email already exists'
                    });
                }

                // Update user details
                await user.update({
                    TenantID,
                    FirstName,
                    LastName,
                    Email,
                    Password,
                    PhoneNumber,
                    Gender,
                    RoleID,
                    AddressLine,
                    CityID,
                    StateID,
                    CountryID,
                    ProfileImageUrl: profileImageData ? profileImageData.publicUrl : user.ProfileImageUrl,
                    Pincode
                });

                return res.status(200).json({
                    StatusCode: 'SUCCESS',
                    message: 'User updated successfully',
                    UserID: user.UserID,
                    profileUrl: profileImageData?.publicUrl || user.ProfileImageUrl
                });

            } else {
                // Create User
                const existingUser = await UserManagementModel.findOne({
                    where: { Email }
                });

                if (existingUser) {
                    return res.status(400).json({
                        StatusCode: 'ERROR',
                        message: 'A user with this email already exists'
                    });
                }

                const EmployeeID = `EMP-${Date.now()}`;
                const user = await UserManagementModel.create({
                    TenantID,
                    FirstName,
                    LastName,
                    Email,
                    Password,
                    PhoneNumber,
                    Gender,
                    RoleID,
                    ProfileImageUrl: profileImageData ? profileImageData.publicUrl : null,
                    AddressLine,
                    CityID,
                    StateID,
                    CountryID,
                    Pincode,
                    EmployeeID
                });

                return res.status(201).json({
                    StatusCode: 'SUCCESS',
                    message: 'User created successfully',
                    UserID: user.UserID,
                    profileUrl: profileImageData?.publicUrl || null
                });
            }
        } catch (error) {
            console.error('Error creating or updating user:', error);
            return res.status(500).json({
                StatusCode: 'ERROR',
                message: 'Internal Server Error',
                details: error.message
            });
        }
    });
};
//Authentication
const loginUser = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if the user exists
        const user = await UserManagementModel.findOne({ where: { Email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate password
        const isValidPassword = (Password === user.Password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

         // Retrieve all stores mapped to the user
         const mappedStores = await MapStoreUser.findAll({
            where: { UserID: user.UserID },
            attributes: ['StoreID']  // Get only StoreID
        });

        const storeIDs = mappedStores.map(store => store.StoreID);  // Extract the StoreIDs

        // Fetch permissions based on RoleID
        const rolePermissions = await MapRolePermissionsModel.findAll({
            where: { RoleID: user.RoleID },
            attributes: ['PermissionID']
        });

        const permissionIDs = rolePermissions.map(rp => rp.PermissionID);
        console.log(permissionIDs)
        // Fetch permission names from Permissions table
        const permissions = await PermissionsModel.findAll({
            where: { ID: permissionIDs },
            attributes: ['Name',]
        });
        // console.log(permissions)
        const permissionNames = permissions.map(permission => permission.Name);  // Extract permission names
      
        // Generate a JWT token with UserID, RoleID, mapped StoreIDs, and permissions
        const token = jwt.sign(
            { 
                UserID: user.UserID, 
                RoleID: user.RoleID, 
                TenantID: user.TenantID,
                StoreIDs: storeIDs,
                PermissionID:permissionIDs,
                Permissions: permissionNames  // Add permission names to the token
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        console.log('User Tenant', user.TenantID);
        console.log('Token generated', token);

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, search, sortBy = 'FirstName', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
  
    try {
      const whereConditions = {};
      if (search) {
        whereConditions[Op.or] = [
          { FirstName: { [Op.iLike]: `%${search}%` } },
          { LastName: { [Op.iLike]: `%${search}%` } },
          { Email: { [Op.iLike]: `%${search}%` } }
        ];
      }
  
      const { count, rows } = await UserManagementModel.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'UserID',
          'EmployeeID',
          'FirstName',
          'LastName',
          'Email',
          'PhoneNumber',
          'Gender',
          'RoleID',
          'ProfileImageUrl',
          'AddressLine',
          'Pincode'
        ],
        include: [
          {
            model: CityModel,
            as: 'City',
            attributes: ['CityName']
          },
          {
            model: StateModel,
            as: 'State',
            attributes: ['StateName']
          },
          {
            model: CountryModel,
            as: 'Country',
            attributes: ['CountryName']
          },
          { 
            model: StoreModel, 
            as: 'Store', 
            attributes: ['StoreID', 'StoreName'] 
          },
          { 
            model: RoleModel, 
            as: 'UserRole', 
            attributes: ['RoleID', 'RoleName'] 
          }
        ]
      });
  
      const formattedUsers = rows.map(user => ({
        UserID: user.UserID,
        UserEmployeeID :user.EmployeeID,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        PhoneNumber: user.PhoneNumber,
        Gender: user.Gender,
        RoleID: user.RoleID,
        RoleName: user.UserRole?.RoleName || null,
        StoreID: user.Store?.StoreID || null,
        StoreName: user.Store?.StoreName || null,
        ProfileImageUrl: user.ProfileImageUrl,
        AddressLine: user.AddressLine,
        CityName: user.City?.CityName || null,
        StateName: user.State?.StateName || null,
        CountryName: user.Country?.CountryName || null,
        Pincode: user.Pincode
      }));
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        users: formattedUsers
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return res.status(500).json({
        StatusCode: 'ERROR',
        message: 'Internal Server Error',
        details: error.message
      });
    }
  };
  
// Get user by ID
// const getUserById = async (req, res) => {
//     const { id } = req.params;
  
//     try {
//       const user = await UserManagementModel.findByPk(id, {
//         attributes: [
//           'UserID',
//           'TenantID',
//           'EmployeeID',
//           'FirstName',
//           'LastName',
//           'Email',
//           'PhoneNumber',
//           'Gender',
//           'RoleID',
//           'ProfileImageUrl',
//           'AddressLine',
//           'Pincode'
//         ],
//         include: [
//           {
//             model: CityModel,
//             as: 'City',
//             attributes: ['CityName']
//           },
//           {
//             model: StateModel,
//             as: 'State',
//             attributes: ['StateName']
//           },
//           {
//             model: CountryModel,
//             as: 'Country',
//             attributes: ['CountryName']
//           }
//         ],
//         include:[{
//             model:StoreModel,
//             as: 'Store',
//             attributes:['StoreID','StoreName']
//       }],
//       include:[{
//         model:RoleModel,
//         as:'UserRole',
//         attributes:['RoleID','RoleName']
//       }]
//       });
  
//       if (!user) {
//         return res.status(404).json({
//           StatusCode: 'ERROR',
//           message: 'User not found'
//         });
//       }
  
//       const formattedUser = {
//         UserID: user.UserID,
//         TenantID: user.TenantID,
//         UserEmployeeID :user.EmployeeID,
//         FirstName: user.FirstName,
//         LastName: user.LastName,
//         Email: user.Email,
//         PhoneNumber: user.PhoneNumber,
//         Gender: user.Gender,
//         RoleID: user.RoleID,
//         ProfileImageUrl: user.ProfileImageUrl,
//         AddressLine: user.AddressLine,
//         CityName: user.City?.CityName || null,
//         StateName: user.State?.StateName || null,
//         CountryName: user.Country?.CountryName || null,
//         Pincode: user.Pincode
//       };
  
//       return res.status(200).json({
//         StatusCode: 'SUCCESS',
//         user: formattedUser
//       });
//     } catch (error) {
//       console.error('Error getting user by ID:', error);
//       return res.status(500).json({
//         StatusCode: 'ERROR',
//         message: 'Internal Server Error',
//         details: error.message
//       });
//     }
//   };

const getUserById = async (req, res) => { 
    const { id } = req.params; 
   
    try { 
      const user = await UserManagementModel.findByPk(id, { 
        attributes: [ 
          'UserID', 
          'TenantID', 
          'EmployeeID', 
          'FirstName', 
          'LastName', 
          'Email', 
          'PhoneNumber', 
          'Gender', 
          'RoleID', 
          'ProfileImageUrl', 
          'AddressLine', 
          'Pincode' 
        ], 
        include: [ 
          { 
            model: CityModel, 
            as: 'City', 
            attributes: ['CityName'] 
          }, 
          { 
            model: StateModel, 
            as: 'State', 
            attributes: ['StateName'] 
          }, 
          { 
            model: CountryModel, 
            as: 'Country', 
            attributes: ['CountryName'] 
          },
          { 
            model: StoreModel, 
            as: 'Store', 
            attributes: ['StoreID', 'StoreName'] 
          },
          { 
            model: RoleModel, 
            as: 'UserRole', 
            attributes: ['RoleID', 'RoleName'] 
          }
        ]
      }); 
   
      if (!user) { 
        return res.status(404).json({ 
          StatusCode: 'ERROR', 
          message: 'User not found' 
        }); 
      } 
   
      const formattedUser = { 
        UserID: user.UserID, 
        TenantID: user.TenantID, 
        UserEmployeeID: user.EmployeeID, 
        FirstName: user.FirstName, 
        LastName: user.LastName, 
        Email: user.Email, 
        PhoneNumber: user.PhoneNumber, 
        Gender: user.Gender, 
        RoleID: user.RoleID, 
        RoleName: user.UserRole?.RoleName || null,
        ProfileImageUrl: user.ProfileImageUrl, 
        AddressLine: user.AddressLine, 
        CityName: user.City?.CityName || null, 
        StateName: user.State?.StateName || null, 
        CountryName: user.Country?.CountryName || null, 
        Pincode: user.Pincode,
        StoreID: user.Store?.StoreID || null,
        StoreName: user.Store?.StoreName || null
        
      }; 
   
      return res.status(200).json({ 
        StatusCode: 'SUCCESS', 
        user: formattedUser 
      }); 
    } catch (error) { 
      console.error('Error getting user by ID:', error); 
      return res.status(500).json({ 
        StatusCode: 'ERROR', 
        message: 'Internal Server Error', 
        details: error.message 
      }); 
    } 
  };

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // First check if user exists
        const user = await UserManagementModel.findByPk(id);

        if (!user) {
            return res.status(404).json({
                StatusCode: 'ERROR',
                message: 'User not found'
            });
        }

        // Delete profile image from Supabase if exists
        if (user.ProfileImageUrl) {
            try {
                const fileName = user.ProfileImageUrl.split('/').pop();
                await supabase
                    .storage
                    .from('UserProfile')
                    .remove([`Images/${fileName}`]);
            } catch (error) {
                console.error('Error deleting profile image:', error);
                // Continue with user deletion even if image deletion fails
            }
        }

        // Delete user
        await user.destroy();

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error',
            details: error.message
        });
    }
};

const updateUserPassword = async (req, res) => {
    const { UserID, OldPassword, NewPassword, ConfirmPassword } = req.body;
  
    // Check if new and confirm passwords match
    if (NewPassword !== ConfirmPassword) {
        return res.status(400).json({ message: "New Password and Confirm Password do not match." });
    }
  
    try {
        // Find the user by ID
        const user = await UserManagementModel.findByPk(UserID);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
  
        // Compare old password
        if (OldPassword !== user.Password) {
            return res.status(400).json({ message: "Old Password is incorrect." });
        }
  
        // Update the password
        user.Password = NewPassword;
        await user.save();
  
        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal server error." });
    }
  };
  
 const forgotUserPassword = async (req, res) => {
      const { Email } = req.body;
  
      try {
          const user = await UserManagementModel.findOne({ where: { Email } });
          if (!user) {
              return res.status(404).json({ message: "Email not registered." });
          }
  
          const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
          otpStorage.set(Email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // Valid for 5 minutes
  
          await sendTemplateEmailForUser('ForgotPassword', {
            assignedUserEmail: Email,
              otp
          });
  
          res.status(200).json({ message: "OTP sent to your email." });
      } catch (error) {
          console.error("Error during forgot password:", error);
          res.status(500).json({ message: "Internal server error." });
      }
  };
  
  const validateUserOtp = async (req, res) => {
    const { Email, OTP } = req.body;
  
    try {
        // Check if the OTP exists and is valid
        const otpData = otpStorage.get(Email);
        if (!otpData || otpData.otp !== OTP || otpData.expiresAt < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }
  
        res.status(200).json({ message: "OTP is valid." });
    } catch (error) {
        console.error("Error validating OTP:", error);
        res.status(500).json({ message: "Internal server error." });
    }
  };
  
  
 const validateOtpAndUpdateUserPassword = async (req, res) => {
    const { Email, NewPassword, ConfirmPassword} = req.body;
  
    // const otpData = otpStorage.get(Email);
    // if (!otpData || otpData.otp !== OTP || otpData.expiresAt < Date.now()) {
    //     return res.status(400).json({ message: "Invalid or expired OTP." });
    // }
  
    if (NewPassword !== ConfirmPassword) {
      return res.status(400).json({ message: "New Password and Confirm Password do not match." });
   }
  
    try {
        // const hashedPassword = await (NewPassword, 10);
        const user = await UserManagementModel.findOne({ where: { Email } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
  
        user.Password = NewPassword;
        await user.save();
  
        otpStorage.delete(Email); // Remove OTP after successful update
  
        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error validating OTP and updating password:", error);
        res.status(500).json({ message: "Internal server error." });
    }
  };

module.exports = {createOrUpdateUser,loginUser,getAllUsers, getUserById, deleteUser,
    forgotUserPassword, validateUserOtp ,validateOtpAndUpdateUserPassword, updateUserPassword
}
