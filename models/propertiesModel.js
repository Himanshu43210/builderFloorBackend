import mongoose from "mongoose";
const { Schema } = mongoose;

const propertiesSchema = new Schema(
  {
    city: { type: String },
    sectorNumber: { type: String },
    plotNumber: { type: String },
    size: { type: Number },
    facing: { type: String },
    accommodation: { type: String },
    parkFacing: { type: Boolean },
    corner: { type: Boolean },
    floor: { type: String },
    possession: { type: String },
    title: { type: String },
    detailTitle: { type: String },
    description: { type: String },
    builderName: { type: String },
    builderContact: { type: Number },
    price: { type: Number },
    address: { type: String },
    editor_choice: { type: Boolean },
    category: { type: String },
    state: { type: String },
    images: { type: Array },
    thumbnails: { type: Array },
    imageType: { type: String },
    folder: { type: String },
    channelPartner: { type: String },
    channelContact: { type: Number },
    thumbnailName: { type: String },
    parentId: { type: String },
    needApprovalBy: { type: String },
    normalImages: { type: Array },
    videos: { type: Array },
    layouts: { type: Array },
    virtualFiles: { type: Array },
  },
  { timestamps: true }
);


const properties = mongoose.model("properties", propertiesSchema);

export default properties;