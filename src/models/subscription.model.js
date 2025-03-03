import mongoose, { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // One who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // Channel being subscribed to ny subscriber
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);
