import mongoose from "mongoose";
const { Schema } = mongoose;

const CustomerSchema = new Schema(
    {
        fullName: { type: String, require: [true, "name is required "] },
        phoneNumber: { type: String, unique: true, require: [true, "phone number is required "] },
        email: { type: String },
        role: { type: String, default: "customer" },
        status: { type: String, default: "active" },
        filters: { type: Schema.Types.Mixed },
        pid: { type: Schema.Types.ObjectId, ref: "users" }
    },
    { timestamps: true }
);

const customers = mongoose.model("customers", CustomerSchema);

export default customers;
