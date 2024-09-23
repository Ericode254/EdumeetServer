import express from 'express'
import bcryt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../Models/Users.js'
import nodemailer from "nodemailer"

const router = express.Router()

router.post("/signup", async (req, res) => {
    const {username, email, password} = req.body
    const user = await User.findOne({email})

    if (user) {
        return res.json({message: "The email is already registered"})
    }

    const hashPassword = await bcryt.hash(password, 10)

    const newUser = new User({
        username,
        email,
        password: hashPassword
    })

    await newUser.save()
    return res.json({status: true, message: "User created successfully"})

})

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: false, message: "User not registered" });
        }

        const validPassword = await bcryt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ status: false, message: "Invalid password" });
        }

        const token = jwt.sign({ username: user.username, id: user._id }, process.env.KEY, { expiresIn: "1h" });

        res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // Set maxAge to 1 hour
        return res.json({ status: true, message: "Login successful", token: token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
})

router.post("/forgot-password", async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if (!user) {
        return res.json({message: "User not registered"})
    }

    const token = jwt.sign({id: user._id}, process.env.KEY, {expiresIn: "5m"})

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'jilloerick6@gmail.com',
          pass: 'rhonhotlxmlvjupu'
        }
      });

      var mailOptions = {
        from: 'jilloerick6@gmail.com',
        to: email,
        subject: 'Reset Password',
        text: `http://localhost:5173/resetpassword/${token}`
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            return res.json({message: "Email failed to send"})
        } else {
          return res.json({status: true, message: "Email sent"})
        }
      });


})

router.post("/resetpassword/:token", async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    try {
        const decoded = await jwt.verify(token, process.env.KEY)
        await User.findByIdAndUpdate(decoded.id, {password: await bcryt.hash(password, 10)})
        return res.json({status: true, message: "Password updated"})
    } catch (err) {
        return res.json({message: "Invalid token"})
    }

})

const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ status: false, message: "Not authenticated" });
    }

    const decoded = await jwt.verify(token, process.env.KEY);

    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: "Invalid or expired token" });
  }
};

router.get("/verify", verifyUser, (req, res) => {
  return res.json({ status: true, message: "Verified" });
});


router.get("/logout", (req, res) => {
    res.clearCookie("token")
    return res.json({status: true, message: "Logged out"})
})

export {router as UserRouter}
