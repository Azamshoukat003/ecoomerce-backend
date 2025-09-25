import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log(response, "respone");
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async (imageUrl) => {
    try {
        const publicId = extractPublicId(imageUrl);
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return null;
    }
};

function extractPublicId(url) {
    try {
        // remove query params if exist
        const cleanUrl = url.split("?")[0];

        // get part after `/upload/`
        const parts = cleanUrl.split("/upload/");
        if (parts.length < 2) return null;

        // remove extension (.jpg, .png, etc.)
        const publicIdWithExt = parts[1].split("/").slice(1).join("/");
        // ^ this keeps subfolders if you used any

        return publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension
    } catch (e) {
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };
