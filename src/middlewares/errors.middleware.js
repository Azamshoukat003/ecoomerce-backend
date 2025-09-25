import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    // console.error(err); // log in backend for debugging

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    // fallback for unexpected errors
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

export { errorHandler };
