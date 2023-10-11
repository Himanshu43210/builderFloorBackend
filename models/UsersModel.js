import mongoose from "mongoose";
import { BUILDER_FLOOR_ADMIN } from "../const.js";
const { Schema } = mongoose;

const UsersSchema = new Schema(
  {
    name: { type: String, require: [true, "name is required "] },
    email: {
      type: String,
      require: [true, "email is required "],
      unique: true,
    },
    phoneNumber: { type: String },
    // address: { type: String },
    password: { type: String },
    role: { type: String, require: [true, "role is required "] },
    parentId: { type: String },
    companyName: { type: String },
    companyAddress: { type: String },
    state: { type: String },
    city: { type: String },
    location: { type: Array },
    status: { type: String, default: "active" },
    filters: { type: Schema.Types.Mixed },
    pid: { type: Schema.Types.ObjectId, ref: "users" }
  },
  { timestamps: true }
);

UsersSchema.methods.isBuilderAdmin = async function () {
  return this.role === BUILDER_FLOOR_ADMIN;
};

const users = mongoose.model("users", UsersSchema);

export default users;
