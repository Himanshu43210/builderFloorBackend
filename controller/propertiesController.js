import mongoose from "mongoose";
import properties from "../models/propertiesModel.js";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import asyncs from "async";
import _ from "lodash";
import { map, delay } from "modern-async";
const errors = [null, "null", "", undefined, "undefined", "unknown", "Unknown", "NULL", "UNDEFINED", "UNKNOWN"];
const selectedFields = "_id title sectorNumber accommodation floor size price rating facing possession thumbnails"

const convertToCardData = (datFromDb) => {
  return datFromDb?.map((item) => {
    return {
      _id: item._id,
      title: item.title,
      sectorNumber: item.sectorNumber,
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
    sectorNumber: data.sectorNumber,
    facing: data.facing,
    accommodation: data.accommodation,
    floor: data.floor,
    possession: data.possession,
    category: data.category,
    state: data.state,
    imageType: data.imageType,
  };
  console.log(newData);
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
    console.log("Inside Approve Properties");
    const { _id, needApprovalBy } = req.body;
    console.log(_id, needApprovalBy);
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
  let page = Number(criteria.page) || 1;
  const limit = Number(criteria.limit) || 10;
  const { budget, Corner, Park, accommodation, city, facing, floor, location, possession, sortBy } = req.body;
  const query = {};
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
    query.city = city;
  }
  if (facing) {
    query.facing = facing;
  }
  if (floor) {
    query.floor = floor;
  }
  if (location) {
    query.sectorNumber = location;
  }
  if (possession) {
    query.possession = possession;
  }

  // Add more conditions for other fields in a similar manner

  // Sorting
  let sortQuery = sortBy === "Price High to Low" ? { price: -1 } : { default_sort_column: 1 };
  try {
    // Execute the Mongoose query
    let skip = (page - 1) * limit;
    const data = await properties
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .select(selectedFields)
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
    let page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { city } = req.query;
    const queryObject = {};
    if (city) {
      queryObject.city = { $regex: city, $options: "i" };
    }
    let skip = (page - 1) * limit;
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
    let page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { SortType, sortColumn } = req.query;
    console.log({ page, limit, SortType, sortColumn });
    const queryObject = {};

    let skip = (page - 1) * limit;

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
  console.log(filter);

  if (!filter) {
    return res.status(400).json({ error: "No filter provided" });
  }
  let query = {};
  try {
    if (filter.accommodation && filter.accommodation.length > 0) {
      query.accommodation = { $in: filter.accommodation }
    }

    if (filter.categories && filter.categories.length > 0) {
      query.category = { $in: filter.categories }
    }

    if (filter.cities && filter.cities.length > 0) {
      query.city = { $in: filter.cities }
    }

    if (filter.facing && filter.facing.length > 0) {
      query.facing = { $in: filter.facing }
    }
    //filter= {"accommodation":["3 BHK"],"categories":[],"cities":["KOLKATA","MUMBAI"],"facing":[],"floors":[],"locations":[],"possession":[],"possession":[],"priceRange":[],"sizeRange":[]}

    if (filter.floors && filter.floors.length > 0) {
      query.floor = { $in: filter.floors }
    }

    if (filter.possession && filter.possession.length > 0) {
      query.possession = { $in: filter.possession }
    }

    if (filter.locations && filter.locations.length > 0) {
      query.sectorNumber = { $in: filter.locations }
    }

    if (filter.priceRange && filter.priceRange.length === 2) {
      const minPrice = filter.priceRange[0];
      const maxPrice = filter.priceRange[1];
      query.price = { $gte: minPrice, $lte: maxPrice }
    }

    if (filter.sizeRange && filter.sizeRange.length > 0) {
      query.size = { $in: filter.sizeRange }
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
          console.log(data[x]);
          let newModel = new properties(data[x]);
          await newModel.save();
        }
      });
    res.status(200).json({ message: "Bulk Insert Done" });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

async function ensureFolderStructure(s3, folderPath) {
  const parts = folderPath.split("/");
  let currentPath = "";
  for (const part of parts) {
    currentPath += part + "/";
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: currentPath,
      Body: "",
    };
    await s3.putObject(params).promise();
  }
}

const uploadProperties = async (req, res, next) => {
  try {
    const { _id, ...data } = req.body;
    const { threeSixtyImages, normalImageFile, thumbnailFile, videoFile, layoutFile, virtualFile } = req.files;

    // await ensureFolderStructure(s3, folderPath);
    if (threeSixtyImages && threeSixtyImages.length) {
      data.images = threeSixtyImages.map((file) => `https://builderfloors.s3.amazonaws.com/${"threeSixtyImages/", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(threeSixtyImages, "threeSixtyImages");
    }
    if (normalImageFile && normalImageFile.length) {
      data.normalImages = normalImageFile.map((file) => `https://builderfloors.s3.amazonaws.com/${"normalImageFile", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(normalImageFile, "normalImageFile");
    }
    if (thumbnailFile && thumbnailFile.length) {
      data.thumbnails = thumbnailFile.map((file) => `https://builderfloors.s3.amazonaws.com/${"thumbnailFile", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(thumbnailFile, "thumbnailFile");
    }
    if (videoFile && videoFile.length) {
      data.videos = videoFile.map((file) => `https://builderfloors.s3.amazonaws.com/${"videoFile", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(videoFile, "videoFile");
    }
    if (layoutFile && layoutFile.length) {
      data.layouts = layoutFile.map((file) => `https://builderfloors.s3.amazonaws.com/${"layoutFile", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(layoutFile, "layoutFile");
    }
    if (virtualFile && virtualFile.length) {
      data.virtualFiles = virtualFile.map((file) => `https://builderfloors.s3.amazonaws.com/${"virtualFile", file.originalname.replace(/ /g, '_')}`);
      await uploadOnS3(virtualFile, "virtualFile");
    }
    console.log(data);

    // Promise.all(uploads)
    // .then(() => {
    const newProperty = new properties(data).save();
    return res.json({ message: "Data updated successfully.", result: newProperty });
    //     // res.status(200).json({ message: "Upload Done", urls });
    //   })
    //   .catch((err) => res.status(500).send("Error uploading files: " + err));
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Error Upload", error: err.message });
  }
};

const uploadOnS3 = async (files, folderPath) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
  files.map((file) => {
    return new Promise((resolve, reject) => {
      const s3Key = path
        .join(folderPath, file.originalname)
        .replace(/ /g, '_');
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      s3.upload(params, (err, data) => {
        if (err) {
          console.error("Error uploading to S3:", err);
          reject(err);
        } else {
          console.log(data.Location);
          resolve();
        }
      });
    });
  });
}

const importProperties = async (req, res) => {
  try {
    let rejected = [];
    let inserted = 0;
    let uploaded = 0;
    let data = convertCsvToJson(req.file);
    if (
      !data[0].hasOwnProperty("Plot Number") ||
      !data[0].hasOwnProperty("Location") || !data[0].hasOwnProperty("Floor")
    ) {
      return res.json({ message: "Invalid file, please upload a valid file." });
    } else {
      function getoperations(e, callback) {
        console.log(e);
        callback(null, {
          updateOne: {
            filter: {
              plotNumber: e["Plot Number"],
              sectorNumber: e["Location"],
              floor: e["Floor"],
            },
            update: {
              $set: {
                city: e['City'],
                sectorNumber: e['Location'],
                plotNumber: e['Plot Number'],
                size: e['Size'],
                facing: e["Facing"],
                accommodation: e['Accommodation'],
                parkFacing: e['Park Facing'] == 'YES' ? true : false,
                corner: e['Corner'] == 'YES' ? true : false,
                floor: e["Floor"],
                possession: e["Possession"],
                title: e["1st Page Title"],
                detailTitle: e["2 Page Title"],
                description: e["Description"] || '',
                builderName: e["Builder Name"],
                builderContact: e["Builder Contact Number"],
                price: parseFloat(e["Price"]) ? parseFloat(e["Price"]) * 10000000 : "Price on Request",
                address: e["Address"],
                category: "PLOT",
                imageType: e["Image/Video/360 Image"],
                folder: e["FOLDER NAME"],
                channelPartner: e["Channel Partner Name"],
                channelContact: e["Channel Contact Number"],
                thumbnailName: e["THUMBNAIL IMAGE NAME"]
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
            !errors.includes(e.updateOne.filter["sectorNumber"]) &&
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
      return res.json({
        response: [],
        rejected: rejected,
        inserted: inserted || 0,
        uploaded: uploaded || 0,
        message: "Data uploaded"
      });
    }
  } catch (error) {
    res.json({ message: "Internal server error", error: error.message });
  }
}

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
    const data = await properties.find({ _id: req.body.ids }).select(selectedFields);
    return res.json(data);
  } catch (error) {
    res.json({ message: "Internal server error", error: error.message });
  }
}

export default {
  getpropertiesList,
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
  getPropertiesByIds
};
