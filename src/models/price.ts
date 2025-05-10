import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    object: { type: String, default: null },
    active: { type: Boolean, default: null },
    billing_scheme: { type: String, default: null },
    created: { type: Number, default: null },
    currency: { type: String, default: null },
    custom_unit_amount: { type: String, default: null },
    livemode: { type: Boolean, default: null },
    lookup_key: { type: String, default: null },
    metadata: { type: Object, default: {} },
    nickname: { type: String, default: null },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product", default: null },
    recurring: {
      interval: { type: String, default: null },
      interval_count: { type: Number, default: null },
      trial_period_days: { type: Number, default: null },
      usage_type: { type: String, default: null },
    },
    tax_behavior: { type: String, default: null },
    tiers_mode: { type: String, default: null },
    transform_quantity: { type: String, default: null },
    type: { type: String, default: null },
    unit_amount: { type: Number, default: null },
    unit_amount_decimal: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const priceModel = mongoose.model<any>("price", priceSchema);