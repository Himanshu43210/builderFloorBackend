import mongoose from "mongoose";
import masters from "../models/mastersModel.js";

const transformHomeData = (data) => {
  return data.reduce((acc, curr) => {
    const { fieldName, fieldLabel, fieldValue } = curr;

    // Initialize the array for the fieldName if it doesn't exist
    if (!acc[fieldName]) {
      acc[fieldName] = [];
    }

    // Push the transformed object into the array
    acc[fieldName].push({ label: fieldLabel, value: fieldValue });

    return acc;
  }, {});
};

const Edit_Update = async (req, res) => {
  const { _id, ...data } = req.body;
  console.log(data);
  try {
    if (_id) {
      // If _id is present, update the existing record in "masters" table
      const existingRecord = await masters.findByIdAndUpdate(_id, data, {
        new: true,
        runValidators: true,
      });

      if (!existingRecord) {
        return res.status(404).json({ error: "Record not found." });
      }

      return res.json(existingRecord);
    } else {
      // If _id is not present, create a new record in "masters" table
      console.log(data);
      const newRecord = new masters(data);

      await newRecord.save();

      return res.json(newRecord);
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to save the record." });
  }
};

const getmastersList = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    const { SortType, sortColumn } = req.query;
    console.log({ page, limit, SortType, sortColumn });
    const queryObject = {};

    let skip = page * limit;

    let data = await masters.find(queryObject).skip(skip).limit(limit);
    const totalDocuments = await masters.countDocuments();
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
const getMasterDataOnHome = async (req, res, next) => {
  try {
    let page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    const { SortType, sortColumn } = req.query;
    console.log({ page, limit, SortType, sortColumn });
    const queryObject = {};

    let skip = page * limit;

    let data = await masters.find(queryObject).skip(skip).limit(limit);
    const totalDocuments = await masters.countDocuments();
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      data: transformHomeData(data),
      nbHits: data.length,
      pageNumber: page,
      totalPages: totalPages,
      totalItems: totalDocuments,
    });
  } catch (error) {
    res.status(400).json({ messgae: error.message });
  }
};

const updatemastersByID = async (req, res, next) => {
  try {
    let id = req.body._id;
    let updateData = req.body;
    let data = await masters.findById(id);

    if (data) {
      const updatedData = await masters.findByIdAndUpdate(id, {
        $set: updateData,
      });
      res.status(200).json({ messgae: "masters updated" });
    }
    let newModel = new masters(req.body);
    const newData = await newModel.save();

    res.status(200).json({ newData });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const getmastersById = async (req, res, next) => {
  try {
    let id = req.query.id;
    let data = await masters.findById(id);
    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const deletemastersById = async (req, res, next) => {
  try {
    let id = req.query.id;
    const updatedData = await masters.findByIdAndRemove(id);
    res.status(200).json({ messgae: "masters deleted" });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const deletemastersByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await masters.findByIdAndRemove(id);
    if (!result) {
      return res.status(404).json({ message: "masters not found" });
    }
    res.status(200).json({ message: "masters deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "An error Occurred" });
  }
};

const storemasters = async (req, res, next) => {
  try {
    let newModel = new masters(req.body);
    const data = await newModel.save();
    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ messgae: err.message });
  }
};

const updateBulkmasters = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          const id = data[x].id;
          delete data[x].id;
          await masters.findByIdAndUpdate(id, { $set: data[x] });
        }
      });
    res.status(200).json({ message: "Bulk Update Done" });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

const insertBulkmasters = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          console.log(data[x]);
          let newModel = new masters(data[x]);
          await newModel.save();
        }
      });
    res.status(200).json({ message: "Bulk Insert Done" });
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" });
  }
};

export default {
  getmastersList,
  getMasterDataOnHome,
  storemasters,
  getmastersById,
  deletemastersById,
  updatemastersByID,
  updateBulkmasters,
  insertBulkmasters,
  Edit_Update,
};
