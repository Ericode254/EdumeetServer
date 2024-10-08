import mongoose from "mongoose";

const EventsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    eventDay: { type: String, required: true },
    speaker: { type: String, required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    userReactions: [{ userId: String, reaction: String }],
    reminder: { type: Boolean, default: false },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // assuming you have user authentication and creator is a reference to the User model
    },
})

const EventsModel = mongoose.model("Event", EventsSchema)

export { EventsModel as Event }
