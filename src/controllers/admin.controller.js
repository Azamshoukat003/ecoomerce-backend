import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResonse.js";
import { Admin } from "../models/admin.models.js";

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    //"email":"azamdummy125@gmail.com",
    //"password":12467
    console.log("admin cretaed");
    if (!email && !password) {
        throw new ApiError(404, "Email and Password is required");
    }

    const userAdmin = await Admin.findOne({ email });
    // console.log(userAdmin, "User");
    if (!userAdmin) {
        throw new ApiError(404, "User Does not exist");
    }

    const isPasswordValid = await userAdmin.isPasswordCorrect(password);
    // console.log(isPasswordValid, "password");
    if (!isPasswordValid) {
        throw new ApiError(404, "Password is Incorrect");
    }

    const tokenExpiry = "7d";
    const accessToken = userAdmin.generateAccessToken(tokenExpiry);
    console.log(accessToken);
    const loggedInUser = await Admin.findById(userAdmin._id).select(
        "-password"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { admin: loggedInUser, accessToken },
                "Login Successfully"
            )
        );
});

export { loginAdmin };
