import properties from "../models/propertiesModel.js";
import newproperties from "../models/newPropertiesModel.js";
import floors from "../models/floorModel.js";

// const create = async (req, res) => {
//     try {
//         const result = await properties.find().select({ _id: 0 });
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

export default {
    createAndUpdateProperty
}