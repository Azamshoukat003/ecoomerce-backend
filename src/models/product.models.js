import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        productImage: {
            type: String,
            required: true,
        },
        productName: {
            type: String,
            required: true,
            lowercase: true,
        },
        productPrice: {
            type: String,
            required: true,
        },
        productDiscountPrice: {
            type: String,
        },
        productCategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
        productModel: {
            type: Schema.Types.ObjectId,
            ref: "Model",
        },
    },
    { timestamps: true }
);
const categorySchema = new Schema(
    {
        categoryName: {
            type: String,
            lowercase: true,
        },
    },
    { timestamps: true }
);
const modelSchema = new Schema(
    {
        modelName: {
            type: String,
            lowercase: true,
        },
    },
    { timestamps: true }
);

const heroSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        desc: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const subscribeSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
});

export const Subscribe = mongoose.model("Subscribe", subscribeSchema);
export const Hero = mongoose.model("Hero", heroSchema);

export const Product = mongoose.model("Product", productSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Model = mongoose.model("Model", modelSchema);
