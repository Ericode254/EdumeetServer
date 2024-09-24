import express from "express";
import { Event } from "../Models/Events.js";
import { verifyUser } from "../middleware/authUser.js";
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

router.post("/event", verifyUser, upload.single("image"), async (req, res) => {
    const userId = req.user.id
    console.log(userId);


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
            creatorId: userId
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
router.post("/card/:id/like", verifyUser, async (req, res) => {
    const userId = req.user.userId; // Assume the user ID is sent in the request body
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
router.post("/card/:id/dislike", verifyUser, async (req, res) => {
    const userId = req.user.userId; // Assume the user ID is sent in the request body
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

// GET: Fetch an event by ID (for editing)
router.get('/card/:id', verifyUser, async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ status: false, message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ status: false, message: 'Error fetching event' });
    }
});

// PUT: Update an existing event
router.put('/event/:id', verifyUser, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, description, startTime, endTime, speaker } = req.body;
    const image = req.file ? req.file.filename : null;

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ status: false, message: 'Event not found' });
        }

        // Update the event fields
        event.title = title || event.title;
        event.description = description || event.description;
        if (image) {
            event.image = image;
        }
        event.startTime = startTime || event.startTime;
        event.endTime = endTime || event.endTime;
        event.speaker = speaker || event.speaker;

        await event.save();
        res.status(200).json({ status: true, message: 'Event updated successfully', event });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ status: false, message: 'Error updating event' });
    }
});

// DELETE: Delete an event by ID
router.delete('/event/:id', verifyUser, async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findByIdAndDelete(id);
        if (!event) {
            return res.status(404).json({ status: false, message: 'Event not found' });
        }

        res.status(200).json({ status: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ status: false, message: 'Error deleting event' });
    }
});

export { router as EventRouter };
