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


// Get like/dislike counts for a specific card
router.get("/card/:id/reactions", async (req, res) => {
    try {
        const card = await Event.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }
        res.json({ likes: card.likes, dislikes: card.dislikes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Increment like count
router.post("/card/:id/like", async (req, res) => {
    const userId = req.body.userId; // Assume the user ID is sent in the request body
    try {
        const card = await Event.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        // Check if user has already reacted
        const existingReaction = card.userReactions.find(reaction => reaction.userId === userId);
        if (existingReaction) {
            if (existingReaction.reaction === 'like') {
                return res.status(400).json({ message: "You have already liked this card." });
            } else {
                // If they previously disliked, update counts accordingly
                card.dislikes -= 1;
                card.likes += 1;
                existingReaction.reaction = 'like'; // Update to like
            }
        } else {
            // Add new like
            card.likes += 1;
            card.userReactions.push({ userId, reaction: 'like' });
        }

        await card.save();
        res.json({ likes: card.likes, dislikes: card.dislikes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Increment dislike count
router.post("/card/:id/dislike", async (req, res) => {
    const userId = req.body.userId; // Assume the user ID is sent in the request body
    try {
        const card = await Event.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        // Check if user has already reacted
        const existingReaction = card.userReactions.find(reaction => reaction.userId === userId);
        if (existingReaction) {
            if (existingReaction.reaction === 'dislike') {
                return res.status(400).json({ message: "You have already disliked this card." });
            } else {
                // If they previously liked, update counts accordingly
                card.likes -= 1;
                card.dislikes += 1;
                existingReaction.reaction = 'dislike'; // Update to dislike
            }
        } else {
            // Add new dislike
            card.dislikes += 1;
            card.userReactions.push({ userId, reaction: 'dislike' });
        }

        await card.save();
        res.json({ likes: card.likes, dislikes: card.dislikes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


export { router as EventRouter };
