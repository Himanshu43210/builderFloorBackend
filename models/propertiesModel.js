import mongoose from "mongoose";
const { Schema } = mongoose;

const propertiesSchema = new Schema(
  {
    state: { type: String, uppercase: true },
    city: { type: String, uppercase: true },
    sectorNumber: { type: String, uppercase: true },
    plotNumber: { type: String, uppercase: true },
    size: { type: Number },
    sizeType: { type: String, uppercase: true },
    floor: { type: String, uppercase: true },
    price: { type: Number },
    accommodation: { type: String, uppercase: true },
    facing: { type: String, uppercase: true },
    parkFacing: { type: String, uppercase: true },
    corner: { type: String, uppercase: true },
    possession: { type: String, uppercase: true },
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
    mostVisited: { type: Number, default: 0 },
    mostVisitedDate: { type: Date },
    contactCLicked: { type: Number, default: 0 },
    contactCLickedDate: { type: Date },
  },
  { timestamps: true }
);

const properties = mongoose.model("properties", propertiesSchema);

export default properties;
