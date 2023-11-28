import mongoose from "mongoose";
const { Schema } = mongoose;

const ReachOutUserSchema = new Schema(
    {
        phoneNumber: { type: String, unique: true, require: [true, "phone number is required "] },
        contacted: { type: String, default: "No" }
    },
    { timestamps: true }
);

const reachOutUser = mongoose.model("reachOutUser", ReachOutUserSchema);

export default reachOutUser;
