import admin from "firebase-admin";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResonse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
    Category,
    Product,
    Model,
    Hero,
    Subscribe,
} from "../models/product.models.js";

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        ),
    });
}

export const googleLogin = async (req, res) => {
    const { idToken } = req.body; // Firebase ID token from frontend

    // ✅ Verify token with Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decoded;

    // ✅ Check if user exists or create new
    let user = await User.findOne({ email });
    if (!user) {
        // throw new ApiError(400, "User Already Exist with this Email.");
        user = await User.create({
            email,
            name: name || email.split("@")[0],
            password: "google-oauth",
            isVerified: true,
        });
    }

    const loggedInUser = await User.findById(user._id).select("-password");

    // ✅ Generate your own JWT
    const tokenExpiry = "7d";
    const accessToken = await user.generateAccessToken(tokenExpiry);
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        path: "/",
    });

    res.status(201).json(
        new ApiResponse(
            200,
            { loggedInUser, accessToken },
            "User Login Successfully"
        )
    );
};

const addProduct = asyncHandler(async (req, res) => {
    const {
        productName,
        productPrice,
        productDiscountPrice,
        categoryName,
        modelName,
    } = req.body;

    if (
        [productName, productPrice, modelName, categoryName].some(
            (f) => f?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //  Find or create category
    let category = await Category.findOne({ categoryName });
    if (!category) {
        throw new ApiError(401, "Category Name Does not Exist");
    }

    //  Find or create model
    let model = await Model.findOne({ modelName });
    if (!model) {
        throw new ApiError(401, "Modal Name Does not Exist");
    }

    //  Image upload
    const productImagePath = req.files?.productImage?.[0]?.path;
    if (!productImagePath) {
        throw new ApiError(400, "Product Image is required");
    }

    const productImage = await uploadOnCloudinary(productImagePath);
    console.log(productImage, "image");
    if (!productImage) {
        throw new ApiError(400, "Product Image upload failed");
    }

    //  Create product
    const createdProduct = await Product.create({
        productImage: productImage?.url,
        productName,
        productPrice,
        productDiscountPrice,
        productCategory: category._id,
        productModel: model._id,
    });

    // ✅ Populate category & model to return names instead of IDs
    const populatedProduct = await Product.findById(createdProduct._id)
        .populate({ path: "productCategory", select: "categoryName" })
        .populate({ path: "productModel", select: "modelName" });

    const responseData = {
        id: populatedProduct._id,
        productName: populatedProduct.productName,
        productPrice: populatedProduct.productPrice,
        productDiscountPrice: populatedProduct.productDiscountPrice,
        productImage: populatedProduct.productImage,
        categoryName: populatedProduct.productCategory?.categoryName,
        modelName: populatedProduct.productModel?.modelName,
    };

    // console.log(responseData, "res");

    return res
        .status(201)
        .json(new ApiResponse(201, "Product Added Successfully", responseData));
});
// update-product
const getProduct = asyncHandler(async (req, res) => {
    const products = await Product.find()
        .sort({ createdAt: -1 })
        .populate({ path: "productCategory", select: "categoryName" })
        .populate({ path: "productModel", select: "modelName" });

    if (products.length === 0) {
        throw new ApiError(400, "No product currently added");
    }

    // console.log(products);
    return res
        .status(201)
        .json(new ApiResponse(201, products, "Get all product successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // const updates = req.body;
    let { categoryName, modelName, ...updates } = req.body;

    console.log(updates, "updt");

    if (categoryName) {
        const category = await Category.findOne({
            categoryName: categoryName.toLowerCase(),
        });
        if (!category) throw new ApiError(401, "Category Name does not exist");
        updates.productCategory = category._id; // ✅ schema field expects ObjectId
    }

    if (modelName) {
        const model = await Model.findOne({
            modelName: modelName.toLowerCase(),
        });
        if (!model) throw new ApiError(401, "Model Name does not exist");
        updates.productModel = model._id; // ✅ schema field expects ObjectId
    }

    let imageUrl = updates.productImage;

    const productImagePath = req.files?.productImage?.[0]?.path;
    if (productImagePath) {
        const productImage = await uploadOnCloudinary(productImagePath);
        if (!productImage) {
            throw new ApiError(400, "Product Image upload failed");
        }
        imageUrl = productImage.url;
    }

    const product = await Product.findByIdAndUpdate(
        id,
        { ...updates, productImage: imageUrl },
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    res.status(201).json(
        new ApiResponse(201, product, "Product Update Successfully")
    );
});

const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id, "id");
    if (!id) {
        throw new ApiError(402, "Id is required for getting product");
    }

    const product = await Product.findById(id)
        .populate({ path: "productCategory", select: "categoryName" })
        .populate({ path: "productModel", select: "modelName" });

    console.log(product);

    if (!product) {
        throw new ApiError(
            401,
            "This Product is Expired or not exist currently"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product found Sucessfully"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const products = await Product.find({ productCategory: id })
        .populate("productCategory")
        .limit(10);

    if (!products) {
        throw new ApiError(401, "Products Not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Products get successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.productImage) {
        await deleteFromCloudinary(product.productImage);
    }

    await Product.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, "Product Deleted Successfully"));
});

const addCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.body;
    // console.log(categoryName);
    if (categoryName.trim() === "") {
        throw new ApiError(401, "Category Cannot be Empty");
    }

    let existing = await Category.findOne({ categoryName });
    if (existing) {
        throw new ApiError(404, "Category Already Exist");
    }
    const isCategoryExist = await Category.create({ categoryName });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                isCategoryExist,
                "Category Create Successfully"
            )
        );
});

const getCategory = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ createdAt: -1 });
    // console.log(categories);
    if (categories.length < 1) {
        throw new ApiError(401, "No categories Avaiable currently");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, categories, "Get all Categories Successfully")
        );
});
const getModel = asyncHandler(async (req, res) => {
    const models = await Model.find().sort({ createdAt: -1 });
    if (models.length === 0) {
        throw new ApiError(401, "No models Avaiable currently");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, models, "Get all models Successfully"));
});

const addModel = asyncHandler(async (req, res) => {
    const { modelName } = req.body;

    if (modelName.trim() === "") {
        throw new ApiError(401, "Modal Cannot be Empty");
    }

    let existing = await Model.findOne({ modelName });
    if (existing) {
        throw new ApiError(404, "Model Already Exist");
    }
    const isModalExist = await Model.create({ modelName });

    return res
        .status(201)
        .json(new ApiResponse(201, isModalExist, "Model Create Successfully"));
});

const heroSection = asyncHandler(async (req, res) => {
    const { title, desc } = req.body;
    if (!title && !desc) {
        throw new ApiError(402, "Both Title and Decription are required");
    }

    const productImagePath = req.files?.image?.[0]?.path;
    if (!productImagePath) {
        throw new ApiError(400, "Product Image is required");
    }

    const productImage = await uploadOnCloudinary(productImagePath);
    // console.log(productImage, "image");
    if (!productImage) {
        throw new ApiError(400, "Product Image upload failed");
    }

    const createHero = await Hero.create({
        image: productImage?.url,
        title,
        desc,
    });
    console.log(createHero);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { hero: createHero },
                "Details Added Successfully"
            )
        );
});

const getHeroSection = asyncHandler(async (req, res) => {
    const items = await Hero.find().sort({ createdAt: -1 });

    if (items.length === 0) {
        throw new ApiError(401, "There is no currently hero items found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, items, "Successfully get all data"));
});

const deleteHeroSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, " ID is required");
    }

    const product = await Hero.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.image) {
        await deleteFromCloudinary(product.image);
    }

    await Hero.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, "Product Deleted Successfully"));
});

const subscribe = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(402, "Emial is required");
    }

    const isEmailExist = await Subscribe.findOne({ email });

    if (isEmailExist) {
        throw new ApiError(402, "Email already exist");
    }

    await Subscribe.create({ email });
    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                {},
                "Subscribe Successfully for latest Updates"
            )
        );
});

export {
    addProduct,
    addCategory,
    addModel,
    getCategory,
    getProductsByCategory,
    getProductById,
    getModel,
    getProduct,
    updateProduct,
    deleteProduct,
    heroSection,
    getHeroSection,
    deleteHeroSection,
    subscribe,
};
