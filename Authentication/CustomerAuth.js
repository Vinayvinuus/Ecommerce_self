const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sendEmail  = require("../middleWare/NodeMailer");

const JWT_SECRET = process.env.JWT_SECRET || 'b2y';

// Models
const { CustomerModel, AddressModel ,CityModel,StateModel,CountryModel} = require('../DbConnection/connect');

// Constants
const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 2;

// Utility function to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Step 1: Initial OTP Generation and Sending
const initiateRegistration = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        if (!phoneNumber) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Phone number is required'
            });
        }

        // Check if phone number already exists
        const existingCustomer = await CustomerModel.findOne({
            where: { PhoneNumber: phoneNumber }
        });

        // Generate OTP and set expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        if (existingCustomer) {
            // Update existing customer's OTP
            await existingCustomer.update({
                OTP: otp,
                OTPExpiry: otpExpiry,
                UpdatedAt: new Date()
            });
        } else {
            // Create new customer record with minimal info
            await CustomerModel.create({
                PhoneNumber: phoneNumber,
                TenantID: 1, 
                OTP: otp,
                OTPExpiry: otpExpiry,
                
            });
        }

        
        return res.status(200).json({
            status: 'SUCCESS',
            message: 'OTP sent successfully',
            data: { otp } 
        });

    } catch (error) {
        console.error('Error in initiateRegistration:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};
// Step 2: OTP Verification
const verifyOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        if (!phoneNumber || !otp) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Phone number and OTP are required'
            });
        }

        const customer = await CustomerModel.findOne({
            where: {
                PhoneNumber: phoneNumber,
                OTP: otp,
                OTPExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!customer) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Invalid OTP or OTP has expired'
            });
        }

        // Clear OTP after successful verification
        await customer.update({
            OTP: null,
            OTPExpiry: null,
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'OTP verified successfully',
            data: { customerId: customer.CustomerID }
        });

    } catch (error) {
        console.error('Error in verifyOTP:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};

// Step 3: Complete Registration
const completeRegistration = async (req, res) => {
    const {
        customerId,
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        gender,
        dateOfBirth,
        address
    } = req.body;

    try {
        // Validate required fields
        if (!customerId || !email || !password) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'email or password are Required'
            });
        }

        // Find the customer record created during OTP verification
        const customer = await CustomerModel.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        // Check if email is already in use
        const existingEmail = await CustomerModel.findOne({
            where: {
                Email: email,
                CustomerID: { [Op.ne]: customerId }
            }
        });
        if (existingEmail) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email already in use'
            });
        }

        // Check if phone number is already in use
        if (phoneNumber) {
            const existingPhone = await CustomerModel.findOne({
                where: {
                    PhoneNumber: phoneNumber,
                    CustomerID: { [Op.ne]: customerId }
                }
            });
            if (existingPhone) {
                return res.status(400).json({
                    status: 'FAILURE',
                    message: 'Phone number already in use'
                });
            }
        }

        // Create address if provided
        let addressId = customer.AddressID; // Retain existing address if no new address provided
        if (address) {
            const newAddress = await AddressModel.create({
                TenantID: customer.TenantID,
                AddressLine1: address.addressLine1,
                AddressLine2: address.addressLine2,
                CityID: address.cityId,
                StateID: address.stateId,
                CountryID: address.countryId,
                Zipcode: address.zipcode,
                CreatedBy: customer.CustomerID.toString(),
                CreatedAt: new Date()
            });
            addressId = newAddress.AddressID;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Update the customer record
        await customer.update({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Password: hashedPassword,
            PhoneNumber: phoneNumber,
            Gender: gender,
            DateOfBirth: dateOfBirth,
            AddressID: addressId,
            UpdatedBy: customer.CustomerID.toString(),
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Registration completed successfully',
            customerData: {
                CustomerID: customer.CustomerID,
                FirstName: customer.FirstName,
                LastName: customer.LastName,
                Email: customer.Email,
                PhoneNumber: customer.PhoneNumber,
                Gender: customer.Gender,
                DateOfBirth: customer.DateOfBirth,
                AddressID: customer.AddressID
            }
        });
    } catch (error) {
        console.error('Error in completeRegistration:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};

 /*const completeRegistration = async (req, res) => {
    const {
        customerId,
        firstName,
        lastName,
        email,
        password,
        address
    } = req.body;

    try {
        // Validate required fields
        if (!customerId || !email || !password) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Required fields are missing'
            });
        }

        // Find the customer record created during OTP verification
        const customer = await CustomerModel.findByPk(customerId);
        if (!customer) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        // Check if email is already in use
        const existingEmail = await CustomerModel.findOne({
            where: {
                Email: email,
                CustomerID: { [Op.ne]: customerId }
            }
        });

        if (existingEmail) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email already in use'
            });
        }

        // Create address if provided
        let addressId = null;
        if (address) {
            const newAddress = await AddressModel.create({
                TenantID: customer.TenantID,
                AddressLine1: address.addressLine1,
                AddressLine2: address.addressLine2,
                CityID: address.cityId,
                StateID: address.stateId,
                CountryID: address.countryId,
                Zipcode: address.zipcode,
                CreatedBy: customer.CustomerID.toString(),
                CreatedAt: new Date()
            });
            addressId = newAddress.AddressID;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Update customer record
        await customer.update({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Password: hashedPassword,
            AddressID: addressId,
            UpdatedBy: customer.CustomerID.toString(),
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Registration completed successfully',
            customerdata: customer,CustomerID
        });

    } catch (error) {
        console.error('Error in completeRegistration:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
}; */

/*--for login apis--*/
// // Customer Signup
// const customerSignup = async (req, res) => {
//     const {
//         TenantID,
//         FirstName,
//         LastName,
//         Email,
//         Password,
//         PhoneNumber,
//         Address, // Address details as an object
//         CreatedBy
//     } = req.body;

//     try {
//         // Check if the email already exists
//         const existingCustomer = await CustomerModel.findOne({ where: { Email } });
//         if (existingCustomer) {
//             return res.status(400).json({ status: 'FAILURE', message: 'Email already in use' });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);

//         // Create the address
//         const address = await AddressModel.create({
//             TenantID,
//             AddressLine1: Address.AddressLine1,
//             AddressLine2: Address.AddressLine2,
//             CityID: Address.CityID,
//             StateID: Address.StateID,
//             CountryID: Address.CountryID,
//             Zipcode: Address.Zipcode,
//             CreatedBy
//         });

//         // Create the customer with the new address ID
//         const newCustomer = await CustomerModel.create({
//             TenantID,
//             FirstName,
//             LastName,
//             Email,
//             Password: hashedPassword, // Store the hashed password
//             PhoneNumber,
//             AddressID: address.AddressID,
//             CreatedBy
//         });

//         res.status(201).json({
//             status: 'SUCCESS',
//             message: 'Customer registered successfully',
//             Data: newCustomer
//         });

//     } catch (error) {
//         console.error('Error during customer signup:', error);
//         res.status(500).json({ status: 'FAILURE', message: 'Error occurred while registering customer' });
//     }
// }; 

// Customer Login

const customerLogin = async (req, res) => {
    const { Email, Password } = req.body;

    try {
        // Find the customer by email
        const customer = await CustomerModel.findOne({ where: { Email } });
        if (!customer) {
            return res.status(404).json({ status: 'FAILURE', message: 'Customer not found' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(Password, customer.Password);
        if (!isPasswordValid) {
            return res.status(401).json({ status: 'FAILURE', message: 'Invalid password' });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: customer.CustomerID, Email: customer.Email ,RoleID: customer.RoleID,  }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            status: 'SUCCESS',
            message: 'Login successful',
            token, 
            CustomerID:customer.CustomerID,
        });
    } catch (error) {
        console.error('Error during customer login:', error);
        res.status(500).json({ status: 'FAILURE', message: 'Error occurred while logging in' });
    }
};

/*--forgot otp methods--*/
// Step 1: Request Forgot Password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email is required'
            });
        }

        // Find customer by email
        const customer = await CustomerModel.findOne({ where: { Email: email } });
        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        // Generate OTP and set expiry
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // OTP expiry time

        // Update OTP and expiry in the database
        await customer.update({
            OTP: otp,
            OTPExpiry: otpExpiry,
            UpdatedAt: new Date()
        });

        // Send OTP via email
        await sendEmail(email, otp);

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'OTP sent successfully to your email'
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};

// Step 2: Verify OTP for Forgot Password
const verifyForgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email and OTP are required'
            });
        }

        // Find customer by email and OTP
        const customer = await CustomerModel.findOne({
            where: {
                Email: email,
                OTP: otp,
                OTPExpiry: { [Op.gt]: new Date() } // Check if OTP is still valid
            }
        });

        if (!customer) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Invalid OTP or OTP has expired'
            });
        }

        // Clear OTP after successful verification
        await customer.update({
            OTP: null,
            OTPExpiry: null,
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Error in verifyForgotPasswordOTP:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};
// Step 3: Reset Password
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        if (!email || !newPassword) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email and new password are required'
            });
        }

        // Find customer by email
        const customer = await CustomerModel.findOne({ where: { Email: email } });
        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update the customer's password
        await customer.update({
            Password: hashedPassword,
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await CustomerModel.findAll();
        return res.status(200).json({
            status: 'SUCCESS',
            data: customers
        });
    } catch (error) {
        console.error('Error in getAllCustomers:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};


// Get Customer by ID
const getCustomerById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const customer = await CustomerModel.findByPk(id, {
            include: [
                {
                    model: AddressModel,
                    as: 'Addresses',  // Changed from 'Address' to 'Addresses'
                    include: [
                        { model: CityModel, as: 'City', attributes: ['CityName'] },
                        { model: StateModel, as: 'State', attributes: ['StateName'] },
                        { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                    ]
                },
            ],
        });

        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found',
            });
        }

        // Restructure the data to handle multiple addresses
        const responseData = {
            CustomerID: customer.CustomerID,
            FirstName: customer.FirstName,
            LastName: customer.LastName,
            Email: customer.Email,
            PhoneNumber: customer.PhoneNumber,
            Gender: customer.Gender,
            DateOfBirth: customer.DateOfBirth,
            TenantID: customer.TenantID,
            CreatedBy: customer.CreatedBy,
            CreatedAt: customer.CreatedAt,
            UpdatedBy: customer.UpdatedBy,
            UpdatedAt: customer.UpdatedAt,
            Addresses: customer.Addresses?.map(address => ({
                AddressID: address.AddressID,
                TenantID: address.TenantID,
                AddressLine1: address.AddressLine1,
                AddressLine2: address.AddressLine2,
                Zipcode: address.Zipcode,
                CityName: address.City?.CityName,
                StateName: address.State?.StateName,
                CountryName: address.Country?.CountryName,
                CreatedBy: address.CreatedBy,
                CreatedAt: address.CreatedAt,
                UpdatedBy: address.UpdatedBy,
                UpdatedAt: address.UpdatedAt,
            })) || []
        };

        return res.status(200).json({
            status: 'SUCCESS',
            data: responseData,
        });
    } catch (error) {
        console.error('Error in getCustomerById:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error',
        });
    }
};


// Update Customer
const updateCustomer = async (req, res) => {
    const { customerId } = req.params;
    const { firstName, lastName, email, password, address } = req.body;

    try {
        const customer = await CustomerModel.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        // Check if email is already in use by another customer
        const existingEmail = await CustomerModel.findOne({
            where: {
                Email: email,
                CustomerID: { [Op.ne]: customerId }
            }
        });

        if (existingEmail) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Email already in use'
            });
        }

        // Hash password if provided
        let hashedPassword = customer.Password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        // Update address if provided
        let addressId = customer.AddressID;
        if (address) {
            const updatedAddress = await AddressModel.update(
                {
                    AddressLine1: address.addressLine1,
                    AddressLine2: address.addressLine2,
                    CityID: address.cityId,
                    StateID: address.stateId,
                    CountryID: address.countryId,
                    Zipcode: address.zipcode,
                    UpdatedBy: customer.CustomerID.toString(),
                    UpdatedAt: new Date()
                },
                { where: { AddressID: customer.AddressID }, returning: true }
            );
            addressId = updatedAddress[1][0].AddressID;
        }

        // Update customer
        await customer.update({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Password: hashedPassword,
            AddressID: addressId,
            UpdatedBy: customer.CustomerID.toString(),
            UpdatedAt: new Date()
        });

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Customer updated successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error in updateCustomer:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
    const { customerId } = req.params;

    try {
        const customer = await CustomerModel.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({
                status: 'FAILURE',
                message: 'Customer not found'
            });
        }

        await customer.destroy();

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteCustomer:', error);
        return res.status(500).json({
            status: 'FAILURE',
            message: 'Internal server error'
        });
    }
};


module.exports = {  customerLogin,initiateRegistration,verifyOTP,completeRegistration,
    getCustomerById,
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
    forgotPassword,verifyForgotPasswordOTP,resetPassword
};
