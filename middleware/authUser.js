import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const verifyUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ status: false, message: "Not authenticated" });
        }

        const decoded = await jwt.verify(token, process.env.KEY);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({ status: false, message: "Invalid or expired token" });
    }
};

// Middleware for verifying admin role
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') { // Assuming the role is attached to the `req.user`
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next(); // If role is 'admin', proceed to the next middleware or route
};

export { verifyUser, verifyAdmin }
