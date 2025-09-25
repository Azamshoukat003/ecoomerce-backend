import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addCategory,
    addModel,
    googleLogin,
    addProduct,
    getCategory,
    getModel,
    getProduct,
    updateProduct,
    deleteProduct,
    heroSection,
    getHeroSection,
    deleteHeroSection,
    subscribe,
    getProductById,
    getProductsByCategory,
} from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginAdmin } from "../controllers/admin.controller.js";
const router = Router();

// router.route("/me").post(verifyJWT);
router.get("/me", verifyJWT, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
        message: "Token is valid",
    });
});

router.route("/google-login").post(googleLogin);

router.route("/add-category").post(addCategory);
router.route("/get-categories").get(getCategory);

router.route("/add-model").post(addModel);
router.route("/get-models").get(getModel);

router.route("/add-product").post(
    upload.fields([
        {
            name: "productImage",
            maxCount: 1,
        },
    ]),
    addProduct
);
router.route("/update-product/:id").put(
    upload.fields([
        {
            name: "productImage",
            maxCount: 1,
        },
    ]),
    updateProduct
);

router.route("/delete-product/:id").delete(deleteProduct);
router.route("/get-products").get(getProduct);
router.route("/getproduct/:id").get(getProductById);
router.route("/related-products/:id").get(getProductsByCategory);

router.route("/add-hero").post(
    upload.fields([
        {
            name: "image",
            maxCount: 1,
        },
    ]),
    heroSection
);

router.route("/get-hero").get(getHeroSection);
router.route("/delete-hero/:id").delete(deleteHeroSection);

router.route("/admin").post(loginAdmin);
router.route("/subscribe").post(subscribe);

export default router;
