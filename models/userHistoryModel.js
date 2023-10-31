import mongoose from "mongoose";
const { Schema } = mongoose;

const userHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "users"
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "properties"
        },
        type: {
            type: String,
            required: true,
        },
        counts: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const userHistory = mongoose.model("userHistory", userHistorySchema);

export default userHistory;
