import mongoose from "mongoose";
const { Schema } = mongoose;

const mastersSchema = new Schema(
  {
    fieldName: { type: String },
    fieldLabel: { type: String },
    fieldValue: { type: String },
    parentId: { type: String },
  },
  { timestamps: true }
);

const masters = mongoose.model("masters", mastersSchema);

export default masters;
