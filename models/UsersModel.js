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
  },
  { timestamps: true }
);

const users = mongoose.model("Users", UsersSchema);

export default users;
