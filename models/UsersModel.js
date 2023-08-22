import mongoose from "mongoose";
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
    address: { type: String },
    password: { type: String },
    role: { type: String, require: [true, "role is required "] },
    parentId: { type: String },
    companyName: { type: String },
    companyAddress: { type: String },
    state: { type: String },
    city: { type: String },
  },
  { timestamps: true }
);

const users = mongoose.model("users", UsersSchema);

export default users;
