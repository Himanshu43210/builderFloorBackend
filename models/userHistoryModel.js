import mongoose from "mongoose";
const { Schema } = mongoose;

const userHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "customers"
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
        },
        parentId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "users"
        },
        options: []
    },
    { timestamps: true }
);

const userHistory = mongoose.model("userHistory", userHistorySchema);

export default userHistory;
