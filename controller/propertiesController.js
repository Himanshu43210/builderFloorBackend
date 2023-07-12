import mongoose from 'mongoose';
import properties from '../models/propertiesModel.js';


const getpropertiesList = async (req, res, next) => {
  try {
    let data = await properties.find()
    res.status(200).json({ data })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

const updatepropertiesByID = async (req, res, next) => {
  try {
    let id = req.query.id
    let updateData = req.body
    const updatedData = await properties.findByIdAndUpdate(id, { $set: updateData })
    res.status(200).json({ messgae: "properties updated" })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

const getpropertiesById = async (req, res, next) => {
  try {
    let id = req.query.id
    let data = await properties.findById(id)
    res.status(200).json({ data })
  } catch (err) {
    res.status(400).json({ messgae: err.message })
  }
}

const deletepropertiesById = async (req, res, next) => {
  try {
    let id = req.query.id
    const updatedData = await properties.findByIdAndRemove(id)
    res.status(200).json({ messgae: "properties deleted" })
  } catch (err) {
    res.status(400).json({ messgae: err.message })
  }
}

const deletepropertiesByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await properties.findByIdAndRemove(id);
    if (!result) {
      return res.status(404).json({ message: 'properties not found' });
    }
    res.status(200).json({ message: "properties deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "An error Occurred" });
  }
}

const storeproperties = async (req, res, next) => {
  try {
    let newModel = new properties(req.body)
    const data = await newModel.save()
    res.status(200).json({ data })
  } catch (err) {
    res.status(400).json({ messgae: err.message })
  }
}


const updateBulkproperties = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          const id = data[x].id
          delete data[x].id
          await properties.findByIdAndUpdate(id, { $set: data[x] })
        }
      })
    res.status(200).json({ message: "Bulk Update Done" })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

const insertBulkproperties = async (req, res, next) => {
  try {
    csv()
      .fromFile(req.file.path)
      .then(async (data) => {
        for (var x = 0; x < data.length; x++) {
          console.log(data[x])
          let newModel = new properties(data[x])
          await newModel.save()
        }
      })
    res.status(200).json({ message: "Bulk Insert Done" })
  } catch (error) {
    res.status(400).json({ messgae: "An error Occoured" })
  }
}

export default {
  getpropertiesList,
  storeproperties,
  getpropertiesById,
  deletepropertiesById,
  updatepropertiesByID,
  updateBulkproperties,
  insertBulkproperties
}
