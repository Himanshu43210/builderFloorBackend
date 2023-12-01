import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationsSchema = new Schema(
  {
    status: { type: String },
    details: { type: String },
    type: { type: String },
    subType: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: 'users' }
  },
  { timestamps: true }
);

const notifications = mongoose.model("notifications", notificationsSchema);

export default notifications;