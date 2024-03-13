import mongoose from "mongoose";
const { Schema } = mongoose;

const contentModel = new Schema(
    {
        heading: {
            type: String,
            required: true
        },
        content: {
            type: String,
        },
        file: {
            type: String,
        },
        date: {
            type: Date,
        },
        category: {
            type: String,
            required: true
        },
    },
    { versionKey: false, timestamps: true, collection: "content" }
);

const content = mongoose.model("content", contentModel);

export default content;
