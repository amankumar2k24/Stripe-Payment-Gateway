import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    object: { type: String, default: null },
    active: { type: Boolean, default: null },
    attributes: { type: Array, default: [] },
    created: { type: Number, default: null },
    default_price: { type: String, default: null },
    description: { type: String, default: null },
    images: { type: Array, default: [] },
    livemode: { type: Boolean, default: null },
    marketing_features: { type: Array, default: [] },
    metadata: { type: Object, default: {} },
    name: { type: String, default: null },
    package_dimensions: { type: String, default: null },
    shippable: { type: String, default: null },
    statement_descriptor: { type: String, default: null },
    tax_code: { type: String, default: null },
    type: { type: String, default: null },
    unit_label: { type: String, default: null },
    updated: { type: Number, default: null },
    url: { type: String, default: null },
  },
  { timestamps: true }
);

export const productModel = mongoose.model<any>("product", productSchema);