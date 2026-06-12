// controllers/studyMaterialController.js
import StudyMaterial from "../models/studyMaterialModel.js";
import cloudinary from "../utils/cloudinary/cloudinary.js";
import streamifier from 'streamifier'; // need to install
import User from "../models/studentsmodel.js";
// import redis from "../config/redis.js";

// upload helper
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "study-materials",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};
//calculate file size helper
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
};
//capitalizeFirstLetter
const capitalizeFirstLetter = (text) => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
};


// ================ REDIS HELPERS =====================

// const CACHE_EXPIRY = 60 * 5; // 5 mins

// const clearStudyMaterialCache = async () => {
//   try {
//     const keys = await redis.keys("studyMaterials:*");

//     if (keys.length > 0) {
//       await redis.del(keys);
//     }

//     const singleKeys = await redis.keys(
//       "studyMaterial:*"
//     );

//     if (singleKeys.length > 0) {
//       await redis.del(singleKeys);
//     }
//   } catch (error) {
//     console.error(
//       "Redis Cache Clear Error:",
//       error
//     );
//   }
// };

// const clearWishlistCache = async (userId) => {
//   try {
//     await redis.del(`wishlist:${userId}`);
//     await redis.del(`wishlistData:${userId}`);
//   } catch (error) {
//     console.error(
//       "Wishlist Cache Clear Error:",
//       error
//     );
//   }
// };

// ========================================================



// CREATE
export const createStudyMaterial = async (req, res) => {
  let uploadedFiles = [];

  try {
    const {
      title,
      description,
      type,
      class: className,
      subject,
      status,
      availableFor,
      url,
    } = req.body;

    const document = req.files?.document?.[0];
    const images = req.files?.images || [];

    const hasDocument = !!document;
    const hasImages = images.length > 0;
    const hasUrl = !!url;

    // validation: required fields
    if (!title || !description || !type || !className || !subject) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // must provide at least one source
    if (!hasDocument && !hasImages && !hasUrl) {
      return res.status(400).json({
        success: false,
        message: "Provide either one document, up to 10 images, or a URL",
      });
    }

    // allow only ONE type
    const uploadSources = [hasDocument, hasImages, hasUrl].filter(Boolean).length;

    if (uploadSources > 1) {
      return res.status(400).json({
        success: false,
        message: "Upload either a document, images, or a URL only",
      });
    }

    // image limit
    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
      });
    }

    // URL case
    if (hasUrl) {
      uploadedFiles.push({
        url,
        public_id: null,
        fileName: url,
        fileSize: null,
      });
    }

    // document upload
    if (hasDocument) {
      const uploaded = await uploadToCloudinary(document);

      uploadedFiles.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        fileName: document.originalname,
        fileSize: formatFileSize(document.size),
      });
    }

    // images upload (parallel for speed)
    if (hasImages) {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          const uploaded = await uploadToCloudinary(image);

          return {
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
            fileName: image.originalname,
            fileSize: formatFileSize(image.size),
          };
        })
      );

      uploadedFiles.push(...uploadedImages);
    }

    // get user full name safely
    let fullname;

    const user = await User.findById(req.user?._id);

    if (user) {
      fullname = user?.studentInfo?.personalInfo?.fullName;
    }

    // save DB
    const material = await StudyMaterial.create({
      title,
      description,
      type: capitalizeFirstLetter(type),
      class: capitalizeFirstLetter(className),
      subject: capitalizeFirstLetter(subject),
      availableFor: capitalizeFirstLetter(availableFor),
      uploadedBy: fullname || req.user?.account?.username,
      uploadDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status,
      files: uploadedFiles,
    });
    // await clearStudyMaterialCache();   // delete the cache in redis uncomment this when using redis

    return res.status(201).json({
      success: true,
      message: "Study material uploaded successfully",
      data: material,
    });
  } catch (error) {
    // cleanup cloudinary uploads on failure
    for (const file of uploadedFiles) {
      if (file.public_id) {
        try {
          await cloudinary.uploader.destroy(file.public_id);
        } catch (err) {
          console.error("Cloudinary cleanup failed:", err.message);
        }
      }
    }

    console.error("Create Study Material Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload study material",
      error: error.message,
    });
  }
};

// GET ALL STUDY MATERIALS
export const getAllStudyMaterials = async (req, res) => {
  try {
    let {
      search,
      type,
      subject,
      availableFor,
      status,
      class: className,
      sortBy = "createdAt",
      sort = "Newest First",
    } = req.query;

    // normalize filters
    const normalizeFilter = (value) =>
      value?.toLowerCase() === "all" ? "" : value;

    type = normalizeFilter(type);
    subject = normalizeFilter(subject);
    status = normalizeFilter(status);
    className = normalizeFilter(className);
    availableFor = normalizeFilter(availableFor);

    // filter object
    const filter = {};

    // search
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // exact filters
    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;
    if (className) filter.class = className;
    if (availableFor)
      filter.availableFor = availableFor;

    // sorting
    // sorting direction
    let sortOrder = -1; // default newest first

    if (sort === "Oldest First") {
      sortOrder = 1;
    } else if (sort === "Newest First") {
      sortOrder = -1;
    }

    // sorting field fallback
    const sortField = sortBy || "createdAt";

    const sortOptions = {
      [sortField]: sortOrder,
    };
    

    // fetch data
    const materials = await StudyMaterial.find(
      {...filter,active:true}
    ).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    console.error(
      "Get All Study Materials Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch study materials",
      error: error.message,
    });
  }
};

//GET ALL STUDY MATERIALS with redis
// export const getAllStudyMaterials = async (
//   req,
//   res
// ) => {
//   try {
//     const cacheKey = `studyMaterials:${JSON.stringify(
//       req.query
//     )}`;

//     // CHECK CACHE
//     const cachedData = await redis.get(cacheKey);

//     if (cachedData) {
//       return res.status(200).json({
//         success: true,
//         source: "cache",
//         ...JSON.parse(cachedData),
//       });
//     }

//     let {
//       search,
//       type,
//       subject,
//       availableFor,
//       status,
//       class: className,
//       sortBy = "createdAt",
//       sort = "Newest First",
//     } = req.query;

//     const normalizeFilter = (value) =>
//       value?.toLowerCase() === "all"
//         ? ""
//         : value;

//     type = normalizeFilter(type);
//     subject = normalizeFilter(subject);
//     status = normalizeFilter(status);
//     className = normalizeFilter(className);
//     availableFor = normalizeFilter(
//       availableFor
//     );

//     const filter = {};

//     if (search) {
//       filter.$or = [
//         {
//           title: {
//             $regex: search,
//             $options: "i",
//           },
//         },
//         {
//           description: {
//             $regex: search,
//             $options: "i",
//           },
//         },
//       ];
//     }

//     if (type) filter.type = type;
//     if (subject) filter.subject = subject;
//     if (status) filter.status = status;
//     if (className) filter.class = className;

//     if (availableFor) {
//       filter.availableFor = availableFor;
//     }

//     let sortOrder = -1;

//     if (sort === "Oldest First") {
//       sortOrder = 1;
//     }

//     const sortOptions = {
//       [sortBy]: sortOrder,
//     };

//     const materials =
//       await StudyMaterial.find(filter).sort(
//         sortOptions
//       );

//     const responseData = {
//       count: materials.length,
//       data: materials,
//     };

//     // SAVE CACHE
//     await redis.set(
//       cacheKey,
//       JSON.stringify(responseData),
//       "EX",
//       CACHE_EXPIRY
//     );

//     return res.status(200).json({
//       success: true,
//       source: "database",
//       ...responseData,
//     });
//   } catch (error) {
//     console.error(
//       "Get All Study Materials Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch study materials",
//       error: error.message,
//     });
//   }
// };

// GET SINGLE
export const getStudyMaterialById = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: material,
    });

  } catch (error) {
    console.error("Get Study Material By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch study material",
      error: error.message,
    });
  }
};

// GET SINGLE WITH REDIS
// export const getStudyMaterialById = async (
//   req,
//   res
// ) => {
//   try {
//     const cacheKey = `studyMaterial:${req.params.id}`;

//     const cachedData = await redis.get(cacheKey);

//     if (cachedData) {
//       return res.status(200).json({
//         success: true,
//         source: "cache",
//         data: JSON.parse(cachedData),
//       });
//     }

//     const material =
//       await StudyMaterial.findById(
//         req.params.id
//       );

//     if (!material) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Study material not found",
//       });
//     }

//     await redis.set(
//       cacheKey,
//       JSON.stringify(material),
//       "EX",
//       CACHE_EXPIRY
//     );

//     return res.status(200).json({
//       success: true,
//       source: "database",
//       data: material,
//     });
//   } catch (error) {
//     console.error(
//       "Get Study Material By ID Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch study material",
//       error: error.message,
//     });
//   }
// };

// UPDATE
export const updateStudyMaterial = async (req, res) => {
  let uploadedFiles = [];

  try {
    const {
      title,
      description,
      type,
      class: className,
      subject,
      availableFor,
      status,
      url,
    } = req.body;

    const document = req.files?.document?.[0];
    const images = req.files?.images || [];

    const hasDocument = !!document;
    const hasImages = images.length > 0;
    const hasUrl = !!url;

    // find existing material
    const existingMaterial = await StudyMaterial.findById(req.params.id);

    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }

    // only one source allowed
    const uploadSources = [hasDocument, hasImages, hasUrl].filter(Boolean).length;

    if (uploadSources > 1) {
      return res.status(400).json({
        success: false,
        message: "Upload either a document, images, or a URL only",
      });
    }

    // image limit
    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
      });
    }

    // ----------------------------
    // Upload New Content First
    // ----------------------------

    // URL update
    if (hasUrl) {
      uploadedFiles.push({
        url,
        public_id: null,
        fileName: url,
        fileSize: null,
      });
    }

    // document upload
    if (hasDocument) {
      const uploaded = await uploadToCloudinary(document);

      uploadedFiles.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        fileName: document.originalname,
        fileSize: formatFileSize(document.size),
      });
    }

    // image uploads
    if (hasImages) {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          const uploaded = await uploadToCloudinary(image);

          return {
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
            fileName: image.originalname,
            fileSize: formatFileSize(image.size),
          };
        })
      );

      uploadedFiles.push(...uploadedImages);
    }

    // ----------------------------
    // Delete Old Files AFTER Success
    // ----------------------------

    if (uploadedFiles.length > 0) {
      for (const oldFile of existingMaterial.files) {
        if (oldFile.public_id) {
          try {
            await cloudinary.uploader.destroy(oldFile.public_id);
          } catch (err) {
            console.error(
              "Failed to delete old file:",
              err.message
            );
          }
        }
      }
    }

    // ----------------------------
    // Update Payload
    // ----------------------------

    const updatedData = {
      title,
      description,
      type: type
        ? capitalizeFirstLetter(type)
        : existingMaterial.type,

      class: className
        ? capitalizeFirstLetter(className)
        : existingMaterial.class,

      subject: subject
        ? capitalizeFirstLetter(subject)
        : existingMaterial.subject,

      availableFor: availableFor
        ? capitalizeFirstLetter(availableFor)
        : existingMaterial.availableFor,

      status: status || existingMaterial.status,
    };

    // replace files only if new uploaded
    if (uploadedFiles.length > 0) {
      updatedData.files = uploadedFiles;
    }

    const updatedMaterial = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );
    // await clearStudyMaterialCache();   // delete the cache in redis uncomment this when using redis

    return res.status(200).json({
      success: true,
      message: "Study material updated successfully",
      data: updatedMaterial,
    });
  } catch (error) {
    // cleanup newly uploaded files
    for (const file of uploadedFiles) {
      if (file.public_id) {
        try {
          await cloudinary.uploader.destroy(file.public_id);
        } catch (err) {
          console.error(
            "Cleanup failed:",
            err.message
          );
        }
      }
    }

    console.error("Update Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update study material",
      error: error.message,
    });
  }
};

// DELETE
export const deleteStudyMaterial = async (req, res) => {

  try {

    const material = await StudyMaterial.findById(
      req.params.id
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }

    //delete all cloudinary files
    // for (const file of material.files) {

    //   if (file.public_id) {
    //     await cloudinary.uploader.destroy(
    //       file.public_id
    //     );
    //   }
    // }
    // // delete db document
    // await StudyMaterial.findByIdAndDelete(
    //   req.params.id
    // );

    // ================== soft delete ===================

    const updatedDoc = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    // await clearStudyMaterialCache();   // delete the cache in redis uncomment this when using redis
    return res.status(200).json({
      success: true,
      message: "Study material deleted successfully",
    });

  } catch (error) {

    console.error("Delete Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete study material",
      error: error.message,
    });
  }
};


// ================= ADD TO WISHLIST =================

export const addWishlist = async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }

    // check material exists
    const material = await StudyMaterial.findById(materialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }

    // add to wishlist without duplicates
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $addToSet: {
          "account.wishlist": materialId,
        },
      },
      { new: true }
    ).populate("account.wishlist");
    // await clearWishlistCache(req.user._id);   // delete the cache in redis uncomment this when using redis
    return res.status(200).json({
      success: true,
      message: "Added to wishlist",
      data: user.wishlist,
    });
  } catch (error) {
    console.error("Add Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add wishlist",
      error: error.message,
    });
  }
};

// ================= GET WISHLIST =================
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);

    const wishlists = user?.account?.wishlist || [];

    return res.status(200).json({
      success: true,
      count: wishlists.length,
      data: wishlists,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};
// GET WISHLIst with Redis
// export const getWishlist = async (
//   req,
//   res
// ) => {
//   try {
//     const cacheKey = `wishlist:${req.user._id}`;

//     const cachedData = await redis.get(
//       cacheKey
//     );

//     if (cachedData) {
//       return res.status(200).json({
//         success: true,
//         source: "cache",
//         ...JSON.parse(cachedData),
//       });
//     }

//     const user = await User.findById(
//       req.user?._id
//     );

//     const wishlists =
//       user?.account?.wishlist || [];

//     const responseData = {
//       count: wishlists.length,
//       data: wishlists,
//     };

//     await redis.set(
//       cacheKey,
//       JSON.stringify(responseData),
//       "EX",
//       CACHE_EXPIRY
//     );

//     return res.status(200).json({
//       success: true,
//       source: "database",
//       ...responseData,
//     });
//   } catch (error) {
//     console.error(
//       "Get Wishlist Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch wishlist",
//       error: error.message,
//     });
//   }
// };

// GET THE WISHLIST ALONG WITH THE DATA
export const getWishlistData = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id)
      .populate("account.wishlist");

    const wishlists = user?.account?.wishlist || [];

    return res.status(200).json({
      success: true,
      count: wishlists.length,
      data: wishlists,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

// ================= REMOVE FROM WISHLIST =================

export const removeWishlist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $pull: {
          "account.wishlist": id,
        },
      },
      { new: true }
    ).populate("account.wishlist");

    // await clearWishlistCache(req.user._id);   // delete the cache in redis uncomment this when using redis
    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      data: user.account.wishlist,
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove wishlist",
      error: error.message,
    });
  }
};