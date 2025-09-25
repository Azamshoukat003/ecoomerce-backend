import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResonse.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import bcrypt from "bcrypt";

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

const cookieOptions = {
    httpOnly: true,
    secure: false,
    path: "/",
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    console.log(name, email, password);
    if ([name, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required");
    }

    const existingUser = await User.findOne({ email });
    console.log(existingUser, "existing User");

    if (existingUser) {
        console.log(existingUser.email, "existing User");
        throw new ApiError(409, "Users with email is already exist");
    }

    const otp = generateOTP();
    if (!otp) {
        console.log("Error occur while generating Otp");
    }
    const hashedOTP = await bcrypt.hash(otp, 10);

    await User.create({
        name,
        email,
        password,
        isVerified: false,
        otp: hashedOTP,
        optExpires: Date.now() + 5 * 60 * 1000,
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your account - OTP Code",
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">🔐 Verify your account</h2>
            <p>Hi ${name},</p>
            <p>Use the OTP below to verify your account. This OTP is valid for <b>5 minutes</b>.</p>
            <h1 style="color: #2e86de; text-align: center;">${otp}</h1>
            <p>If you did not request this, you can safely ignore this email.</p>
            <br/>
            <p style="font-size: 12px; color: #777;">— The MyApp Team</p>
            </div>
        </div>
  `,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { email },
                "Otp sent to your email. Please Verify"
            )
        );
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw new ApiError(404, "User not found");
    if (user.isVerified) throw new ApiError(400, "User already verified");
    if (!user.otp || !user.optExpires) throw new ApiError(400, "No OTP found");
    if (Date.now() > user.optExpires) throw new ApiError(400, "OTP expired");

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) throw new ApiError(400, "Invalid OTP");

    user.isVerified = true;
    user.otp = undefined;
    user.optExpires = undefined;
    await user.save();

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while register the user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User Register Successfully"));
    // return res.json(new ApiResponse(200, {}, "Account verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email && !password) {
        throw new ApiError(404, "Email and Password is required");
    }

    const user = await User.findOne({ email });
    console.log(user, "User");
    if (!user) {
        throw new ApiError(404, "User Does not exist");
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your account via OTP first");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log(isPasswordValid, "password");
    if (!isPasswordValid) {
        throw new ApiError(404, "Password is Incorrect");
    }

    const tokenExpiry = rememberMe ? "7d" : "1m";
    const accessToken = user.generateAccessToken(tokenExpiry);

    const loggedInUser = await User.findById(user._id).select("-password");

    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken },
                "User Logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findById(req.user._id);

    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User Logged out Successfully"));
});
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is required");
    console.log(email);

    const user = await User.findOne({ email });
    if (!user) {
        // don't reveal if user exists
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "If this email exists, an OTP was sent"
                )
            );
    }

    // generate OTP
    const otp = generateOTP();
    console.log(otp);

    user.otp = otp;
    user.optExpires = Date.now() + 10 * 60 * 1000;
    const n = await user.save({ validateBeforeSave: false });
    console.log(n);

    await sendEmail({
        to: user.email,
        subject: "Password Reset OTP",
        text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
    });
    console.log("sun");
    res.status(200).json(new ApiResponse(200, {}, "OTP sent to your email"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        throw new ApiError(400, "Email, OTP, and password are required");
    }

    const user = await User.findOne({
        email,
        otp,
        optExpires: { $gt: Date.now() }, // check expiry
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    user.password = password; // hashing will happen in pre-save hook if you have it
    user.otp = undefined;
    user.optExpires = undefined;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

export { registerUser, loginUser, logoutUser, verifyOtp, forgotPassword };
