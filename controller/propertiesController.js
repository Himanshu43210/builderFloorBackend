import mongoose from "mongoose";
import properties from "../models/propertiesModel.js";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

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

  // Construct the Mongoose query object
  const query = {};

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
    const queryObject = { needApprovalBy: "Approved" };

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
    console.log(data);
    const s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });
    const folderPath = data.folder;
    await ensureFolderStructure(s3, folderPath);
    const urls = [];

    const uploads = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const s3Key = path
          .join(folderPath, file.originalname)
          .replace(/\\/g, "/");
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: fs.createReadStream(file.path),
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.error("Error uploading to S3:", err);
            reject(err);
          } else {
            fs.unlinkSync(file.path);
            urls.push(data.Location);
            resolve();
          }
        });
      });
    });

    Promise.all(uploads)
      .then(() => {
        const newProperty = new properties({ ...data, images: urls }).save();
        return res.json(newProperty);
        // res.status(200).json({ message: "Upload Done", urls });
      })
      .catch((err) => res.status(500).send("Error uploading files: " + err));
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Error Upload", err });
  }
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
