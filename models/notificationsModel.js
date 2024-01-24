import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationsSchema = new Schema(
  {
    status: { type: String },
    type: { type: String },
    subType: { type: String },
    title: { type: String },
    details: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: 'users' },
    admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notifications = mongoose.model("notifications", notificationsSchema);

export default notifications;