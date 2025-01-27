const { StoreModel,CityModel,StateModel,CountryModel,UserManagementModel,MapStoreUser } = require('../DbConnection/connect');  
// const Sequelize = require('sequelize');
const { Sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize'); 

exports.getAllStores = async (req, res) => {
    const { pageNumber = 1, pageSize = 10, searchText = '', TenantID } = req.query;
  
    try {
      // Define the search filter
      const searchFilter = {
        [Op.or]: [
          { StoreName: { [Op.iLike]: `%${searchText}%` } },
          { Email: { [Op.iLike]: `%${searchText}%` } },
          { Phone: { [Op.iLike]: `%${searchText}%` } },
        ],
      };
  
      // If `TenantID` is provided, add it to the filter
      if (TenantID) {
        searchFilter[Op.and] = [{ TenantID }];
      }
  
      // Calculate pagination values
      const limit = parseInt(pageSize, 10);
      const offset = (parseInt(pageNumber, 10) - 1) * limit;
  
      // Fetch stores with pagination
      const { count, rows } = await StoreModel.findAndCountAll({
        where: searchFilter,
        attributes: [
          'StoreID', 'StoreName', 'Email', 'Phone', 'AddressLine1', 'AddressLine2',
          'CityID', 'StateID', 'CountryID', 'ZipCode', 'CreatedBy', 'CreatedAt', 'UpdatedBy', 'UpdatedAt',
        ],
        limit,
        offset,
      });
  
      // Format the response
      const formattedStores = rows.map(store => ({
        StoreID: store.StoreID,
        StoreName: store.StoreName,
        Email: store.Email,
        Phone: store.Phone,
        AddressLine1: store.AddressLine1,
        AddressLine2: store.AddressLine2,
        CityID: store.CityID,
        StateID: store.StateID,
        CountryID: store.CountryID,
        ZipCode: store.ZipCode,
        CreatedBy: store.CreatedBy,
        CreatedAt: store.CreatedAt,
        UpdatedBy: store.UpdatedBy,
        UpdatedAt: store.UpdatedAt,
      }));
  
      // Return the result
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        page: parseInt(pageNumber, 10),
        pageSize: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        Stores: formattedStores,
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      return res.status(500).json({ StatusCode: 'ERROR', message: 'Error fetching stores' });
    }
  };
  

/*exports.getAllStores = async (req, res) => {
  const { pageNumber = 1, pageSize = 10, searchText = '', TenantID } = req.query;

  // Validate `TenantID`
  if (!TenantID) {
    return res.status(400).json({ StatusCode: 'ERROR', message: 'TenantID is required' });
  }

  try {
    // Define the search filter
    const searchFilter = {
      [Op.and]: [
        { TenantID },
        {
          [Op.or]: [
            { StoreName: { [Op.iLike]: `%${searchText}%` } },
            { Email: { [Op.iLike]: `%${searchText}%` } },
            { Phone: { [Op.iLike]: `%${searchText}%` } }
          ]
        }
      ]
    };

    // Calculate pagination values
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(pageNumber, 10) - 1) * limit;

    // Fetch stores with pagination
    const { count, rows } = await StoreModel.findAndCountAll({
      where: searchFilter,
      attributes: [
        'StoreID', 'StoreName', 'Email', 'Phone', 'AddressLine1', 'AddressLine2',
        'CityID', 'StateID', 'CountryID', 'ZipCode', 'CreatedBy', 'CreatedAt', 'UpdatedBy', 'UpdatedAt'
      ],
      limit,
      offset
    });

    // Format the response
    const formattedStores = rows.map(store => ({
      StoreID: store.StoreID,
      StoreName: store.StoreName,
      Email: store.Email,
      Phone: store.Phone,
      AddressLine1: store.AddressLine1,
      AddressLine2: store.AddressLine2,
      CityID: store.CityID,
      StateID: store.StateID,
      CountryID: store.CountryID,
      ZipCode: store.ZipCode,
      CreatedBy: store.CreatedBy,
      CreatedAt: store.CreatedAt,
      UpdatedBy: store.UpdatedBy,
      UpdatedAt: store.UpdatedAt
    }));

    // Return the result
    return res.status(200).json({
      StatusCode: 'SUCCESS',
      page: parseInt(pageNumber, 10),
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      Stores: formattedStores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return res.status(500).json({ StatusCode: 'ERROR', message: 'Error fetching stores' });
  }
}; */


exports.getStoresForUser = async (req, res) => {
  try {
      // Retrieve only the stores that are mapped to the user
      const storeIDs = req.user.StoreIDs;  
      const stores = await StoreModel.findAll({
          where: {
              StoreID: storeIDs 
          }
      });

      res.status(200).json(stores);
  } catch (err) {
      console.error('Error fetching stores:', err);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Get store details by ID
exports.getStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await StoreModel.findByPk(id,{
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
        }
      ],
      attributes:['StoreID', 'StoreName', 'Email', 'Phone','AddressLine1','AddressLine2','ZipCode'],
    });

    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const formattedStore = {
      StoreID: store.StoreID,
      StoreName: store.StoreName,
      Email: store.Email,
      Phone: store.Phone,
      AddressLine1: store.AddressLine1,
      AddressLine2: store.AddressLine2,
      CityName: store.City?.CityName || null, 
      StateName: store.State?.StateName || null, 
      CountryName: store.Country?.CountryName || null,
      StateID: store.StateID,
      CountryID: store.CountryID,
      ZipCode: store.ZipCode,
   
    };
    return res.status(200).json({
      StatusCode: 'SUCCESS',
      store:formattedStore
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller function to create or update store
exports.createOrUpdateStore = async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;

    const {
      StoreID,
      TenantID,
      StoreName,
      Email,
      Phone,
      AddressLine1,
      AddressLine2,
      CityID,
      StateID,
      CountryID,
      ZipCode,
      CreatedBy,
      UpdatedBy
    } = data;

    // Validate required fields
    if (!Email) {
      return res.status(400).json({
        StatusCode: 'ERROR',
        message: 'Email is required'
      });
    }

    if (StoreID && StoreID !== 0) {
      // Update existing store
      const store = await StoreModel.findByPk(StoreID);

      if (!store) {
        return res.status(404).json({
          StatusCode: 'ERROR',
          message: 'Store not found'
        });
      }

      // Check for duplicate email, excluding current store
      const existingStore = await StoreModel.findOne({
        where: {
          Email,
          StoreID: { [Op.ne]: StoreID } // Ensure it's not the current store
        }
      });

      if (existingStore) {
        return res.status(200).json({
          StatusCode: 'ERROR',
          message: 'A store with this email already exists'
        });
      }

      // Update store details
      await store.update({
        TenantID,
        StoreName,
        Email,
        Phone,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        UpdatedAt: new Date(),
        UpdatedBy
      });

      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Store updated successfully',
        StoreID: store.StoreID
      });
    } else {
      // Create a new store
      const existingStore = await StoreModel.findOne({ where: { Email } });

      if (existingStore) {
        return res.status(200).json({
          StatusCode: 'ERROR',
          message: 'A store with this email already exists'
        });
      }

      // Create new store entry
      const newStore = await StoreModel.create({
        TenantID,
        StoreName,
        Email,
        Phone,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        CreatedBy,
        CreatedAt: new Date(),
        UpdatedBy,
        UpdatedAt: new Date()
      });

      return res.status(201).json({
        StatusCode: 'SUCCESS',
        message: 'Store created successfully',
        StoreID: newStore.StoreID
      });
    }
  } catch (error) {
    console.error('Error creating or updating store:', error);
    return res.status(500).json({
      StatusCode: 'ERROR',
      message: 'Internal Server Error'
    });
  }
};


// Delete a Store
exports.deleteStore= async (req, res) => {
  const { id } = req.params;

  try {
    const store = await StoreModel.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'User not found' });
    }

    await store.destroy();

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
