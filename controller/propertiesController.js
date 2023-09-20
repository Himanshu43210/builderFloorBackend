import properties from "../models/propertiesModel.js";
import AWS from "aws-sdk";
import XLSX from "xlsx";
import asyncs from "async";
import _ from "lodash";
import { map, delay } from "modern-async";
import { USER_ROLE } from "./UsersController.js";
import { BUILDER_FLOOR_ADMIN, CHANNEL_PARTNER } from "../const.js";
import users from "../models/UsersModel.js";
const errors = [
  null,
  "null",
  "",
  undefined,
  "undefined",
  "unknown",
  "Unknown",
  "NULL",
  "UNDEFINED",
  "UNKNOWN",
];
const selectedFields =
  "_id title location accommodation floor size price rating facing possession thumbnails";

const convertToCardData = (datFromDb) => {
  return datFromDb?.map((item) => {
    return {
      _id: item._id,
      title: item.title,
      location: item.location,
      accommodation: item.accommodation,
      floor: item.floor,
      size: item.size,
      price: item.price,
      rating: item.rating || 5,
      facing: item.facing,
      possession: item.possession,
      thumbnails: item.thumbnails?.[0],
    };
  });
};
const Edit_Update = async (req, res) => {
  const { _id, ...data } = req.body;
  const newData = {
    ...data,
    city: data.city,
    location: data.location,
    facing: data.facing,
    accommodation: data.accommodation,
    floor: data.floor,
    possession: data.possession,
    category: data.category,
    state: data.state,
    imageType: data.imageType,
  };
  try {
    if (_id) {
      // If _id is present, update the existing document
      const existingProperty = await properties.findByIdAndUpdate(
        _id,
        newData,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found." });
      }
      return res.json(existingProperty);
    } else {
      const newProperty = new properties(newData);
      await newProperty.save();
      return res.json(newProperty);
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to save the property." });
  }
};

const approveProperty = (req, res) => {
  try {
    const { _id, needApprovalBy } = req.body;
    const query = { _id };
    const update = {
      needApprovalBy,
    };
    properties.updateOne(query, update, (err, result) => {
      if (err) throw err;
    });
    return res.status(200).json({ status: "Approved Successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save the property." });
  }
};

const searchPropertiesData = async (req, res) => {
  // Parse the JSON payload from the request
  const criteria = req.body;
  let page = Number(criteria.page) || 0;
  const limit = Number(criteria.limit) || 10;
  const {
    budget,
    Corner,
    Park,
    accommodation,
    city,
    facing,
    floor,
    location,
    possession,
    sortBy,
  } = req.body;
  const query = {
    $or: [
      { needApprovalBy: { $eq: "Approved" } },
      { needApprovalBy: { $exists: false } },
    ],
  };
  // Construct the Mongoose query object
  // const query = { needApprovalBy: "Approved" };

  // if (criteria.city) {
  //   // query.city = { $regex: criteria.city.value, $options: "i" };
  // }

  if (budget) {
    query.price = { $gte: budget[0], $lte: budget[1] };
  }
  if (accommodation) {
    query.accommodation = accommodation;
  }
  if (Corner) {
    query.corner = true;
  }
  if (Park) {
    query.parkFacing = true;
  }
  if (city) {
    query.city = { $regex: city, $options: "i" };
  }
  if (facing) {
    query.facing = facing;
  }
  if (floor) {
    query.floor = floor;
  }
  if (location) {
    query.location = location;
  }
  if (possession) {
    query.possession = possession;
  }

  if (req.query.search) {
    query["$or"] = await serchPropertyData(req.query.search)
  }
  // Add more conditions for other fields in a similar manner

  // Sorting
  let sortQuery =
    sortBy === "Price High to Low" ? { price: -1 } : { default_sort_column: 1 };
  try {
    // Execute the Mongoose query
    let skip = (page) * limit;
    const data = await properties
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .select(selectedFields);
    // Return the results as JSON
    const totalItems = await properties.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("Error searching properties:", err);
    res
      .status(500)
      .json({ error: "An error occurred while searching properties" });
  }
};

const getHomeData = async (req, res) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    const { city } = req.query;
    const queryObject = {};
    if (city) {
      queryObject.city = { $regex: city, $options: "i" };
    }
    let skip = (page) * limit;
    let data = await properties.find(queryObject).skip(skip).limit(limit);
    // const totalDocuments = await properties.countDocuments();
    // const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).json(convertToCardData(data));
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getpropertiesList = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) < 10 ? 10 : Number(req.query.limit);
    const { sortType, sortColumn } = req.query;
    const queryObject = {};
    if (req.query.search) {
      queryObject["$or"] = await serchPropertyData(req.query.search)
    }
    let skip = (page) * limit;

    let data = await properties.find(queryObject).skip(skip).limit(limit);
    const totalDocuments = await properties.countDocuments(queryObject);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getAdminPropertiesList = async (req, res, next) => {
  try {
    let {
      budget,
      accommodation,
      Corner,
      Park,
      city,
      facing,
      floor,
      location,
      possession,
      id,
      role,
      sortType,
      sortColumn,
    } = req.body;
    id = req.query.id;
    role = req.query.role;
    const query = {};
    if (budget) {
      query.price = { $gte: budget[0], $lte: budget[1] };
    }
    if (accommodation) {
      query.accommodation = accommodation;
    }
    if (Corner) {
      query.corner = true;
    }
    if (Park) {
      query.parkFacing = true;
    }
    if (city) {
      query.city = { $regex: city, $options: "i" };
    }
    if (facing) {
      query.facing = facing;
    }
    if (floor) {
      query.floor = floor;
    }
    if (location) {
      query.location = location;
    }
    if (possession) {
      query.possession = possession;
    }

    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    console.log(role, id);
    if (role === USER_ROLE[BUILDER_FLOOR_ADMIN]) {
    } else {
      let search = [];
      if (req.query.search) {
        search = await serchPropertyData(req.query.search)
      }
      query["$or"] = [
        { parentId: id },
        { needApprovalBy: id },
        { contactId: id },
        ...search
      ];
    }
    let skip = (page) * limit;
    // Adding sort functionality
    let data = await properties
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortColumn]: sortType === "desc" ? -1 : 1 });

    const totalDocuments = await properties.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const searchproperties = async (req, res, next) => {
  const { city } = req.body;
  const queryObject = {};

  if (city) {
    queryObject.city = { $regex: city, $options: "i" };
  }

  const data = await properties.find(queryObject);

  res.status(200).json(data);
};

const filterproperties = async (req, res, next) => {
  const filter = JSON.parse(req.query.filter);
  if (!filter) {
    return res.status(400).json({ error: "No filter provided" });
  }
  let query = {};
  try {
    if (filter.accommodation && filter.accommodation.length > 0) {
      query.accommodation = { $in: filter.accommodation };
    }

    if (filter.categories && filter.categories.length > 0) {
      query.category = { $in: filter.categories };
    }

    if (filter.cities && filter.cities.length > 0) {
      query.city = { $in: filter.cities };
    }

    if (filter.facing && filter.facing.length > 0) {
      query.facing = { $in: filter.facing };
    }
    //filter= {"accommodation":["3 BHK"],"categories":[],"cities":["KOLKATA","MUMBAI"],"facing":[],"floors":[],"locations":[],"possession":[],"possession":[],"priceRange":[],"sizeRange":[]}

    if (filter.floors && filter.floors.length > 0) {
      query.floor = { $in: filter.floors };
    }

    if (filter.possession && filter.possession.length > 0) {
      query.possession = { $in: filter.possession };
    }

    if (filter.locations && filter.locations.length > 0) {
      query.location = { $in: filter.locations };
    }

    if (filter.priceRange && filter.priceRange.length === 2) {
      const minPrice = filter.priceRange[0];
      const maxPrice = filter.priceRange[1];
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (filter.sizeRange && filter.sizeRange.length > 0) {
      query.size = { $in: filter.sizeRange };
    }

    let filteredProperties = await properties.find(query);

    res.send(filteredProperties);
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const updatepropertiesByID = async (req, res, next) => {
  try {
    let id = req.body._id;
    let updateData = req.body;
    let data = await properties.findById(id);

    if (data) {
      const updatedData = await properties.findByIdAndUpdate(id, {
        $set: updateData,
      });
      return res.status(200).json({ messgae: "properties updated" });
    }

    let newModel = new properties(req.body);
    const newData = await newModel.save();
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const getpropertiesById = async (req, res, next) => {
  try {
    let id = req.query.id;
    let data = await properties.findById(id);
    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const deletepropertiesById = async (req, res, next) => {
  try {
    let id = req.query.id;
    const updatedData = await properties.findByIdAndRemove(id);
    res.status(200).json({ messgae: "properties deleted" });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const deletepropertiesByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await properties.findByIdAndRemove(id);
    if (!result) {
      return res.status(404).json({ message: "properties not found" });
    }
    res.status(200).json({ message: "properties deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "An error Occurred" });
  }
};

const storeproperties = async (req, res, next) => {
  try {
    let newModel = new properties(req.body);
    const data = await newModel.save();
    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const updateBulkproperties = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          const id = data[x].id;
          delete data[x].id;
          await properties.findByIdAndUpdate(id, { $set: data[x] });
        }
      });
    res.status(200).json({ message: "Bulk Update Done" });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const insertBulkproperties = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          let newModel = new properties(data[x]);
          await newModel.save();
        }
      });
    res.status(200).json({ message: "Bulk Insert Done" });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const folderNamesMapping = {
  threeSixtyImages: "360 Image",
  normalImageFile: "Normal Image",
  thumbnailFile: "Thumbnail Image",
  videoFile: "Video File",
  layoutFile: "Layout File",
  virtualFile: "Virtual File",
};

const apiToModelKeyMapping = {
  threeSixtyImages: "images",
  normalImageFile: "normalImages",
  thumbnailFile: "thumbnails",
  videoFile: "videos",
  layoutFile: "layouts",
  virtualFile: "virtualFiles",
};

function joinS3Path(...args) {
  return args.join("/");
}

const generateFolderName = (data) => {
  const folderPath = [
    "upload/photos",
    data.plotNumber + data.location,
    data.floor,
  ].join("/");
  return folderPath;
};

async function ensureFolderStructure(s3, mainFolderPath, subFolderPath = "") {
  const fullPath = [mainFolderPath, subFolderPath].join("/");
  const parts = fullPath.split("/");
  let currentPath = "";
  for (const part of parts) {
    if (currentPath === "") {
      currentPath = part;
    } else {
      currentPath = [currentPath, part].join("/");
    }
    // Only putObject if currentPath is not empty
    if (currentPath !== "") {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${currentPath}/`,
        Body: "",
      };
      try {
        await s3.putObject(params).promise();
        // You can add a verification step here if needed
      } catch (err) {
        console.error(`Error creating folder ${currentPath}:`, err);
        throw new Error(`Failed to create folder ${currentPath} in S3`);
      }
    }
  }
}

const uploadProperties = async (req, res, next) => {
  try {
    let { _id, ...otherData } = req.body;
    // adding upload/ before folder
    const folder = generateFolderName(otherData);
    const s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });

    let uploadData = { ...otherData };

    for (let fileKey in folderNamesMapping) {
      if (req.files[fileKey] && req.files[fileKey].length) {
        const specificFolderPath = folderNamesMapping[fileKey];
        await ensureFolderStructure(s3, folder, specificFolderPath);
        const fileUrls = await uploadOnS3(
          req.files[fileKey],
          joinS3Path(folder, specificFolderPath)
        );

        // Mapping keys
        let mappedKey = fileKey;
        if (fileKey in apiToModelKeyMapping) {
          mappedKey = apiToModelKeyMapping[fileKey];
        }
        uploadData[mappedKey] = fileUrls; // Assign the URLs to the correct key in uploadData
      }
    }

    const newProperty = await new properties(uploadData).save();
    return res.json({
      message: "Data updated successfully.",
      result: newProperty,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ message: "Error Upload", error: err.message });
  }
};

const uploadOnS3 = async (files, folderPath) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

  const fileUrls = await Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        const s3Key = joinS3Path(
          folderPath,
          file.originalname.replace(/ /g, "_")
        );
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.error("Error uploading to S3:", err);
            reject(err);
          } else {
            resolve(data.Location); // Return the file URL
          }
        });
      });
    })
  );

  return fileUrls;
};

const importProperties = async (req, res) => {
  try {
    let rejected = [];
    let inserted = 0;
    let uploaded = 0;
    let data = convertCsvToJson(req.file);
    if (
      !data[0].hasOwnProperty("Plot Number") ||
      !data[0].hasOwnProperty("Location") ||
      !data[0].hasOwnProperty("Floor")
    ) {
      return res.json({ message: "Invalid file, please upload a valid file." });
    } else {
      function getoperations(e, callback) {
        callback(null, {
          updateOne: {
            filter: {
              plotNumber: e["Plot Number"],
              location: e["Location"],
              floor: e["Floor"],
            },
            update: {
              $set: {
                city: e["City"],
                location: e["Location"],
                plotNumber: e["Plot Number"],
                size: e["Size"],
                facing: e["Facing"],
                accommodation: e["Accommodation"],
                parkFacing: e["Park Facing"] == "YES" ? true : false,
                corner: e["Corner"] == "YES" ? true : false,
                floor: e["Floor"],
                possession: e["Possession"],
                title: e["1st Page Title"],
                detailTitle: e["2 Page Title"],
                description: e["Description"] || "",
                builderName: e["Builder Name"],
                builderContact: e["Builder Contact Number"],
                price: parseFloat(e["Price"])
                  ? parseFloat(e["Price"]) * 10000000
                  : "Price on Request",
                address: e["Address"],
                category: "PLOT",
                imageType: e["Image/Video/360 Image"],
                folder: e["FOLDER NAME"],
                channelPartner: e["Channel Partner Name"],
                channelContact: e["Channel Contact Number"],
                thumbnailName: e["THUMBNAIL IMAGE NAME"],
              },
            },
            upsert: true,
          },
        });
      }

      let tempData = _.chunk(data, 500);

      let result = await map(tempData, async (v) => {
        let operations = [];
        asyncs.map(v, getoperations, function (err, results) {
          if (err) {
            console.log(err);
          } else {
            operations = results;
          }
        });

        const finalOperations = operations.filter((e) => {
          return (
            !errors.includes(e.updateOne.filter["plotNumber"]) &&
            !errors.includes(e.updateOne.filter["location"]) &&
            !errors.includes(e.updateOne.filter["floor"])
          );
        });

        let rejectData = v.filter((e) => {
          return (
            errors.includes(e["Plot Number"]) ||
            errors.includes(e["Location"]) ||
            errors.includes(e["Floor"])
          );
        });
        Array.prototype.push.apply(rejected, rejectData);
        await delay();
        let response = await properties.bulkWrite(finalOperations);
        return response;
      });

      inserted = result.reduce((acc, e) => {
        let val = e?.nUpserted || e?.result?.nUpserted;
        return acc + val;
      }, 0);
      uploaded = result.reduce((acc, e) => {
        let val = e?.nModified || e?.result?.nModified;
        return acc + val;
      }, 0);
      return res.status(200).json({
        data: [],
        rejected: rejected,
        inserted: inserted || 0,
        uploaded: uploaded || 0,
        message: "Data uploaded",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const convertCsvToJson = (file) => {
  let workbook = XLSX.read(file.buffer, { type: "buffer" });
  var sheet_name_list = workbook.SheetNames;
  const options = { defval: "" };
  const data = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheet_name_list[0]],
    options
  );
  return data;
};

const getPropertiesByIds = async (req, res) => {
  try {
    const data = await properties
      .find({ _id: req.body.ids })
      .select(selectedFields);
    return res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getPropertiesListingCounts = async (req, res) => {
  try {
    const total = await properties.countDocuments({
      parentId: req.query.userId,
    });
    const approved = await properties.countDocuments({
      parentId: req.query.userId,
      needApprovalBy: "Approved",
    });
    const pending = await properties.countDocuments({
      parentId: req.query.userId,
      needApprovalBy: { $ne: "Approved" },
    });
    const data = [
      { label: "Total Listings", value: total },
      { label: "Approved Listings", value: approved },
      { label: "Pending Listings", value: pending },
    ];
    return res.status(200).json({ response: data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const rejectProperty = async (req, res, next) => {
  try {
    const data = {};
    const {
      rejectedByBFAdmin,
      rejectedByBFAdminComments,
      rejectedByCP,
      rejectedByCPComments,
      userId,
      id,
    } = req.body;
    if (!id || !userId || (!rejectedByBFAdmin && !rejectedByCP)) {
      return res.status(404).json({ message: "All fields are required." });
    }
    if (rejectedByBFAdmin) {
      data.rejectedByBFAdmin = rejectedByBFAdmin;
      data.rejectedByBFAdminComments = rejectedByBFAdminComments;
      data.rejectedByCP = "";
      data.rejectedByCPComments = "";
    } else {
      data.rejectedByCP = rejectedByCP;
      data.rejectedByCPComments = rejectedByCPComments;

      data.rejectedByBFAdmin = "";
      data.rejectedByBFAdminComments = "";
    }
    data.needApprovalBy = "Rejected";
    const user = await users.findById(userId);
    if (user) {
      await properties.findByIdAndUpdate({ _id: id }, data);
      return res
        .status(200)
        .json({ message: "Property status updated successfully." });
    } else {
      return res.status(404).json({ message: "Invalid useId" });
    }
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getPropertiesCountsByUserId = async (req, res) => {
  try {
    const data = await users.aggregate([
      {
        $match: {
          parentId: req.query.userId,
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "_id",
          foreignField: "parentId",
          as: "user_properties",
        },
      },
      {
        $addFields: {
          approved_count: {
            $sum: {
              $map: {
                input: "$user_properties",
                as: "prop",
                in: {
                  $cond: [{ $eq: ["$$prop.needApprovalBy", "Approved"] }, 1, 0],
                },
              },
            },
          },
          pending_count: {
            $sum: {
              $map: {
                input: "$user_properties",
                as: "prop",
                in: {
                  $cond: [{ $ne: ["$$prop.needApprovalBy", "Approved"] }, 1, 0],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          city: { $first: "$companyAddress" },
          phoneNumber: { $first: "$phoneNumber" },
          total_count: { $sum: { $size: "$user_properties" } },
          approved_count: { $first: "$approved_count" },
          pending_count: { $first: "$pending_count" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          total_count: 1,
          approved_count: 1,
          pending_count: 1,
          city: 1,
          phoneNumber: 1,
        },
      },
    ]);
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ messgae: error.message });
  }
};

const getPropertiesListByUserId = async (req, res, next) => {
  try {
    let query = { parentId: req.query.userId }
    if (req.query.search) {
      query["$or"] = await serchPropertyData(req.query.search)
    }
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    let skip = (page) * limit;

    let data = await properties
      .find(query)
      .skip(skip)
      .limit(limit);

    const totalDocuments = await properties.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getApprovalProperties = async (req, res, next) => {
  try {
    let query = { needApprovalBy: req.query.id }
    if (req.query.search) {
      query["$or"] = await serchPropertyData(req.query.search)
    }
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    let skip = (page) * limit;
    let data = await properties
      .find(query).populate("parentId")
      .skip(skip)
      .limit(limit);

    const totalDocuments = await properties.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const getApprovedPropertiesList = async (req, res, next) => {
  try {
    let query = { needApprovalBy: "Approved" }
    if (req.query.search) {
      query["$or"] = await serchPropertyData(req.query.search)
    }
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    let skip = (page) * limit;
    let data = await properties.find(query)
      .skip(skip)
      .limit(limit);
    const totalDocuments = await properties.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).json({
      data,
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const serchPropertyData = async (search) => {
  const regex = new RegExp(search, 'i');
  const fieldsToSearch = [
    'state',
    'city',
    'location',
    'plotNumber',
    'size',
    'sizeType',
    'floor',
    'accommodation',
    'facing',
    'possession',
    'builderName',
    'builderContact',
    'title',
    'detailTitle',
    'description',
    'needApprovalBy',
  ];
  return fieldsToSearch.map((field) => ({ [field]: regex }));
}

export default {
  getpropertiesList,
  getAdminPropertiesList,
  storeproperties,
  getpropertiesById,
  deletepropertiesById,
  updatepropertiesByID,
  updateBulkproperties,
  insertBulkproperties,
  searchproperties,
  filterproperties,
  getHomeData,
  searchPropertiesData,
  Edit_Update,
  approveProperty,
  uploadProperties,
  importProperties,
  getPropertiesByIds,
  getPropertiesListingCounts,
  rejectProperty,
  getPropertiesCountsByUserId,
  getPropertiesListByUserId,
  getApprovedPropertiesList,
  getApprovalProperties,
};
