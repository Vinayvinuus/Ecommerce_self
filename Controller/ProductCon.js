
const { ProductModelss, ImagesModel, BrandModel,ColourModel,SizeModel,ProductVariantModel, 
    feedBackModel,CustomerModel,CategoryModel,sequelize,ProductTypeModel } = require('../DbConnection/connect');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const moment = require('moment'); // Import moment
const supabase = require('../middleWare/supabase');

const upload = multer({ storage: multer.memoryStorage() }).any();
//const upload = multer({ storage: multer.memoryStorage() }).array('files', 10);
//const upload = multer({ storage: storage }).array('files', 10);


// Function to upload a file to Supabase
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
            .from('UploadProductImages')
            .upload(`ProductImages/${fileNameWithTimestamp}`, file.buffer, {
                contentType: file.mimetype
            });
        
        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new Error('Error uploading file to Supabase: ' + error.message);
        }
        
        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/UploadProductImages/ProductImages/${fileNameWithTimestamp}`;
        const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;
        
        return { publicUrl, downloadUrl, originalFileName: file.originalname };
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
};
/*const uploadFileToSupabase = async (file) => {
    try {
        const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;

        const { data, error } = await supabase
            .storage
            .from('UploadProductImages')
            .upload(`ProductImages/${fileNameWithTimestamp}`, file.buffer, {
                contentType: file.mimetype
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new Error('Error uploading file to Supabase: ' + error.message);
        }

        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/UploadProductImages/ProductImages/${fileNameWithTimestamp}`;
        const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;

        return { publicUrl, downloadUrl, originalFileName: file.originalname };
    } catch (error) {
        console.error('File Upload Error:', error);
        throw error;
    }
};   */


/*const uploadFileToSupabase = async (file, existingUrl = null) => {
    try {
      // If there's an existing URL, extract the file path from it
      let filePath;
      if (existingUrl) {
        // Extract the file path after "ProductImages/"
        const matches = existingUrl.match(/ProductImages\/(.*?)(?:\?|$)/);
        if (matches && matches[1]) {
          filePath = `ProductImages/${matches[1]}`;
        }
      }
  
      // If no existing URL or couldn't extract path, create new path
      if (!filePath) {
        const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
        const timestamp = moment().format('DDMMYYYY_HHmmss');
        const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;
        filePath = `ProductImages/${fileNameWithTimestamp}`;
      }
  
      // If there's an existing file, we need to upsert instead of upload
      const { data, error } = await supabase
        .storage
        .from('UploadProductImages')
        .upload(filePath, file.buffer, { 
          contentType: file.mimetype,
          upsert: true // This will overwrite if file exists
        });
  
      if (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Error uploading file to Supabase: ' + error.message);
      }
  
      const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/UploadProductImages/${filePath}`;
      const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;
  
      return {
        publicUrl,
        downloadUrl,
        originalFileName: file.originalname
      };
    } catch (error) {
      console.error('File Upload Error:', error);
      throw error;
    }
  }; */
const productWithImages = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).json({ error: "Failed to upload images.", err });
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(500).json({ error: "Failed to upload images.", err });
        }

        const transaction = await sequelize.transaction();

        try {
            // Parse the input JSON
            let Obj;
            try {
                Obj = JSON.parse(req.body.Data); // Parse JSON from the 'Data' field
            } catch (parseError) {
                return res.status(400).json({ error: 'Invalid JSON format in request body' });
            }

            // Destructure data from the input
            const { 
                TenantID, 
                ProductTypeID, 
                ProductName, 
                ProductDescription, 
                BrandID, 
                CategoryID, 
                MRP, 
                ProductDiscount, 
                Gender, 
                CreatedBy, 
                Colors 
            } = Obj;

            // Validate ProductType
            const productType = await ProductTypeModel.findOne({
                where: { ProductTypeID }
            });

            if (!productType) {
                return res.status(404).json({
                    statusCode: 'FAILURE',
                    message: 'Invalid or Inactive product Type.',
                    error: 'Product Type not found or is inactive.'
                });
            }

            // Ensure Colors is an array
            if (!Array.isArray(Colors)) {
                return res.status(400).json({
                    statusCode: 'FAILURE',
                    message: 'Colors must be an array.',
                    error: 'Invalid format for colors field.'
                });
            }

            // Calculate Discount Value
            const discountPercentage = parseFloat(ProductDiscount.replace('%', '')) / 100;
            const baseSellingPrice = MRP - MRP * discountPercentage; 

            // Create a new product
            const newProduct = await ProductModelss.create({
                TenantID,
                ProductTypeID,
                ProductName,
                ProductDescription,
                BrandID,
                CategoryID,
                Gender,
                MRP,
                ProductDiscount,
                CreatedBy
            }, { transaction });

            // Object to track created variants
            const createdVariants = {};

            // Tracking color-specific images to avoid duplicates
            const processedColorImages = new Set();

            // Iterate through colors
            for (let colorIndex in Colors) {
                const colorData = Colors[colorIndex];
                const { ColourID, Sizes } = colorData;

                // Ensure Sizes is an array
                if (!Array.isArray(Sizes)) {
                    return res.status(400).json({
                        statusCode: 'FAILURE',
                        message: 'Sizes must be an array for each color.',
                        error: 'Invalid format for sizes field.'
                    });
                }

                // Retrieve files for the current color
                const colorFiles = req.files.filter(file => file.fieldname === `images_${colorIndex}`);

                // Prepare to store the image URL for this color
                let colorImageUrl = null;
                let curt_ImageUrl = "";

                // If there are files for the color and we haven't processed this color's image
                // if (colorFiles && colorFiles.length > 0 && !processedColorImages.has(ColourID)) {
                //     const file = colorFiles[0]; // Select only the first file
                //     try {
                //         // Upload the image to Supabase
                //         const { publicUrl } = await uploadFileToSupabase(file);
                //         colorImageUrl = publicUrl;
                        
                //         // Mark this color as processed
                //         processedColorImages.add(ColourID);
                //     } catch (imageError) {
                //         console.error('Error during image upload:', imageError.message);
                //     }
                // }
               
                if (colorFiles && colorFiles.length > 0 && !processedColorImages.has(ColourID)) {
                    try {
                        const imageUrls = [];
                
                        // Loop through all files and upload each one
                        for (const file of colorFiles) {
                            const { publicUrl } = await uploadFileToSupabase(file);
                            imageUrls.push(publicUrl);
                        }
                
                        //colorImageUrl = imageUrls; // Store all image URLs
                        colorImageUrl = imageUrls.join(','); // Store image URLs as a comma-separated string

                
                        // Mark this color as processed
                        processedColorImages.add(ColourID);
                    } catch (imageError) {
                        console.error('Error during image upload:', imageError.message);
                    }
                }
                // Iterate through sizes for this color
                for (let sizeData of Sizes) {
                    const { SizeID, Quantity, SellingPrice } = sizeData;

                    // Create the variant
                    const newVariant = await ProductVariantModel.create({
                        ProductID: newProduct.ProductID,
                        SizeID,
                        ColourID,
                        Quantity,
                        SellingPrice: SellingPrice || baseSellingPrice,
                        CreatedBy: CreatedBy
                    }, { transaction });

                    // Initialize variant in createdVariants
                    createdVariants[newVariant.VariantID] = { 
                        ...newVariant.toJSON(), 
                        Images: [] 
                    };

                    // Create image record if image URL exists and not already created for this color
                    if (colorImageUrl) {
                        try {
                            // Check if an image already exists for this color
                            const existingImage = await ImagesModel.findOne({
                                where: {
                                    ProductID: newProduct.ProductID,
                                    ColourID: ColourID
                                }
                            });
                            console.log(existingImage);
                            

                            // Create image only if no existing image for this color
                            if (!existingImage && curt_ImageUrl === "") {
                                const newImage = await ImagesModel.create({
                                    TenantID: newProduct.TenantID,
                                    ProductID: newProduct.ProductID,
                                    VariantID: newVariant.VariantID,
                                    ColourID: ColourID,
                                    ImageUrl: colorImageUrl,
                                    IsDefault: true,
                                    CreatedBy: CreatedBy
                                }, { transaction });

                               curt_ImageUrl = newImage.ImageUrl;
                            }
                             // Add the image URL to the corresponding variant
                             if (createdVariants[newVariant.VariantID]) {
                                createdVariants[newVariant.VariantID].Images.push(curt_ImageUrl);
                            }
                        } catch (imageError) {
                            console.error('Error during image record creation:', imageError.message);
                        }
                    }
                }
            }

            // Commit the transaction if all operations succeed
            await transaction.commit();

            // Return the product along with its variants and images
            return res.status(201).json({
                statusCode: 'SUCCESS',
                message: 'Product, variants, and images created successfully.',
                data: { 
                    newProduct, 
                    ProductTypeName: productType.ProductTypeName,
                    variants: Object.values(createdVariants) 
                }
            });
        } catch (error) {
            // Rollback transaction on any other error
            await transaction.rollback();
            console.error('Transaction Error:', error);
            return res.status(500).json({ error: error.message });
        }
    });
}; 

// const getProductDetails = async (req, res) => {
//     try {
//         const products = await ProductModelss.findAll({
//             include: [
//                 {
//                     model: BrandModel,
//                     as: 'Brand',
//                     attributes: ['BrandID', 'BrandName']
//                 },
//                 {
//                     model: CategoryModel,
//                     as: 'Category',
//                     attributes: ['CategoryID', 'CategoryName']
//                 },
//                 {
//                     model: ProductTypeModel,
//                     as: 'ProductType',
//                     attributes: ['ProductTypeID', 'ProductTypeName', 'Status']
//                 },
//                 {
//                     model: ProductVariantModel,
//                     as: 'ProductVariants',
//                     include: [
//                         {
//                             model: ColourModel,
//                             as: 'Colour',
//                             attributes: ['ColourID', 'Name', 'HexCode', 'RgbCode']
//                         },
//                         {
//                             model: SizeModel,
//                             as: 'Size',
//                             attributes: ['SizeID', 'Label']
//                         },
//                         {
//                             model: ImagesModel,
//                             as: 'VariantImages',
//                             attributes: ['ImageUrl']
//                         }
//                     ],
//                     attributes: ['VariantID', 'ColourID', 'SizeID', 'Quantity', 'SellingPrice']
//                 },
//                 {
//                     model: feedBackModel,
//                     as: 'Feedback',
//                     include: [
//                         {
//                             model: CustomerModel,
//                             as: 'Customer',
//                             attributes: ['CustomerID', 'FirstName']
//                         }
//                     ],
//                     attributes: ['FeedbackID', 'Rating', 'Comment', 'CreatedBy', 'CreatedAt']
//                 }
//             ],
//             attributes: [
//                 'ProductID',
//                 'TenantID',
//                 'ProductName',
//                 'ProductDescription',
//                 'ProductDiscount',
//                 'Gender',
//                 'MRP',
//                 'CreatedBy',
//                 'UpdatedBy',
//                 'ProductTypeID'
//             ],
//             order: [['ProductID', 'DESC']]
//         });

//         if (!products || products.length === 0) {
//             return res.status(404).json({
//                 statusCode: 'SUCCESS',
//                 message: 'No products found',
//                 data: []
//             });
//         }

//         const processImageUrls = (imageUrl) => {
//             if (!imageUrl) return [];
//             return imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
//         };

//         const formattedProducts = products.map(product => ({
//             productId: product.ProductID,
//             tenantId: product.TenantID,
    
//             productTypeId: product.ProductTypeID || 'N/A',
//             productTypeName: product.ProductType?.ProductTypeName || 'N/A',
            
//             productName: product.ProductName,
//             productDescription: product.ProductDescription,
//             productDiscount: product.ProductDiscount ? `${product.ProductDiscount}%` : 'N/A',
//             gender: product.Gender,
//             MRP: product.MRP,
            
//             brandId: product.Brand?.BrandID || 'N/A',
//             brandName: product.Brand?.BrandName || 'N/A',
            
            
//             categoryId: product.Category?.CategoryID || 'N/A',
//             categoryName: product.Category?.CategoryName || 'N/A',
//             createdBy: product.CreatedBy,
//             updatedBy: product.UpdatedBy,
//             variants: product.ProductVariants.reduce((colorVariants, variant) => {
//                 // Find or create a color group
//                 let colorGroup = colorVariants.find(cv => cv.colourId === variant.ColourID);
//                 if (!colorGroup) {
//                     colorGroup = {
//                         colourId: variant.ColourID,
//                         colorName: variant.Colour?.Name || 'N/A',
//                         colorHexCode: variant.Colour?.HexCode || 'N/A',
//                         colorRgbCode: variant.Colour?.RgbCode || 'N/A',
//                         images: [],
//                         sizes: []
//                     };
//                     colorVariants.push(colorGroup);
//                 }

//                 // Add images for this variant to the color group
//                 const variantImages = variant.VariantImages.reduce((urls, img) => {
//                     const processedUrls = processImageUrls(img.ImageUrl);
//                     return [...urls, ...processedUrls];
//                 }, []);
//                 colorGroup.images = [...new Set([...colorGroup.images, ...variantImages])]; // Ensure no duplicate images

//                 // Add size details to the color group
//                 colorGroup.sizes.push({
//                     variantId: variant.VariantID,
//                     sizeId: variant.SizeID,
//                     sizeLabel: variant.Size?.Label || 'N/A',
//                     price: parseFloat(variant.SellingPrice),
//                     quantity: variant.Quantity
//                 });

//                 return colorVariants;
//             }, []),
//             feedback: product.Feedback.map(feedback => ({
//                 feedbackId: feedback.FeedbackID,
//                 rating: feedback.Rating,
//                 comment: feedback.Comment,
//                 customerName: feedback.Customer?.FirstName || 'Anonymous',
//                 createdBy: feedback.CreatedBy,
//                 createdAt: feedback.CreatedAt
//             }))
//         }));

//         res.json({
//             statusCode: 'SUCCESS',
//             message: 'Products retrieved successfully',
//             data: formattedProducts
//         });

//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({
//             statusCode: 'FAILURE',
//             message: 'Error fetching products',
//             error: error.message
//         });
//     }
// };



// const getProductById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Debug log to check input ID
//         console.log('Fetching product with ID:', id);

//         const product = await ProductModelss.findByPk(id, {
//             include: [
//                 {
//                     model: BrandModel,
//                     as: 'Brand',
//                     attributes: ['BrandID', 'BrandName']
//                 },
//                 {
//                     model: CategoryModel,
//                     as: 'Category',
//                     attributes: ['CategoryID', 'CategoryName']
//                 },
//                 {
//                     model: ProductTypeModel,
//                     as: 'ProductType',
//                     attributes: ['ProductTypeID', 'ProductTypeName', 'Status']
//                 },
//                 {
//                     model: ProductVariantModel,
//                     as: 'ProductVariants',
//                     include: [
//                         {
//                             model: ColourModel,
//                             as: 'Colour',
//                             attributes: ['ColourID', 'Name', 'HexCode', 'RgbCode']
//                         },
//                         {
//                             model: SizeModel,
//                             as: 'Size',
//                             attributes: ['SizeID', 'Label']
//                         },
//                         {
//                             model: ImagesModel,
//                             as: 'VariantImages',
//                             attributes: ['ImageUrl']
//                         }
//                     ],
//                     attributes: ['VariantID', 'ColourID', 'SizeID', 'Quantity', 'SellingPrice']
//                 },
//                 {
//                     model: feedBackModel,
//                     as: 'Feedback',
//                     include: [
//                         {
//                             model: CustomerModel,
//                             as: 'Customer',
//                             attributes: ['CustomerID', 'FirstName']
//                         }
//                     ],
//                     attributes: ['FeedbackID', 'Rating', 'Comment', 'CreatedBy', 'CreatedAt']
//                 }
//             ],
//             attributes: [
//                 'ProductID',
//                 'TenantID',
//                 'ProductTypeID',
//                 'ProductName',
//                 'ProductDescription',
//                 'ProductDiscount',
//                 'Gender',
//                 'MRP',
//                 'CreatedBy',
//                 'UpdatedBy'
//             ]
//         });

//         if (!product) {
//             return res.status(404).json({
//                 statusCode: 'FAILURE',
//                 message: 'Product not found',
//                 data: null
//             });
//         }

//         // Debug log to check raw variant data
//         console.log('Raw variants data:', JSON.stringify(product.ProductVariants, null, 2));

//         // Create a map to store all images for each color
//         const colorImagesMap = new Map();

//         // First pass: collect all images for each color
//         product.ProductVariants.forEach(variant => {
//             const colorId = variant.ColourID;
            
//             if (!colorImagesMap.has(colorId)) {
//                 colorImagesMap.set(colorId, new Set());
//             }

//             if (variant.VariantImages && Array.isArray(variant.VariantImages)) {
//                 variant.VariantImages.forEach(image => {
//                     if (image && image.ImageUrl) {
//                         // Add each image URL to the Set for this color
//                         colorImagesMap.get(colorId).add(image.ImageUrl);
//                     }
//                 });
//             }
//         });

//         // Debug log to check collected images
//         console.log('Collected images by color:', Object.fromEntries(colorImagesMap));

//         // Group variants by color with collected images
//         const formattedVariants = product.ProductVariants.reduce((colorVariants, variant) => {
//             const existingColorVariant = colorVariants.find(cv => cv.colourId === variant.ColourID);

//             if (!existingColorVariant) {
//                 // Get all images for this color from our map
//                 const colorImages = Array.from(colorImagesMap.get(variant.ColourID) || []);
                
//                 // Create new color variant group
//                 colorVariants.push({
//                     colourId: variant.ColourID,
//                     colorName: variant.Colour?.Name || 'N/A',
//                     colorHexCode: variant.Colour?.HexCode || 'N/A',
//                     colorRgbCode: variant.Colour?.RgbCode || 'N/A',
//                     images: colorImages, // Use collected images
//                     sizes: [{
//                         sizeId: variant.SizeID,
//                         sizeLabel: variant.Size?.Label || 'N/A',
//                         price: parseFloat(variant.SellingPrice),
//                         quantity: variant.Quantity
//                     }]
//                 });
//             } else {
//                 // Add size to existing color variant
//                 existingColorVariant.sizes.push({
//                     sizeId: variant.SizeID,
//                     sizeLabel: variant.Size?.Label || 'N/A',
//                     price: parseFloat(variant.SellingPrice),
//                     quantity: variant.Quantity
//                 });
//             }

//             return colorVariants;
//         }, []);

//         // Debug log to check final formatted variants
//         console.log('Formatted variants:', JSON.stringify(formattedVariants, null, 2));

//         const formattedProduct = {
//             productId: product.ProductID,
//             tenantId: product.TenantID,
//             productType: {
//                 productTypeId: product.ProductTypeID || 'N/A',
//                 productTypeName: product.ProductType?.ProductTypeName || 'N/A'
//             },
//             productName: product.ProductName,
//             productDescription: product.ProductDescription,
//             productDiscount: product.ProductDiscount ? `${product.ProductDiscount}%` : 'N/A',
//             gender: product.Gender,
//             MRP: product.MRP,
//             brand: {
//                 brandId: product.Brand?.BrandID || 'N/A',
//                 brandName: product.Brand?.BrandName || 'N/A'
//             },
//             category: {
//                 categoryId: product.Category?.CategoryID || 'N/A',
//                 categoryName: product.Category?.CategoryName || 'N/A'
//             },
//             createdBy: product.CreatedBy,
//             updatedBy: product.UpdatedBy,
//             variants: formattedVariants,
//             feedback: product.Feedback.map(feedback => ({
//                 feedbackId: feedback.FeedbackID,
//                 rating: feedback.Rating,
//                 comment: feedback.Comment,
//                 customerName: feedback.Customer?.FirstName,
//                 createdBy: feedback.CreatedBy,
//                 createdAt: feedback.CreatedAt
//             }))
//         };

//         res.json({
//             statusCode: 'SUCCESS',
//             message: 'Product retrieved successfully',
//             data: formattedProduct
//         });

//     } catch (error) {
//         console.error('Error fetching product by ID:', error);
//         res.status(500).json({
//             statusCode: 'FAILURE',
//             message: 'Error fetching product',
//             error: error.message
//         });
//     }
// };

const getProductDetails = async (req, res) => {
    try {
        const { 
            pageNumber = 1, 
            pageSize = 10, 
            brandName, 
            categoryName, 
            colorName, 
            sizeLabel, 
            sellingPrice, 
            searchText 
        } = req.query;

        // Build the base query options
        let options = {
            include: [
                {
                    model: BrandModel,
                    as: 'Brand',
                    attributes: ['BrandID', 'BrandName'],
                    where: brandName ? { BrandName: { [Op.like]: `%${brandName}%` } } : undefined
                },
                {
                    model: CategoryModel,
                    as: 'Category',
                    attributes: ['CategoryID', 'CategoryName'],
                    where: categoryName ? { CategoryName: { [Op.like]: `%${categoryName}%` } } : undefined
                },
                {
                    model: ProductTypeModel,
                    as: 'ProductType',
                    attributes: ['ProductTypeID', 'ProductTypeName', 'Status']
                },
                {
                    model: ProductVariantModel,
                    as: 'ProductVariants',
                    include: [
                        {
                            model: ColourModel,
                            as: 'Colour',
                            attributes: ['ColourID', 'Name', 'HexCode', 'RgbCode'],
                            where: colorName ? { Name: { [Op.like]: `%${colorName}%` } } : undefined
                        },
                        {
                            model: SizeModel,
                            as: 'Size',
                            attributes: ['SizeID', 'Label'],
                            where: sizeLabel ? { Label: { [Op.like]: `%${sizeLabel}%` } } : undefined
                        },
                        {
                            model: ImagesModel,
                            as: 'VariantImages',
                            attributes: ['ImageUrl']
                        }
                    ],
                    attributes: ['VariantID', 'ColourID', 'SizeID', 'Quantity', 'SellingPrice'],
                    where: sellingPrice ? { SellingPrice: { [Op.lte]: parseFloat(sellingPrice) } } : undefined
                },
                {
                    model: feedBackModel,
                    as: 'Feedback',
                    include: [
                        {
                            model: CustomerModel,
                            as: 'Customer',
                            attributes: ['CustomerID', 'FirstName']
                        }
                    ],
                    attributes: ['FeedbackID', 'Rating', 'Comment', 'CreatedBy', 'CreatedAt']
                }
            ],
            attributes: [
                'ProductID',
                'TenantID',
                'ProductName',
                'ProductDescription',
                'ProductDiscount',
                'Gender',
                'MRP',
                'CreatedBy',
                'UpdatedBy',
                'ProductTypeID'
            ],
            order: [['ProductID', 'DESC']],
            where: searchText
                ? {
                    [Op.or]: [
                        { ProductName: { [Op.like]: `%${searchText}%` } },
                        { ProductDescription: { [Op.like]: `%${searchText}%` } }
                    ]
                }
                : undefined
        };

        // Get total count for pagination
        const totalCount = await ProductModelss.count({
            include: options.include,
            where: options.where
        });

        // Apply pagination if provided
        if (pageNumber && pageSize) {
            const offset = (parseInt(pageNumber) - 1) * parseInt(pageSize);
            options.limit = parseInt(pageSize);
            options.offset = offset;
        }

        // Fetch paginated products
        const products = await ProductModelss.findAll(options);

        if (!products || products.length === 0) {
            return res.status(404).json({
                statusCode: 'SUCCESS',
                message: 'No products found',
                data: [],
                totalRecords: 0,
                totalPages: 0,
                currentPage: parseInt(pageNumber)
            });
        }

        const processImageUrls = (imageUrl) => {
            if (!imageUrl) return [];
            return imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');
        };

        const formattedProducts = products.map(product => ({
            productId: product.ProductID,
            tenantId: product.TenantID,
            productTypeId: product.ProductTypeID || 'N/A',
            productTypeName: product.ProductType?.ProductTypeName || 'N/A',
            productName: product.ProductName,
            productDescription: product.ProductDescription,
            productDiscount: product.ProductDiscount ? `${product.ProductDiscount}%` : 'N/A',
            gender: product.Gender,
            MRP: product.MRP,
            brandId: product.Brand?.BrandID || 'N/A',
            brandName: product.Brand?.BrandName || 'N/A',
            categoryId: product.Category?.CategoryID || 'N/A',
            categoryName: product.Category?.CategoryName || 'N/A',
            createdBy: product.CreatedBy,
            updatedBy: product.UpdatedBy,
            variants: product.ProductVariants.reduce((colorVariants, variant) => {
                let colorGroup = colorVariants.find(cv => cv.colourId === variant.ColourID);
                if (!colorGroup) {
                    colorGroup = {
                        colourId: variant.ColourID,
                        colorName: variant.Colour?.Name || 'N/A',
                        colorHexCode: variant.Colour?.HexCode || 'N/A',
                        colorRgbCode: variant.Colour?.RgbCode || 'N/A',
                        images: [],
                        sizes: []
                    };
                    colorVariants.push(colorGroup);
                }

                const variantImages = variant.VariantImages.reduce((urls, img) => {
                    const processedUrls = processImageUrls(img.ImageUrl);
                    return [...urls, ...processedUrls];
                }, []);
                colorGroup.images = [...new Set([...colorGroup.images, ...variantImages])];

                colorGroup.sizes.push({
                    variantId: variant.VariantID,
                    sizeId: variant.SizeID,
                    sizeLabel: variant.Size?.Label || 'N/A',
                    price: parseFloat(variant.SellingPrice),
                    quantity: variant.Quantity
                });

                return colorVariants;
            }, []),
            feedback: product.Feedback.map(feedback => ({
                feedbackId: feedback.FeedbackID,
                rating: feedback.Rating,
                comment: feedback.Comment,
                customerName: feedback.Customer?.FirstName || 'Anonymous',
                createdBy: feedback.CreatedBy,
                createdAt: feedback.CreatedAt
            }))
        }));

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / parseInt(pageSize));

        res.json({
            statusCode: 'SUCCESS',
            message: 'Products retrieved successfully',
            data: formattedProducts,
            totalRecords: totalCount,
            totalPages: totalPages,
            currentPage: parseInt(pageNumber),
            pageSize: parseInt(pageSize)
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching products',
            error: error.message
        });
    }
};


const deleteSupabaseImages = async (imageUrls) => {
    try {
        const supabaseUrl = 'https://ncktnzxgjoxmfokikhsu.supabase.co';
        
        const deletePromises = imageUrls.map(async (url) => {
            const filePath = url.replace(`${supabaseUrl}/storage/v1/object/public/images/`, '');
            const { error } = await supabase.storage.from('images').remove([filePath]);

            if (error) {
                console.error('Failed to delete Supabase image:', filePath, error.message);
                throw new Error(`Failed to delete image: ${filePath}`);
            }
        });

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error deleting images from Supabase:', error.message);
        throw error;
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Debug log to check input ID
        console.log('Fetching product with ID:', id);

        const product = await ProductModelss.findByPk(id, {
            include: [
                {
                    model: BrandModel,
                    as: 'Brand',
                    attributes: ['BrandID', 'BrandName']
                },
                {
                    model: CategoryModel,
                    as: 'Category',
                    attributes: ['CategoryID', 'CategoryName']
                },
                {
                    model: ProductTypeModel,
                    as: 'ProductType',
                    attributes: ['ProductTypeID', 'ProductTypeName', 'Status']
                },
                {
                    model: ProductVariantModel,
                    as: 'ProductVariants',
                    include: [
                        {
                            model: ColourModel,
                            as: 'Colour',
                            attributes: ['ColourID', 'Name', 'HexCode', 'RgbCode']
                        },
                        {
                            model: SizeModel,
                            as: 'Size',
                            attributes: ['SizeID', 'Label']
                        },
                        {
                            model: ImagesModel,
                            as: 'VariantImages',
                            attributes: ['ImageUrl']
                        }
                    ],
                    attributes: ['VariantID', 'ColourID', 'SizeID', 'Quantity', 'SellingPrice']
                },
                {
                    model: feedBackModel,
                    as: 'Feedback',
                    include: [
                        {
                            model: CustomerModel,
                            as: 'Customer',
                            attributes: ['CustomerID', 'FirstName']
                        }
                    ],
                    attributes: ['FeedbackID', 'Rating', 'Comment', 'CreatedBy', 'CreatedAt']
                }
            ],
            attributes: [
                'ProductID',
                'TenantID',
                'ProductTypeID',
                'ProductName',
                'ProductDescription',
                'ProductDiscount',
                'Gender',
                'MRP',
                'CreatedBy',
                'UpdatedBy'
            ]
        });

        if (!product) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Product not found',
                data: null
            });
        }

        // Function to split and clean image URLs
        const processImageUrls = (imageUrl) => {
            if (!imageUrl) return [];
            // Split the URL by comma and trim any whitespace
            return imageUrl.split(',')
                .map(url => url.trim())
                .filter(url => url !== '' && url !== null && url !== undefined);
        };

        // Group variants by color with collected images
        const formattedVariants = product.ProductVariants.reduce((colorVariants, variant) => {
            // Find existing color variant or create a new one
            let existingColorVariant = colorVariants.find(cv => cv.colourId === variant.ColourID);

            // Collect images from multiple sources
            let colorImages = [];
            
            // Collect images from VariantImages
            if (variant.VariantImages && Array.isArray(variant.VariantImages)) {
                variant.VariantImages.forEach(image => {
                    if (image && image.ImageUrl) {
                        const processedUrls = processImageUrls(image.ImageUrl);
                        colorImages.push(...processedUrls);
                    }
                });
            }

            // Remove duplicate images
            colorImages = [...new Set(colorImages)];

            if (!existingColorVariant) {
                // Create new color variant group
                existingColorVariant = {
                    colourId: variant.ColourID,
                    colorName: variant.Colour?.Name || 'N/A',
                    colorHexCode: variant.Colour?.HexCode || 'N/A',
                    colorRgbCode: variant.Colour?.RgbCode || 'N/A',
                    images: colorImages,
                    sizes: []
                };
                colorVariants.push(existingColorVariant);
            } else {
                // Merge images for existing color variant
                existingColorVariant.images = [...new Set([...existingColorVariant.images, ...colorImages])];
            }

            // Add size to color variant
            existingColorVariant.sizes.push({
                variantId: variant.VariantID,
                sizeId: variant.SizeID,
                sizeLabel: variant.Size?.Label || 'N/A',
                price: parseFloat(variant.SellingPrice),
                quantity: variant.Quantity
            });

            return colorVariants;
        }, []);

        // Debug logging
        console.log('Formatted Variants:', JSON.stringify(formattedVariants, null, 2));

        const formattedProduct = {
            productId: product.ProductID,
            tenantId: product.TenantID,
           
                productTypeId: product.ProductTypeID || 'N/A',
                productTypeName: product.ProductType?.ProductTypeName || 'N/A',

            productName: product.ProductName,
            productDescription: product.ProductDescription,
            productDiscount: product.ProductDiscount ? `${product.ProductDiscount}%` : 'N/A',
            gender: product.Gender,
            MRP: product.MRP,
           
                brandId: product.Brand?.BrandID || 'N/A',
                brandName: product.Brand?.BrandName || 'N/A',
            
          
                categoryId: product.Category?.CategoryID || 'N/A',
                categoryName: product.Category?.CategoryName || 'N/A',
           
            createdBy: product.CreatedBy,
            updatedBy: product.UpdatedBy,
            variants: formattedVariants,
            feedback: product.Feedback.map(feedback => ({
                feedbackId: feedback.FeedbackID,
                rating: feedback.Rating,
                comment: feedback.Comment,
                customerName: feedback.Customer?.FirstName,
                createdBy: feedback.CreatedBy,
                createdAt: feedback.CreatedAt
            }))
        };

        res.json({
            statusCode: 'SUCCESS',
            message: 'Product retrieved successfully',
            data: formattedProduct
        });

    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching product',
            error: error.message
        });
    }
};
const deleteProductWithImages = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await ProductModelss.findByPk(id);
        if (!product) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Product not found'
            });
        }

        // Fetch existing image URLs
        const existingImages = await ImagesModel.findAll({ where: { ProductID: id } });
        const imageUrls = existingImages.map(img => img.ImageUrl);

        // Delete images from Supabase
        if (imageUrls.length > 0) {
            await deleteSupabaseImages(imageUrls);
        }

        // Delete image records from the database
        await ImagesModel.destroy({ where: { ProductID: id } });

        // Delete associated variants
        await ProductVariantModel.destroy({ where: { ProductID: id } });

        // Delete the product itself
        await product.destroy();

        res.status(200).json({
            statusCode: 'SUCCESS',
            message: 'Product and associated data deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Failed to delete product and associated data',
            error: error.message
        });
    }
};

//Get filters for products like brand,size,colour
const getFilteredProducts = async (req, res) => {
    try {
        // Extract filter parameters from query
        const filterQuery = req.query.$filter;
        const filters = parseFilterQuery(filterQuery);

        // Prepare filter conditions
        const whereConditions = {};

        if (filters.productName) {
            whereConditions['ProductName'] = { [Op.iLike]: `%${filters.productName}%` };
        }
        if (filters.color) {
            whereConditions['$ProductVariants.Colour.Name$'] = { [Op.iLike]: `%${filters.color}%` };
        }
        if (filters.size) {
            whereConditions['$ProductVariants.Size.Label$'] = { [Op.iLike]: `%${filters.size}%` };
        }
        if (filters.brand) {
            whereConditions['$Brand.BrandName$'] = { [Op.iLike]: `%${filters.brand}%` };
        }

        // Fetch filtered products with associated images and brand details
        const products = await ProductModelss.findAll({
            include: [
                {
                    model: ImagesModel,
                    as: 'ProductImages',
                    attributes: ['ImageUrl']
                },
                {
                    model: BrandModel,
                    as: 'Brand',
                    attributes: ['BrandName']
                },
                {
                    model: ProductVariantModel,
                    as: 'ProductVariants',
                    include: [
                        {
                            model: SizeModel,
                            as: 'Size',
                            attributes: ['Label']
                        },
                        {
                            model: ColourModel,
                            as: 'Colour',
                            attributes: ['Name']
                        }
                    ]
                }
            ],
            attributes: ['ProductName', 'ProductDescription', 'MRP'],
            where: whereConditions,
            distinct: true 
        });

        // Check if products were retrieved
        if (products.length === 0) {
            return res.status(404).json({
                statusCode: 'SUCCESS',
                message: 'No products found',
                Data: []
            });
        }
        
        // Format the products to include relevant details
        const formattedProducts = products.map(product => ({
            ProductName: product.ProductName,
            ProductDescription: product.ProductDescription,
            MRP: product.MRP,
            ImageUrls: product.ProductImages ? product.ProductImages.map(image => image.ImageUrl) : [],
            BrandName: product.Brand ? product.Brand.BrandName : null
        }));

        console.log('Formatted Products:', formattedProducts);

        // Send the response with formatted product details
        res.json({
            statusCode: 'SUCCESS',
            message: 'Products retrieved successfully',
            Data: formattedProducts
        });

    } catch (error) {
        // Handle errors
        console.error('Error fetching products:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Helper function to parse the filter query string
const parseFilterQuery = (filterQuery) => {
    const filters = {};
    if (!filterQuery) return filters;

    const filterParts = filterQuery.split(' and ');
    filterParts.forEach(part => {
        const [key, value] = part.split(' eq ');
        const trimmedKey = key.trim();
        const trimmedValue = value ? value.replace(/'/g, '').trim() : '';

        if (trimmedKey === 'ProductName') {
            filters.productName = trimmedValue;
        } else if (trimmedKey === 'Name') {
            filters.color = trimmedValue;
        } else if (trimmedKey === 'Label') {
            filters.size = trimmedValue;
        } else if (trimmedKey === 'BrandName') {
            filters.brand = trimmedValue;
        }
    });

    return filters;
};

const getVariantProductById = async (req, res) => {
    try {
        const { variantId, productId } = req.params;

        // Fetch the product variant by variant ID and product ID
        const variant = await ProductVariantModel.findOne({
            where: {
                VariantID: variantId, // Use VariantID instead of id
                ProductID: productId, // Ensure the variant is associated with the given product ID
            },
            include: [
                {
                    model: ProductModelss,
                    as: 'ProductDetails',
                    attributes: ['ProductName', 'ProductDescription', 'MRP'],
                },
                {
                    model: SizeModel,
                    as: 'SizeDetails',
                    attributes: ['Label'],
                },
                {
                    model: ColourModel,
                    as: 'ColourDetails',
                    attributes: ['Name'],
                },
            ],
            attributes: ['SellingPrice', 'Quantity'],
        });

        // Check if the variant was found
        if (!variant) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Product variant not found for the given product ID',
                Data: null,
            });
        }

        // Format the variant details to include related product and variant-specific information
        const formattedVariant = {
            ProductName: variant.ProductDetails.ProductName,
            ProductDescription: variant.ProductDetails.ProductDescription,
            MRP: variant.ProductDetails.MRP,
            Size: variant.SizeDetails ? variant.SizeDetails.Label : null,
            Colour: variant.ColourDetails ? variant.ColourDetails.Name : null,
            HexCode: variant.ColourDetails ? variant.ColourDetails.HexCode : null,
            SellingPrice: variant.SellingPrice,
            Quantity: variant.Quantity,
        };

        // Send the response with the formatted variant details
        res.json({
            statusCode: 'SUCCESS',
            message: 'Product variant retrieved successfully',
            Data: formattedVariant,
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching product variant by ID:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching product variant',
            error: error.message,
        });
    }
};

const getVarProdByIdWithVariants = async (req, res) => {
    try {
        const { variantId, productId } = req.params;

        // Fetch the specific variant by variant ID and product ID
        const specificVariant = await ProductVariantModel.findOne({
            where: {
                VariantID: variantId,
                ProductID: productId, // Ensure the variant is associated with the given product ID
            },
            include: [
                {
                    model: ProductModelss,
                    as: 'Product',
                    attributes: ['ProductName', 'ProductDescription', 'MRP'],
                },
                {
                    model: SizeModel,
                    as: 'Size',
                    attributes: ['Label'],
                },
                {
                    model: ColourModel,
                    as: 'Colour',
                    attributes: ['Name'],
                },
            ],
            attributes: ['SellingPrice', 'Quantity'],
        });

        // Fetch all other variants for the same product, excluding the specific variant
        const allVariants = await ProductVariantModel.findAll({
            where: {
                ProductID: productId,
                VariantID: { [Op.ne]: variantId } // Exclude the specific variant
            },
            include: [
                {
                    model: SizeModel,
                    as: 'Size',
                    attributes: ['Label'],
                },
                {
                    model: ColourModel,
                    as: 'Colour',
                    attributes: ['Name', 'HexCode'],
                },
            ],
            attributes: ['VariantID', 'SellingPrice', 'Quantity'],
        });

        // Check if the specific variant was found
        if (!specificVariant) {
            return res.status(404).json({
                statusCode: 'FAILURE',
                message: 'Product variant not found for the given product ID',
                Data: null,
            });
        }
   

        // Format the specific variant details
        const formattedSpecificVariant = {
            ProductName: specificVariant.products.ProductName,
            ProductDescription: specificVariant.products.ProductDescription,
            MRP: specificVariant.products.MRP,
            Size: specificVariant.Size ? specificVariant.SizeDetails.Label : null,
            Colour: specificVariant.Colour ? specificVariant.ColourDetails.Name : null,
           // HexCode: specificVariant.ColourDetails ? specificVariant.ColourDetails.HexCode : null,
            SellingPrice: specificVariant.SellingPrice,
            Quantity: specificVariant.Quantity,
        };

        // Format all other variants
        const formattedAllVariants = allVariants.map(variant => ({
            VariantID: variant.VariantID,
            Size: variant.SizeDetails ? variant.SizeDetails.Label : null,
            Colour: variant.ColourDetails ? variant.ColourDetails.Name : null,
            HexCode: variant.ColourDetails ? variant.ColourDetails.HexCode : null,
            SellingPrice: variant.SellingPrice,
            Quantity: variant.Quantity,
        }));

        // Send the response with the specific variant and all other variants
        res.json({
            statusCode: 'SUCCESS',
            message: 'Product variant and all other variants retrieved successfully',
            Data: {
                specificVariant: formattedSpecificVariant,
                allVariants: formattedAllVariants
            },
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching product variant by ID:', error);
        res.status(500).json({
            statusCode: 'FAILURE',
            message: 'Error fetching product variant',
            error: error.message,
        });
    }
};


/*const updateProductWithImages = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Failed to upload images',
                error: err.message
            });
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Unexpected upload error',
                error: err.message
            });
        }

        const transaction = await sequelize.transaction();

        try {
            let Obj;
            try {
                Obj = JSON.parse(req.body.Data);
            } catch (parseError) {
                return res.status(400).json({
                    statusCode: 'FAILURE',
                    message: 'Invalid JSON format',
                    error: 'Unable to parse request body'
                });
            }

            const {
                TenantID,
                ProductTypeID,
                ProductName,
                ProductDescription,
                BrandID,
                CategoryID,
                MRP,
                ProductDiscount,
                Gender,
                UpdatedBy,
                Colors
            } = Obj;

            if (!TenantID || !ProductTypeID || !ProductName) {
                return res.status(400).json({
                    statusCode: 'FAILURE',
                    message: 'Missing required fields',
                    error: 'TenantID, ProductTypeID, and ProductName are mandatory'
                });
            }

            const existingProduct = await ProductModelss.findOne({
                where: { ProductID: req.params.id, TenantID }
            });

            if (!existingProduct) {
                return res.status(404).json({
                    statusCode: 'FAILURE',
                    message: 'Product not found',
                    error: 'No product exists with the given ID and Tenant'
                });
            }

            const productType = await ProductTypeModel.findOne({ where: { ProductTypeID } });
            if (!productType) {
                return res.status(404).json({
                    statusCode: 'FAILURE',
                    message: 'Invalid product type',
                    error: 'Product type not found'
                });
            }

            const discountPercentage = parseFloat(ProductDiscount.replace('%', '')) / 100;
            const baseSellingPrice = MRP - (MRP * discountPercentage);

            await ProductModelss.update({
                ProductTypeID,
                ProductName,
                ProductDescription,
                BrandID,
                CategoryID,
                Gender,
                MRP,
                ProductDiscount,
                UpdatedBy
            }, {
                where: { ProductID: req.params.id },
                transaction
            });

            for (const [colorIndex, colorData] of Colors.entries()) {
                const { ColourID, Sizes } = colorData;

                if (!Array.isArray(Sizes) || Sizes.length === 0) {
                    return res.status(400).json({
                        statusCode: 'FAILURE',
                        message: `Invalid Sizes data for color index ${colorIndex}`,
                        error: 'Sizes must be a non-empty array'
                    });
                }

                let colorImageUrl = null;
                const colorFiles = req.files.filter(file => file.fieldname === `images_${colorIndex}`);

                if (colorFiles && colorFiles.length > 0) {
                    const existingImages = await ImagesModel.findAll({
                        where: {
                            ProductID: req.params.id,
                            ColourID
                        }
                    });

                    if (existingImages.length === 0) {
                        try {
                            const imageUrls = [];
                            for (const file of colorFiles) {
                                const { publicUrl } = await uploadFileToSupabase(file);
                                imageUrls.push(publicUrl);
                            }
                            colorImageUrl = imageUrls.join(',');
                        } catch (imageError) {
                            console.error('Image Upload Error:', imageError.message);
                            return res.status(500).json({
                                statusCode: 'FAILURE',
                                message: 'Image upload failed',
                                error: imageError.message
                            });
                        }
                    }
                }

                // Check if the color is new
                const existingColorVariants = await ProductVariantModel.findAll({
                    where: { ProductID: req.params.id, ColourID }
                });

                // Process new color if not found
                if (existingColorVariants.length === 0) {
                    for (const sizeData of Sizes) {
                        const { SizeID, Quantity, SellingPrice } = sizeData;

                        const newVariant = await ProductVariantModel.create({
                            ProductID: req.params.id,
                            SizeID,
                            ColourID,
                            Quantity,
                            SellingPrice: SellingPrice || baseSellingPrice,
                            UpdatedBy
                        }, { transaction });

                        if (colorImageUrl) {
                            await ImagesModel.create({
                                TenantID,
                                ProductID: req.params.id,
                                ColourID,
                                VariantID: newVariant.VariantID,
                                ImageUrl: colorImageUrl,
                                IsDefault: true,
                                UpdatedBy,
                                CreatedBy: UpdatedBy
                            }, { transaction });
                        }
                    }
                } else {
                    // Process existing color
                    for (const sizeData of Sizes) {
                        const { SizeID, Quantity, SellingPrice } = sizeData;

                        const existingVariant = await ProductVariantModel.findOne({
                            where: { ProductID: req.params.id, SizeID, ColourID }
                        });

                        if (existingVariant) {
                            await ProductVariantModel.update({
                                Quantity,
                                SellingPrice: SellingPrice || baseSellingPrice,
                                UpdatedBy
                            }, {
                                where: { ProductID: req.params.id, SizeID, ColourID },
                                transaction
                            });
                        } else {
                            const newVariant = await ProductVariantModel.create({
                                ProductID: req.params.id,
                                SizeID,
                                ColourID,
                                Quantity,
                                SellingPrice: SellingPrice || baseSellingPrice,
                                UpdatedBy
                            }, { transaction });

                            if (colorImageUrl) {
                                await ImagesModel.create({
                                    TenantID,
                                    ProductID: req.params.id,
                                    ColourID,
                                    VariantID: newVariant.VariantID,
                                    ImageUrl: colorImageUrl,
                                    IsDefault: true,
                                    UpdatedBy,
                                    CreatedBy: UpdatedBy
                                }, { transaction });
                            }
                        }
                    }
                }
            }

            await transaction.commit();

            return res.status(200).json({
                statusCode: 'SUCCESS',
                message: 'Product updated successfully',
                data: { updatedProduct: existingProduct }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Update Product Error:', error.message);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Failed to update product',
                error: error.message
            });
        }
    });
}; */
const updateProductWithImages = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Failed to upload images',
                error: err.message
            });
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Unexpected upload error',
                error: err.message
            });
        }

        const transaction = await sequelize.transaction();

        try {
            let Obj;
            try {
                Obj = JSON.parse(req.body.Data);
            } catch (parseError) {
                return res.status(400).json({
                    statusCode: 'FAILURE',
                    message: 'Invalid JSON format',
                    error: 'Unable to parse request body'
                });
            }

            const {
                TenantID,
                ProductTypeID,
                ProductName,
                ProductDescription,
                BrandID,
                CategoryID,
                MRP,
                ProductDiscount,
                Gender,
                UpdatedBy,
                Colors
            } = Obj;

            if (!TenantID || !ProductTypeID || !ProductName) {
                return res.status(400).json({
                    statusCode: 'FAILURE',
                    message: 'Missing required fields',
                    error: 'TenantID, ProductTypeID, and ProductName are mandatory'
                });
            }

            const existingProduct = await ProductModelss.findOne({
                where: { ProductID: req.params.id, TenantID }
            });

            if (!existingProduct) {
                return res.status(404).json({
                    statusCode: 'FAILURE',
                    message: 'Product not found',
                    error: 'No product exists with the given ID and Tenant'
                });
            }

            const productType = await ProductTypeModel.findOne({ where: { ProductTypeID } });
            if (!productType) {
                return res.status(404).json({
                    statusCode: 'FAILURE',
                    message: 'Invalid product type',
                    error: 'Product type not found'
                });
            }

            const discountPercentage = parseFloat(ProductDiscount.replace('%', '')) / 100;
            const baseSellingPrice = MRP - (MRP * discountPercentage);

            await ProductModelss.update({
                ProductTypeID,
                ProductName,
                ProductDescription,
                BrandID,
                CategoryID,
                Gender,
                MRP,
                ProductDiscount,
                UpdatedBy
            }, {
                where: { ProductID: req.params.id },
                transaction
            });

            const existingVariants = await ProductVariantModel.findAll({
                where: { ProductID: req.params.id }
            });

            const existingVariantMap = new Map();
            existingVariants.forEach(variant => {
                const key = `${variant.ColourID}-${variant.SizeID}`;
                existingVariantMap.set(key, variant);
            });

            const payloadVariantKeys = new Set();

            for (const [colorIndex, colorData] of Colors.entries()) {
                const { ColourID, Sizes } = colorData;

                if (!Array.isArray(Sizes) || Sizes.length === 0) {
                    return res.status(400).json({
                        statusCode: 'FAILURE',
                        message: `Invalid Sizes data for color index ${colorIndex}`,
                        error: 'Sizes must be a non-empty array'
                    });
                }

                let colorImageUrl = null;
                const colorFiles = req.files.filter(file => file.fieldname === `images_${colorIndex}`);

                if (colorFiles && colorFiles.length > 0) {
                    try {
                        const imageUrls = [];
                        for (const file of colorFiles) {
                            const { publicUrl } = await uploadFileToSupabase(file);
                            imageUrls.push(publicUrl);
                        }
                        colorImageUrl = imageUrls.join(',');
                    } catch (imageError) {
                        console.error('Image Upload Error:', imageError.message);
                        return res.status(500).json({
                            statusCode: 'FAILURE',
                            message: 'Image upload failed',
                            error: imageError.message
                        });
                    }
                }

                for (const sizeData of Sizes) {
                    const { SizeID, Quantity, SellingPrice } = sizeData;
                    const key = `${ColourID}-${SizeID}`;
                    payloadVariantKeys.add(key);

                    const existingVariant = existingVariantMap.get(key);

                    if (existingVariant) {
                        if (
                            existingVariant.Quantity !== Quantity ||
                            existingVariant.SellingPrice !== SellingPrice
                        ) {
                            await ProductVariantModel.update({
                                Quantity,
                                SellingPrice: SellingPrice || baseSellingPrice,
                                UpdatedBy
                            }, {
                                where: { ProductID: req.params.id, SizeID, ColourID },
                                transaction
                            });
                        }
                    } else {
                        const newVariant = await ProductVariantModel.create({
                            ProductID: req.params.id,
                            SizeID,
                            ColourID,
                            Quantity,
                            SellingPrice: SellingPrice || baseSellingPrice,
                            UpdatedBy
                        }, { transaction });

                        if (colorImageUrl) {
                            await ImagesModel.create({
                                TenantID,
                                ProductID: req.params.id,
                                ColourID,
                                VariantID: newVariant.VariantID,
                                ImageUrl: colorImageUrl,
                                IsDefault: true,
                                UpdatedBy,
                                CreatedBy: UpdatedBy
                            }, { transaction });
                        }
                    }
                }
            }

            // Delete variants not in the payload
            for (const [key, variant] of existingVariantMap) {
                if (!payloadVariantKeys.has(key)) {
                    await ProductVariantModel.destroy({
                        where: { VariantID: variant.VariantID },
                        transaction
                    });
                    await ImagesModel.destroy({
                        where: { VariantID: variant.VariantID },
                        transaction
                    });
                }
            }

            await transaction.commit();

            return res.status(200).json({
                statusCode: 'SUCCESS',
                message: 'Product updated successfully',
                data: { updatedProduct: existingProduct }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Update Product Error:', error.message);
            return res.status(500).json({
                statusCode: 'FAILURE',
                message: 'Failed to update product',
                error: error.message
            });
        }
    });
};




module.exports = {
    productWithImages,
    getProductDetails,
    getFilteredProducts,
    getProductById,
    getVariantProductById,
    getVarProdByIdWithVariants,
    updateProductWithImages,
    deleteProductWithImages
};



// Retrieve existing variants for the product. (productUpdate)
// Compare the variants provided in the payload (Colors and Sizes) with the existing variants:
// If a variant exists in the payload but not in the database, it needs to be added.
// If a variant exists in the database but not in the payload, it needs to be deleted (including associated Supabase images).
// If a variant exists in both the payload and the database, it needs to be updated if the data differs.