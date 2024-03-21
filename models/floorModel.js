import mongoose from "mongoose";
const { Schema } = mongoose;

const floorSchema = new Schema(
    {
        propertyId: { type: mongoose.Types.ObjectId, ref: 'users' },
        floor: { type: String, uppercase: true },
        price: { type: Number },
        possession: { type: String, uppercase: true },
    },
    { timestamps: true, versionKey: false }
);

const floors = mongoose.model("floors", floorSchema);

export default floors;
