import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'admin', 'publisher'] },
})

const UserModel = mongoose.model('User', UserSchema)

export { UserModel as User }
