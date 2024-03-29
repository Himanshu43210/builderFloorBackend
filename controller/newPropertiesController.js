import properties from "../models/propertiesModel.js";
import newproperties from "../models/newPropertiesModel.js";
import floors from "../models/floorModel.js";
import AWS from "aws-sdk";
import XLSX from "xlsx";
import asyncs from "async";
import _ from "lodash";
import { map, delay } from "modern-async";
import { USER_ROLE } from "./UsersController.js";
import { BUILDER_FLOOR_ADMIN } from "../const.js";
import users from "../models/UsersModel.js";
import customers from "../models/customerModel.js";
import userHistory from "../models/userHistoryModel.js";
import { generatePropertyUrl } from "../utils/formatters.js";
import transporter from "../utils/mail-transporter.js";
import notifications from "../models/notificationsModel.js";

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
    "_id title location accommodation floor size price rating facing possession parkFacing corner thumbnails sectorNumber plotNumber createdAt updatedAt floors";
// const create = async (req, res) => {
//     try {
//         const result = await newproperties.find().select({ _id: 0 });
//         for (let data of result) {
//             // console.log(data);
//             await newproperties.updateOne({ sectorNumber: data.sectorNumber, plotNumber: data.plotNumber },
//                 {
//                     $set: data
//                 }, { upsert: true });
//             const propertyData = await newproperties.findOne({ sectorNumber: data.sectorNumber, plotNumber: data.plotNumber }).select("_id floors");
//             const floorData = await floors.updateOne({ propertyId: propertyData._id, floor: data.floor },
//                 {
//                     $set: data
//                 }, { upsert: true });
//             const floor = await floors.findOne({ propertyId: propertyData._id, floor: data.floor }).select("_id");
//             if (!propertyData?.floors?.includes(floor._id)) {
//                 propertyData.floors.push(floor._id);
//                 await newproperties.findByIdAndUpdate({ _id: propertyData._id }, propertyData);
//             }
//             console.log(floor);
//         }
//         res.status(200).json({ message: "Data added succussfully" });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message })
//     }
// }

const createAndUpdateProperty = async (req, res) => {
    try {
        const { sectorNumber, plotNumber } = req.body;
        if (!sectorNumber || !plotNumber) {
            throw new Error("sectorNumber && plotNumber are required.")
        }
        await newproperties.updateOne({ sectorNumber, plotNumber },
            {
                $set: req.body
            }, { upsert: true });
        const propertyData = await newproperties.findOne({ sectorNumber, plotNumber }).select("_id floors");
        for (let i = 1; i < 5; i++) {
            if (req.body[`floor${i}`]?.floor) {
                await floors.updateOne({ propertyId: propertyData._id, floor: req.body[`floor${i}`]["floor"]?.toUpperCase() },
                    {
                        $set: req.body[`floor${i}`]
                    }, { upsert: true });
                const floor = await floors.findOne({ propertyId: propertyData._id, floor: req.body[`floor${i}`]["floor"]?.toUpperCase() }).select("_id");
                if (!propertyData?.floors?.includes(floor._id)) {
                    propertyData.floors.push(floor._id);
                    await newproperties.findByIdAndUpdate({ _id: propertyData._id }, propertyData);
                }
            }
        }
        return res.status(200).json({ message: "Data added successfully." })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}






const convertToCardData = (datFromDb) => {
    return datFromDb?.map((item) => {
        return {
            _id: item._id,
            title: item.title,
            sectorNumber: item.sectorNumber,
            plotNumber: item.plotNumber,
            accommodation: item.accommodation,
            floor: item.floor,
            size: item.size,
            price: item.price,
            rating: item.rating || 5,
            facing: item.facing,
            possession: item.possession,
            thumbnails: item.thumbnails?.[0],
            parkFacing: item.parkFacing,
            corner: item.corner,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            floors: item.floors,
        };
    });
};

const mapFields = (datFromDb) => {
    return datFromDb?.map((property) => {
        let parentId = property?.parentId?._id;
        property.parentId = property?.parentId?.role == "SalesUser" ? property?.parentId?.pid : property?.parentId;
        property.parentId._id = parentId;
        property.parentId.pid = property.parentId.pid._id;
        return property;
    });
};

const Edit_Update = async (req, res) => {
    const { _id, ...data } = req.body;
    const newData = {
        ...data,
        city: data.city,
        location: data.sectorNumber,
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
            const existingProperty = await newproperties.findByIdAndUpdate(
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
            for (let i = 1; i < 5; i++) {
                if (newData[`floor${i}`]?.floor) {
                    await floors.updateOne({ propertyId: existingProperty._id, floor: newData[`floor${i}`]["floor"]?.toUpperCase() },
                        {
                            $set: newData[`floor${i}`]
                        }, { upsert: true });
                    const floor = await floors.findOne({ propertyId: existingProperty._id, floor: newData[`floor${i}`]["floor"]?.toUpperCase() }).select("_id");
                    if (!existingProperty?.floors?.includes(floor._id)) {
                        existingProperty.floors.push(floor._id);
                        await newproperties.findByIdAndUpdate({ _id: existingProperty._id }, existingProperty);
                    }
                }
            }
            return res.json(existingProperty);
        } else {
            const newProperty = new newproperties(newData);
            await newProperty.save();
            return res.json(newProperty);
        }
    } catch (err) {
        return res.status(500).json({ error: "Failed to save the property." });
    }
};

const approveProperty = async (req, res) => {
    try {
        const { _id, needApprovalBy } = req.body;
        console.log({ _id, needApprovalBy });
        const data = await newproperties.findByIdAndUpdate({ _id }, { needApprovalBy });
        // if data.needApprovalBy === "Approved" send email to cp or data.parentId
        if (data.needApprovalBy === "Approved") {
            const notifToSave = {
                status: 0,
                type: "Property",
                subType: "Approved",
                title: `Property approved`,
                details: `Property ${data?.title} approved.`,
                userId: data?.parentId,
                admin: false,
            };
            const newNotif = new notifications(notifToSave);
            await newNotif.save();
            await transporter.sendMail({
                from: "propertyp247@gmail.com",
                to: [data.email, "tanish@techhelps.co.in"],
                subject: "BuilderFloor Property Approved",
                html: `
              <div
                style="max-width: 90%; margin: auto; padding-top: 20px;"
              >
                <br/>
                <span style="font-weight:800; display:block;">The following porperty has been approved on builderfloor.com.</span>
                <br />
                <a href="${generatePropertyUrl(data)}">${generatePropertyUrl(data)}</a>
              </div>
            `,
            });
        } else {
            const notifToSave = {
                status: 0,
                type: "Property",
                subType: "Need Approval",
                title: `Property approval needed`,
                details: `Property ${data?.title} need approval by admin.`,
                userId: data?.parentId,
                admin: true,
            };
            const newNotif = new notifications(notifToSave);
            await newNotif.save();
        }
        return res.status(200).json({ data, message: "Property approved successfully" })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
};


const searchPropertiesData = async (req, res) => {
    // Parse the JSON payload from the request
    const criteria = req.body;
    let page = Number(criteria.page) || 0;
    const limit = Number(criteria.limit) || 10;
    const {
        budget,
        size,
        corner,
        parkFacing,
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
    const query1 = {}
    // Construct the Mongoose query object
    // const query = { needApprovalBy: "Approved" };

    // if (criteria.city) {
    //   // query.city = { $regex: criteria.city.value, $options: "i" };
    // }

    if (budget?.length) {
        query1.price = { $gte: budget[0], $lte: budget[1] };
    }
    if (size?.length) {
        query.size = { $gte: size[0], $lte: size[1] };
    }
    if (accommodation) {
        query.accommodation = accommodation;
    }
    if (corner) {
        query.corner = corner;
    }
    if (parkFacing) {
        query.parkFacing = parkFacing;
    }
    if (city) {
        query.city = { $regex: city, $options: "i" };
    }
    if (facing) {
        query.facing = facing;
    }
    if (floor) {
        query1.floor = floor;
    }
    if (location) {
        query.sectorNumber = location;
    }
    if (possession) {
        query1.possession = possession;
    }
    const floorIds = await floors.distinct("_id", query);
    if (floorIds.length) {
        query.floors = { $in: floorIds }
    }

    if (req.query.search) {
        query["$or"] = await serchPropertyData(req.query.search);
    }
    // Add more conditions for other fields in a similar manner

    // Sorting
    let sortQuery =
        sortBy === "Price High to Low"
            ? { price: -1 }
            : sortBy === "Price Low to High"
                ? { price: 1 }
                : { possession: -1, updatedAt: -1 };
    try {
        // Execute the Mongoose query
        let skip = page * limit;
        const data = await newproperties
            .find(query)
            .populate("floors")
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .select(selectedFields);
        // Return the results as JSON
        const totalItems = await newproperties.countDocuments(query);
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
        const { city, sectorNumber, plotNumber, pid } = req.query;
        const queryObject = { needApprovalBy: "Approved" };
        if (city) {
            queryObject.city = { $regex: city, $options: "i" };
        }
        if (req?.params?.status == "floor") {
            if (!sectorNumber || !plotNumber) {
                throw new Error("sectorNumber and plotNumber are required")
            }
            if (sectorNumber) {
                queryObject.sectorNumber = sectorNumber;
            }
            if (plotNumber) {
                queryObject.plotNumber = plotNumber;
            }
            if (pid) {
                queryObject._id = { $ne: pid };
            }
        }
        let skip = page * limit;
        const sortColumn = (req.query?.sortColumn && req.query?.sortColumn !== "") ? req.query?.sortColumn : "updatedAt";
        const sortType = req?.query?.sortType || 'desc';
        let sortQuery = { [sortColumn]: sortType };
        let data = await newproperties.find(queryObject).populate("floors").sort(sortQuery).skip(skip).limit(limit);
        // const totalDocuments = await newproperties.countDocuments();
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
            queryObject["$or"] = await serchPropertyData(req.query.search);
        }
        let skip = page * limit;

        let data = await newproperties.find(queryObject).populate("floors").skip(skip).limit(limit);
        const totalDocuments = await newproperties.countDocuments(queryObject);
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
            price,
            accommodation,
            corner,
            parkFacing,
            city,
            facing,
            floor,
            sectorNumber,
            possession,
            id,
            role,
            sortType,
            sortColumn,
            state,
        } = req.body;
        id = req.query.id;
        role = req.query.role;
        const query = { needApprovalBy: { $ne: "Rejected" } };
        const query1 = {};
        if (price) {
            if (Array.isArray(price)) {
                query.price = { $gte: price[0], $lte: price[1] };
            } else {
                query.price = { $gte: price }
            }
        }
        if (accommodation) {
            query.accommodation = { $regex: accommodation, $options: "i" };
        }
        if (corner) {
            query.corner = { $regex: corner, $options: "i" };
        }
        if (parkFacing) {
            query.parkFacing = { $regex: parkFacing, $options: "i" };
        }
        if (city) {
            query.city = { $regex: city, $options: "i" };
        }
        if (state) {
            query.state = { $regex: state, $options: "i" };
        }
        if (facing) {
            query.facing = { $regex: facing, $options: "i" };
        }
        if (floor) {
            query1.floor = { $regex: floor, $options: "i" };
        }
        if (sectorNumber) {
            query.sectorNumber = { $regex: sectorNumber, $options: "i" };
        }
        if (possession) {
            query1.possession = { $regex: possession, $options: "i" };
        }

        const floorIds = await floors.distinct("_id", query1)
        if (floorIds.length) {
            query.floors = { $in: floorIds }
        }
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) || 10;
        let search = [];
        if (req.query.search) {
            search = await serchPropertyData(req.query.search);
        }
        if (role === USER_ROLE[BUILDER_FLOOR_ADMIN]) {
            if (req.query.search) {
                query["$or"] = await serchPropertyData(req.query.search);
            }
        } else {
            if (req.query.search) {
                query["$and"] = [
                    {
                        $or: [
                            { parentId: id },
                            { needApprovalBy: id },
                            { contactId: id },
                        ]
                    },
                    {
                        $or: [
                            ...search,
                        ]
                    }
                ];
            } else {
                query["$or"] = [
                    { parentId: id },
                    { needApprovalBy: id },
                    { contactId: id },
                ];
            }
        }
        let skip = page * limit;
        // Adding sort functionality
        let data = await newproperties
            .find(query)
            .populate("floors")
            .populate({ path: 'parentId', populate: { path: 'pid' } })
            .skip(skip)
            .limit(limit)
            .sort({ [sortColumn]: sortType === "desc" ? -1 : 1 });
        const totalDocuments = await newproperties.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);
        res.status(200).json({
            data: mapFields(data),
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

    const data = await newproperties.find(queryObject).populate("floors");

    res.status(200).json(data);
};

const filterproperties = async (req, res, next) => {
    const filter = JSON.parse(req.query.filter);
    if (!filter) {
        return res.status(400).json({ error: "No filter provided" });
    }
    let query = {};
    let query1 = {};
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
            query1.floor = { $in: filter.floors };
        }

        if (filter.possession && filter.possession.length > 0) {
            query1.possession = { $in: filter.possession };
        }

        if (filter.locations && filter.locations.length > 0) {
            query.location = { $in: filter.locations };
        }

        if (filter.priceRange && filter.priceRange.length === 2) {
            const minPrice = filter.priceRange[0];
            const maxPrice = filter.priceRange[1];
            query1.price = { $gte: minPrice, $lte: maxPrice };
        }

        if (filter.sizeRange && filter.sizeRange.length > 0) {
            query.size = { $in: filter.sizeRange };
        }
        const floorIds = await floors.distinct("_id", query1)
        if (floorIds.length) {
            query.floors = { $in: floorIds }
        }
        let filteredProperties = await newproperties.find(query).populate("floors");

        res.send(filteredProperties);
    } catch (error) {
        res.status(400).json({ messgae: error.message });
    }
};

const updatepropertiesByID = async (req, res, next) => {
    try {
        let id = req.body._id;
        let updateData = req.body;
        let data = await newproperties.findById(id);

        if (data) {
            const updatedData = await newproperties.findByIdAndUpdate(id, {
                $set: updateData,
            });
            return res.status(200).json({ messgae: "properties updated" });
        }

        let newModel = new newproperties(req.body);
        const newData = await newModel.save();
        res.status(200).json({ data });
    } catch (error) {
        res.status(400).json({ messgae: "An error Occoured" });
    }
};

const getpropertiesById = async (req, res, next) => {
    try {
        let id = req.query.id;
        let data = await newproperties.findById(id).populate("floors").populate({ path: 'parentId', populate: { path: 'pid' } });
        let result = mapFields([data])
        res.status(200).json({ data: result[0] });
    } catch (err) {
        res.status(400).json({ messgae: err.message });
    }
};

const deletepropertiesById = async (req, res, next) => {
    try {
        let id = req.query.id;
        const updatedData = await newproperties.findByIdAndRemove(id);
        const deletedHistory = await userHistory.deleteMany({ propertyId: id });
        res.status(200).json({ messgae: "properties deleted", deletedHistory });
    } catch (err) {
        res.status(400).json({ messgae: err.message });
    }
};

const storeproperties = async (req, res, next) => {
    try {
        let newModel = new newproperties(req.body);
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
                    await newproperties.findByIdAndUpdate(id, { $set: data[x] });
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
                    let newModel = new newproperties(data[x]);
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
        data.plotNumber + data.sectorNumber,
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

                if (_id) {
                    const exist = await newproperties.findById(_id);
                    if (uploadData.filesToBeDeleted?.length > 3) {
                        let filesToBeDeleted = uploadData?.filesToBeDeleted?.split(",")
                        for (let needTodelete of filesToBeDeleted) {
                            let indexToDelete = exist[mappedKey].indexOf(needTodelete);
                            // Check if the element exists in the array before deleting
                            if (indexToDelete !== -1) {
                                // Use the splice method to remove the element at the specified index
                                exist[mappedKey].splice(indexToDelete, 1);
                            }
                        }
                    }
                    uploadData[mappedKey] = exist[mappedKey].length > 0 ? [...exist[mappedKey], ...fileUrls] : fileUrls;
                } else {
                    uploadData[mappedKey] = fileUrls; // Assign the URLs to the correct key in uploadData
                }
            }
        }
        let newProperty;
        if (_id) {
            // if(filesToBeDeleted && uploadData.filesToBeDeleted.length){
            newProperty = await newproperties.findByIdAndUpdate({ _id }, uploadData);
        } else {
            newProperty = await new newproperties(uploadData).save();
            const approver = await users.findOne({ _id: newProperty.needApprovalBy });
            // if parentId is admin ---> 
            // else ---> 
            const notifToSave = {
                status: 0,
                type: "Property",
                subType: "Need Approval",
                title: `Property need approval`,
                details: `Property ${newProperty?.title} need approval.`,
                userId: newProperty?.needApprovalBy,
                admin: approver?.role === "BuilderFloorAdmin",
            };
            const newNotif = new notifications(notifToSave);
            await newNotif.save();
        }
        for (let i = 1; i < 5; i++) {
            console.log("out");
            if (uploadData[`floor${i}`]?.floor) {
                console.log(uploadData[`floor${i}`],'--in');
                await floors.updateOne({ propertyId: newProperty._id, floor: uploadData[`floor${i}`]["floor"]?.toUpperCase() },
                    {
                        $set: uploadData[`floor${i}`]
                    }, { upsert: true });
                const floor = await floors.findOne({ propertyId: newProperty._id, floor: uploadData[`floor${i}`]["floor"]?.toUpperCase() }).select("_id");
                if (!newProperty?.floors?.includes(floor._id)) {
                    newProperty.floors.push(floor._id);
                    await newproperties.findByIdAndUpdate({ _id: newProperty._id }, newProperty);
                }
            }
        }
        newProperty = await newproperties.findById(newProperty?._id).populate("floors")
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
                let response = await newproperties.bulkWrite(finalOperations);
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
        const data = await newproperties
            .find({ _id: req.body.ids }).select("floors")
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
        const { userId } = req.query;
        const user = await users.findOne({ _id: userId });
        let total = 0, approved = 0, pending = 0;
        if (user && user.role === "BuilderFloorAdmin") {
            total = await newproperties.countDocuments({});
            approved = await newproperties.countDocuments({
                needApprovalBy: "Approved"
            });
            pending = await newproperties.countDocuments({
                needApprovalBy: userId
            });
        } else {
            // parentId is either userId or the parent of userId
            total = await newproperties.countDocuments({
                parentId: userId,
            });
            approved = await newproperties.countDocuments({
                parentId: userId,
                needApprovalBy: "Approved",
            });
            pending = await newproperties.countDocuments({
                parentId: userId,
                needApprovalBy: { $ne: "Approved" },
            });
        }

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
            const property = await newproperties.find({ _id: id });
            await newproperties.findByIdAndUpdate({ _id: id }, data);
            const notifToSave = {
                status: 0,
                type: "Property",
                subType: "Rejected",
                title: `Property rejected`,
                details: `Property ${property?.title} rejected by ${user?.name}`,
                userId: property?.parentId,
                admin: false,
            };
            const newNotif = new notifications(notifToSave);
            await newNotif.save();
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
        let query = { parentId: req.query.userId };
        if (req.query.search) {
            query["$or"] = await serchUserData(req.query.search);
        }
        const data = await users.aggregate([
            {
                $match: query,
            },
            {
                $lookup: {
                    from: "newproperties",
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
        let query = { parentId: req.query.userId };
        if (req.query.search) {
            query["$or"] = await serchPropertyData(req.query.search);
        }
        const page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) || 10;
        const skip = page * limit;

        const data = await newproperties.find(query).populate("floors").sort({ updatedAt: -1 }).skip(skip).limit(limit);

        const totalDocuments = await newproperties.countDocuments(query);
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
        let query = { needApprovalBy: req.query.id || req.query.userId };
        let userQuery = {};
        if (req.query.search) {
            // query["$or"] = await serchPropertyData(req.query.search);
            userQuery["$or"] = await serchUserData(req.query.search);
        }
        const page = Number(req.query.page) || 0;
        const size = Number(req.query.limit) || 10;
        const skip = { $skip: size * page };
        const limit = { $limit: size };
        let data = await newproperties.aggregate([
            {
                $match: query,
            },
            {
                $lookup: {
                    from: "floors",
                    localField: "floors",
                    foreignField: "_id",
                    as: "floors",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "parentId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: userQuery,
                        },
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                phoneNumber: 1,
                                role: 1,
                                parentId: 1,
                                _id: 0,
                            },
                        },
                    ],
                    as: "user",
                },
            },
            {
                $addFields: {
                    userExists: { $gt: [{ $size: "$user" }, 0] }, // Check if the "user" array has any elements
                },
            },
            {
                $match: {
                    userExists: true, // Only keep documents where userExists is true
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    createdByName: "$user.name",
                    createdByEmail: "$user.email",
                    createdByPhoneNumber: "$user.phoneNumber",
                    userParentId: "$user.parentId",
                    role: "$user.role",
                },
            },
            {
                $project: {
                    user: 0, // Remove the 'user' field if you no longer need it
                    userExists: 0, // Remove the 'userExists' field from the final result
                },
            },
            skip,
            limit,
        ]);

        for (let item of data) {
            if (item.role == "SalesUser") {
                const parentUserData = await users.findOne({ _id: item.userParentId });
                item.cpName = parentUserData.name
                item.cpEmail = parentUserData.email
                item.cpPhoneNumber = parentUserData.phoneNumber
                item.cpCompanyName = parentUserData.companyName
            }
        }

        const totalDocuments = await newproperties.aggregate([
            {
                $match: query,
            },
            {
                $lookup: {
                    from: "floors",
                    localField: "floors",
                    foreignField: "_id",
                    as: "floors",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "parentId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: userQuery,
                        },
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                phoneNumber: 1,
                                _id: 0,
                            },
                        },
                    ],
                    as: "user",
                },
            },
            {
                $addFields: {
                    userExists: { $gt: [{ $size: "$user" }, 0] }, // Check if the "user" array has any elements
                },
            },
            {
                $match: {
                    userExists: true, // Only keep documents where userExists is true
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
        ]);
        const totalPages = Math.ceil((totalDocuments[0]?.count || 0) / size);

        res.status(200).json({
            data,
            nbHits: data.length,
            pageNumber: page,
            totalPages: totalPages,
            totalItems: totalDocuments[0]?.count || 0,
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ messgae: error.message });
    }
};

const getApprovedPropertiesList = async (req, res, next) => {
    try {
        let query = { needApprovalBy: "Approved" };
        if (req.query.search) {
            query["$or"] = await serchPropertyData(req.query.search);
        }
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) || 10;
        let skip = page * limit;
        let data = await newproperties.find(query).select("floors").skip(skip).limit(limit);
        const totalDocuments = await newproperties.countDocuments(query);
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
    const regex = new RegExp(search, "i");
    const fieldsToSearch = [
        "state",
        "city",
        "location",
        "plotNumber",
        "sizeType",
        "floor",
        "accommodation",
        "facing",
        "possession",
        "builderName",
        "builderContact",
        "title",
        "detailTitle",
        "description",
        "needApprovalBy",
    ];
    return fieldsToSearch.map((field) => ({ [field]: regex }));
};

const serchUserData = async (search) => {
    const regex = new RegExp(search, "i");
    const fieldsToSearch = [
        "name",
        "email",
        "phoneNumber",
        "role",
        "companyName",
        "companyAddress",
        "state",
        "city",
        "status",
    ];
    return fieldsToSearch.map((field) => ({ [field]: regex }));
};

const changeProperty = async (req, res) => {
    let workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    var sheet_name_list = workbook.SheetNames;
    const options = { defval: "" };
    const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]],
        options
    );

    for (let element of data) {
        const update = await newproperties.updateMany({ sectorNumber: element['OLD LOCATION'] }, {
            $set: {
                sectorNumber: element['NEW LOCATION NAME']
            }
        });
        console.log(update)
    }
}

const createUserHistory = async (req, res) => {
    try {
        const states = ["visited", "contacted", "searches", "recommendation"];
        const { propertyId, userId, options } = req.body;
        const { state } = req.params;
        if (!states.includes(state)) {
            return res.status(400).json({ status: 400, message: "Invalid state." })
        }
        const property = await newproperties.findById(propertyId).select('_id parentId');
        if (!property) {
            return res.status(400).json({ status: 400, message: "Property does not exist." })
        }
        const history = await userHistory.findOne({ userId, propertyId, type: state }).select('_id counts');
        if (history) {
            await userHistory.findByIdAndUpdate({ _id: history._id }, { counts: history.counts + 1, options: options?.length ? options : history?.options })
        } else {
            const userData = await users.findOne({ _id: property.parentId });
            let cpData;
            if (userData.role === "SalesUser") {
                cpData = await users.findOne({ _id: userData.parentId });
            }
            const emailToSendNotification = userData.role === "SalesUser" ? cpData?.email : userData.email;
            const customerData = await customers.findOne({ _id: userId });
            await userHistory.create({ userId, propertyId, parentId: (userData && userData.role === "SalesUser") ? userData.parentId : property.parentId, options, type: state, counts: 1 })
            if (state === 'contacted') {
                await transporter.sendMail({
                    from: "propertyp247@gmail.com",
                    to: [emailToSendNotification || "", "tanish@techhelps.co.in"],
                    subject: "BuilderFloor Property Contact",
                    html: `
                <div
                  style="max-width: 90%; margin: auto; padding-top: 20px;"
                >
                  <br/>
                  <span style="font-weight:800; display:block;">${customerData?.fullName}(${customerData?.phoneNumber}) has tried to contact you for property <a href="${generatePropertyUrl(property)}">${generatePropertyUrl(property)}</a></span>
                </div>
              `,
                });
            } else if (state === 'recommendation') {
                await transporter.sendMail({
                    from: "propertyp247@gmail.com",
                    to: [customerData?.email || "", "tanish@techhelps.co.in"],
                    subject: "BuilderFloor Property Recommendation",
                    html: `
                <div style="max-width: 90%; margin: auto; padding-top: 20px;">
                  <br/>
                  <span style="font-weight:800; display:block;">You have some new recommendations on <a href="https://builderfloor.com/account/tabs?tab=recommendations">https://builderfloor.com/account/tabs?tab=recommendations</a></span>
                  <br/>
                  <span style="font-weight:800; display:block;">Check out the recommended property <a href="${generatePropertyUrl(property)}">${generatePropertyUrl(property)}</a></span>
                </div>
              `,
                });
            }
        }
        res.status(200).json({ status: 200, message: "Property updated successfully." });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message })
    }
}

const getUserHistory = async (req, res, next) => {
    try {
        const states = ["visited", "contacted", "searches", "recommendation"];
        const { userId } = req.query;
        const { state } = req.params;
        if (!states.includes(state)) {
            return res.status(400).json({ status: 400, message: "Invalid state." })
        }
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) || 10;
        let skip = page * limit;
        let data = await userHistory.find({ userId, type: state }).sort({ updatedAt: -1 }).populate("userId").populate("propertyId").skip(skip).limit(limit);
        const totalDocuments = await userHistory.countDocuments({ userId, type: state });
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

const getCpUserHistory = async (req, res, next) => {
    try {
        const states = ["visited", "contacted", "searches", "recommendation"];
        const { cpId } = req.query;
        const { state } = req.params;
        if (!states.includes(state)) {
            return res.status(400).json({ status: 400, message: "Invalid state." })
        }
        // const user = await users.findOne({ _id: cpId }).select("_id role");
        // let pid = user.role == "ChannelPartner" ? user?._id : user?.pid;
        let page = Number(req.query.page) || 0;
        const limit = Number(req.query.limit) || 10;
        let skip = page * limit;
        let data = await userHistory.find({ parentId: cpId, type: "contacted" }).sort({ updatedAt: -1 }).populate("userId").populate("parentId").populate("propertyId").skip(skip).limit(limit);
        const totalDocuments = await userHistory.countDocuments({ parentId: cpId, type: "contacted" });
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
    changeProperty,
    createUserHistory,
    getUserHistory,
    getCpUserHistory,
    createAndUpdateProperty
}