import mongoose from "mongoose";
const { Schema } = mongoose;

const propertiesSchema = new Schema(
  {
    state: { type: String },
    city: { type: String },
    sectorNumber: { type: String },
    plotNumber: { type: String },
    size: { type: String },
    sizeType: { type: String },
    floor: { type: String },
    price: { type: Number },
    accommodation: { type: String },
    facing: { type: String },
    parkFacing: { type: String },
    corner: { type: String },
    possession: { type: String },
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
  },
  { timestamps: true }
);

const properties = mongoose.model("properties", propertiesSchema);

export default properties;
