import mongoose from "mongoose";
const { Schema } = mongoose;

const otpSchema = new Schema(
    {
        email: { type: String, required: true },
        phone: { type: String },
        otp: { type: String, required: true },
    },
    { timestamps: true, versionKey: false }
);

const otp = mongoose.model("otp", otpSchema);

export default otp;
