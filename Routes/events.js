import express from "express";
import { Event } from "../Models/Events.js";
import multer from "multer";

const router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }

});

var upload = multer({ storage: storage });

router.post("/event", upload.single("image"), async (req, res) => {
    try {
        const { title, description, startTime, endTime, speaker } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: false, message: "Image is required" });
        }

        const imageName = req.file.filename;

        const newEvent = new Event({
            title,
            description,
            image: imageName,
            startTime,
            endTime,
            speaker,
        });

        await newEvent.save();

        return res.json({ status: true, message: "Event scheduled successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
});

router.get('/cards', async (req, res) => {
    try {
      const events = await Event.find();

      res.json(events);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ error: 'An error occurred while fetching events.' });
    }
  });

export { router as EventRouter };
