import mongoose from "mongoose";
const { Schema } = mongoose;

const propertiesSchema = new Schema(
  {
    state: { type: String },
    city: { type: String },
    location: { type: String },
    plotNumber: { type: String },
    size: { type: String },
    sizeType: { type: String },
    floor: { type: String },
    price: { type: Number },
    accommodation: { type: String },
    facing: { type: String },
    parkFacing: { type: Boolean },
    corner: { type: Boolean },
    possession: { type: String },
    builderName: { type: String },
    builderContact: { type: String },
    title: { type: String },
    detailTitle: { type: String },
    description: { type: String },
    parentId: { type: mongoose.Types.ObjectId },
    contactId: { type: String },
    needApprovalBy: { type: String },
    thumbnails: { type: Array },
    images: { type: Array },
    normalImages: { type: Array },
    videos: { type: Array },
    layouts: { type: Array },
    virtualFiles: { type: Array },
    rejectedByBFAdmin: { type: String },
    rejectedByBFAdminComments: { type: String },
    rejectedByCP: { type: String },
    rejectedByCPComments: { type: String },
  },
  { timestamps: true }
);

const properties = mongoose.model("propertiesT", propertiesSchema);

export default properties;
