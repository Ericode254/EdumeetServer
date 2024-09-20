import mongoose from "mongoose";

const EventsSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    speaker: {type: String, required: true},
    likes: {type: Number},
    dislikes: {type: Number},
    reminder: {type: Boolean}
})

const EventsModel = mongoose.model("Event", EventsSchema)

export { EventsModel as Event}
