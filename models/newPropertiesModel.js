import mongoose from "mongoose";
const { Schema } = mongoose;

const newPropertiesSchema = new Schema(
    {
        state: { type: String, uppercase: true },
        city: { type: String, uppercase: true },
        sectorNumber: { type: String, uppercase: true },
        plotNumber: { type: String, uppercase: true },
        size: { type: Number },
        sizeType: { type: String, uppercase: true },
        accommodation: { type: String, uppercase: true },
        facing: { type: String, uppercase: true },
        parkFacing: { type: String, uppercase: true },
        corner: { type: String, uppercase: true },
        builderName: { type: String },
        builderContact: { type: String },
        title: { type: String },
        detailTitle: { type: String },
        description: { type: String },
        parentId: { type: mongoose.Types.ObjectId, ref: 'users' },
        contactId: { type: String },
        needApprovalBy: { type: String },
        thumbnails: { type: Array, default: [] },
        images: { type: Array, default: [] },
        normalImages: { type: Array, default: [] },
        videos: { type: Array, default: [] },
        layouts: { type: Array, default: [] },
        virtualFiles: { type: Array, default: [] },
        rejectedByBFAdmin: { type: String },
        rejectedByBFAdminComments: { type: String },
        rejectedByCP: { type: String },
        rejectedByCPComments: { type: String },
        floors: { type: [mongoose.Types.ObjectId], default: [], ref: 'floors' },
        ownerContact: { type: String },
    },
    { timestamps: true, versionKey: false }
);

const newproperties = mongoose.model("newproperties", newPropertiesSchema);

export default newproperties;
