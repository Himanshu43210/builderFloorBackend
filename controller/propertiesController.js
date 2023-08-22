import mongoose from "mongoose";
import properties from "../models/propertiesModel.js";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import asyncs from "async";
import _ from "lodash";
import { map, delay } from "modern-async";

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
    city: data.city?.value,
    sectorNumber: data.sectorNumber?.value,
    facing: data.facing?.value,
    accommodation: data.accommodation?.value,
    floor: data.floor?.value,
    possession: data.possession?.value,
    category: data.category?.value,
    state: data.state?.value,
    imageType: data.imageType?.value,
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

  const query = {};
  // Construct the Mongoose query object
  // const query = { needApprovalBy: "Approved" };

  // if (criteria.city) {
  //   // query.city = { $regex: criteria.city.value, $options: "i" };
  // }

  if (criteria.budget) {
    query.price = { $gte: criteria.budget[0], $lte: criteria.budget[1] };
  }

  if (criteria.accommodation) {
    query.accommodation = criteria.accommodation.value;
  }

  // Add more conditions for other fields in a similar manner

  // Sorting
  let sortQuery = {};
  if (criteria.sortBy && criteria.sortBy.value === "Price High to Low") {
    sortQuery = { price: -1 };
  } else {
    // Set the default sorting column and order here
    sortQuery = { default_sort_column: 1 };
  }

  try {
    // Execute the Mongoose query
    let skip = (page - 1) * limit;
    const results = await properties
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // Return the results as JSON
    res.json(convertToCardData(results));
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
    const totalDocuments = await properties.countDocuments();
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

  try {
    let filteredProperties = await properties.find();

    if (filter.accommodation && filter.accommodation.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.accommodation.includes(property.accommodation)
      );
    }

    if (filter.categories && filter.categories.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.categories.includes(property.category)
      );
    }

    if (filter.cities && filter.cities.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.cities.includes(property.city)
      );
    }

    if (filter.facing && filter.facing.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.facing.includes(property.facing)
      );
    }
    //filter= {"accommodation":["3 BHK"],"categories":[],"cities":["KOLKATA","MUMBAI"],"facing":[],"floors":[],"locations":[],"possession":[],"possession":[],"priceRange":[],"sizeRange":[]}

    if (filter.floors && filter.floors.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.floors.includes(property.floor)
      );
    }

    if (filter.possession && filter.possession.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.possession.includes(property.possession)
      );
    }

    if (filter.locations && filter.locations.length > 0) {
      filteredProperties = filteredProperties.filter((property) =>
        filter.locations.includes(property.floor)
      );
    }

    if (filter.priceRange && filter.priceRange.length === 2) {
      const minPrice = filter.priceRange[0];
      const maxPrice = filter.priceRange[1];

      filteredProperties = filteredProperties.filter(
        (property) => property.price >= minPrice && property.price <= maxPrice
      );
    }

    if (filter.sizeRange && filter.sizeRange.length === 2) {
      const minSize = filter.sizeRange[0];
      const maxSize = filter.sizeRange[1];

      filteredProperties = filteredProperties.filter(
        (property) => property.size >= minSize && property.size <= maxSize
      );
    }

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

    const folderPath = data.folder;
    // await ensureFolderStructure(s3, folderPath);
    if (threeSixtyImages) {
      data.images = threeSixtyImages.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(threeSixtyImages, folderPath);
    }
    if (normalImageFile) {
      data.normalImages = normalImageFile.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(normalImageFile, folderPath);
    }
    if (thumbnailFile) {
      data.thumbnails = thumbnailFile.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(thumbnailFile, folderPath);
    }
    if (videoFile) {
      data.videos = videoFile.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(videoFile, folderPath);
    }
    if (layoutFile) {
      data.layouts = layoutFile.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(layoutFile, folderPath);
    }
    if (virtualFile) {
      data.virtualFiles = virtualFile.map((file) => `https://builderfloors.s3.amazonaws.com/${path.join(folderPath, file.originalname).replace(/ /g, '_')}`);
      await uploadOnS3(virtualFile, folderPath);
    }

    console.log(data);

    // Promise.all(uploads)
    //   .then(() => {
    const newProperty = new properties(data).save();
    return res.json(newProperty);
    //     // res.status(200).json({ message: "Upload Done", urls });
    //   })
    //   .catch((err) => res.status(500).send("Error uploading files: " + err));
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Error Upload", err });
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
  let data = convertCsvToJson(req.file);

  if (
    !data[0].hasOwnProperty("Plot Number") ||
    !data[0].hasOwnProperty("Location") || !data[0].hasOwnProperty("Floor")
  ) {
    isInvalidFile += 1;
    return res.json({ uploaded, rejected, inserted, isInvalidFile });
  } else {
    function getoperations(e, callback) {
      e["sectorNumber"] = e["sectorNumber"].toString();
      e["plotNumber"] = e["plotNumber"].toString();
      callback(null, {
        updateOne: {
          filter: {
            propertyID: "",
            createdByID: req.user.id,
          },
          update: {
            $set: {
              ...e,
              createdByID: req.user.id,
              ip: req.body.ip,
              latlng: [req.body.latitude, req.body.longitude],
              category: "COMMERCIAL",
            },
          },
          upsert: true,
        },
        filterD: e,
      });
    }

    let tempData = _.chunk(data, 1000);

    let result = await map(tempData, async (v) => {
      let operations = [];
      let sectorNumbers = v.map((p) => p.sectorNumber.toString());
      asyncs.map(v, getoperations, function (err, results) {
        if (err) {
          console.log(err);
        } else {
          operations = results;
        }
      });

      const pipeline = [
        { $match: { category: "COMMERCIAL", sectorNumber: { $in: sectorNumbers } } },
        { $project: { _id: 1, plotNumber: 1, sectorNumber: 1, subCategory: 1 } },
      ];

      const properties = await Properties.aggregate(pipeline);
      const finalOperations = operations.filter((e) => {
        const plotNumber = e.filterD.plotNumber;
        const sectorNumber = e.filterD.sectorNumber;
        const subCategory = e.filterD.subCategory;
        properties.map((ele) => {
          if (
            ele.sectorNumber == sectorNumber &&
            ele.subCategory == subCategory &&
            ele.plotNumber == plotNumber
          ) {
            e.updateOne.filter.propertyID = ele._id;
            e.updateOne.update["$set"].propertyID = ele._id;
            delete e.filterD;
          }
        });
        return (
          properties.map((p) => p.plotNumber).includes(plotNumber) &&
          properties.map((p) => p.sectorNumber).includes(sectorNumber) &&
          properties.map((p) => p.subCategory).includes(subCategory) &&
          !errors.includes(plotNumber) &&
          !errors.includes(sectorNumber) &&
          !errors.includes(subCategory) &&
          !e.filterD
        );
      });
      let rejectData = v.filter((e) => {
        const plotNumber = e.plotNumber;
        const sectorNumber = e.sectorNumber;
        const subCategory = e.subCategory;
        return (
          !properties.map((p) => p.plotNumber).includes(plotNumber) ||
          !properties.map((p) => p.sectorNumber).includes(sectorNumber) ||
          !properties.map((p) => p.subCategory).includes(subCategory) ||
          errors.includes(plotNumber) ||
          errors.includes(subCategory) ||
          errors.includes(sectorNumber)
        );
      });
      Array.prototype.push.apply(rejected, rejectData);
      await delay();
      let response = await PlotAuthority.bulkWrite(finalOperations);
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
      isInvalidFile,
      uploaded: uploaded || 0,
      message: "Data uploaded"
    });
  }
}

const convertCsvToJson = (file) => {
  workbook = XLSX.read(file.buffer, { type: "buffer" });
  var sheet_name_list = workbook.SheetNames;
  const options = { defval: "" };
  const data = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheet_name_list[0]],
    options
  );
  return data;
};

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
};
