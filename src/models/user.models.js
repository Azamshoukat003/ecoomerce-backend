import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is Required"],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        optExpires: {
            type: Date,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (expiry) {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
        },
        process.env.ACCESS_TOKEN_SECERT,
        {
            expiresIn: expiry || process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
