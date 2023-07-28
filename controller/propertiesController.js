import mongoose from 'mongoose';
import properties from '../models/propertiesModel.js';


const getpropertiesList = async (req, res, next) => {
  try {
    
    let page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const {city} = req.query;

    const queryObject = {};

    if(city) {
      queryObject.city = {$regex: city, $options: 'i'};
    }
    let skip = (page-1) *limit;

    let data = await properties.find(queryObject).skip(skip).limit(limit)

    let filteredProperties = data.data;
    const totalDocuments = await properties.countDocuments();
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ messgae: error.message })
  }
}

const searchproperties = async (req, res, next) => {

  const {city} = req.query;
  const queryObject = {};

  if(city) {
    queryObject.city = {$regex: city, $options: 'i'};
  }

  const data = await properties.find(queryObject);

  res.status(200).json(data);
}

const filterproperties = async (req, res, next) => {

  const filter = JSON.parse(req.query.filter);
  console.log(filter);
  
  if (!filter) {
    return res.status(400).json({ error: 'No filter provided' });
  }

  try {
    
    let filteredProperties = await properties.find();

    if (filter.accommodation && filter.accommodation.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.accommodation.includes(property.accommodation)
      );
    }

    if (filter.categories && filter.categories.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.categories.includes(property.category)
      );
    }

    if (filter.cities && filter.cities.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.cities.includes(property.city)
      );
    }

    if (filter.facing && filter.facing.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.facing.includes(property.facing)
      );
    }
    //filter= {"accommodation":["3 BHK"],"categories":[],"cities":["KOLKATA","MUMBAI"],"facing":[],"floors":[],"locations":[],"possession":[],"possession":[],"priceRange":[],"sizeRange":[]}

    if (filter.floors && filter.floors.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.floors.includes(property.floor)
      );
    }

    if (filter.possession && filter.possession.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.possession.includes(property.possession)
      );
    }

    if (filter.locations && filter.locations.length > 0) {
      filteredProperties = filteredProperties.filter(property =>
        filter.locations.includes(property.floor)
      );
    }

    if (filter.priceRange && filter.priceRange.length === 2) {
      const minPrice = filter.priceRange[0];
      const maxPrice = filter.priceRange[1];
      
      filteredProperties = filteredProperties.filter(property =>
        property.price >= minPrice && property.price <= maxPrice
      );
    }

    if (filter.sizeRange && filter.sizeRange.length === 2) {
      const minSize = filter.sizeRange[0];
      const maxSize = filter.sizeRange[1];
      
      filteredProperties = filteredProperties.filter(property =>
        property.size >= minSize && property.size <= maxSize
      );
    }




    res.send(filteredProperties);

  } catch (error) {
    res.status(400).json({ messgae: error.message });
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
  insertBulkproperties,
  searchproperties,
  filterproperties
}
