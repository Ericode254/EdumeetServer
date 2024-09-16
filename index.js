import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { UserRouter } from './Routes/users.js'
import cors from 'cors'
import cookieParser from "cookie-parser";

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))
app.use(cookieParser())
app.use("/auth", UserRouter)

mongoose.connect("mongodb://127.0.0.1:27017/authentication")

app.listen(process.env.PORT, () => {
    console.log("Server is running on port " + process.env.PORT);
})
