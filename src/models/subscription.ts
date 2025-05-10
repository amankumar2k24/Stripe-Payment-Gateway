import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    checkoutSession: { type: String, default: null },
    invoice: { type: String, default: null },
    mode: { type: String, default: null },
    paymentStatus: { type: String, default: null },
    subscription: { type: String, default: null },
    subscriptionExpiresAt: { type: Date, default: null, required: false },
    webhook: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const subscriptionModel = mongoose.model<any>("subscription", subscriptionSchema);