import express from "express";
import { Event } from "../Models/Events.js";
import multer from "multer";
import path from "path"; // To manage file paths

const router = express.Router();

// Configure multer storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to store uploaded images
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },

});

var upload = multer({ storage: storage });

// Route to create an event with image upload
router.post("/event", upload.single("image"), async (req, res) => {
    try {
        const { title, description, startTime, endTime, speaker } = req.body;

        // Check if an image was uploaded
        if (!req.file) {
            return res.status(400).json({ status: false, message: "Image is required" });
        }

        const imageName = req.file.filename; // Get the uploaded image's filename

        // Create new event
        const newEvent = new Event({
            title,
            description,
            image: imageName, // Store the image filename or path in the database
            startTime,
            endTime,
            speaker,
        });

        // Save event to the database
        await newEvent.save();

        return res.json({ status: true, message: "Event scheduled successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
});

export { router as EventRouter };
