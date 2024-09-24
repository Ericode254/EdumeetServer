import express from 'express'
import bcryt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../Models/Users.js'
import { verifyUser } from '../middleware/authUser.js'
import nodemailer from "nodemailer"
import dotenv from 'dotenv'


const router = express.Router()
dotenv.config()

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body
  const user = await User.findOne({ email })

  if (user) {
    return res.json({ message: "The email is already registered" })
  }

  const hashPassword = await bcryt.hash(password, 10)

  const newUser = new User({
    username,
    email,
    password: hashPassword
  })

  await newUser.save()
  return res.json({ status: true, message: "User created successfully" })

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

    const token = jwt.sign({ username: user.username, id: user._id, role: user.role }, process.env.KEY, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // Set maxAge to 1 hour
    return res.json({ status: true, message: "Login successful", token: token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
})

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    return res.json({ message: "User not registered" })
  }

  const token = jwt.sign({ id: user._id }, process.env.KEY, { expiresIn: "5m" })

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  var mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Password',
    text: `http://localhost:5173/resetpassword/${token}`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return res.json({ message: "Email failed to send" })
    } else {
      return res.json({ status: true, message: "Email sent" })
    }
  });


})

router.post("/resetpassword/:token", async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  try {
    const decoded = await jwt.verify(token, process.env.KEY)
    await User.findByIdAndUpdate(decoded.id, { password: await bcryt.hash(password, 10) })
    return res.json({ status: true, message: "Password updated" })
  } catch (err) {
    return res.json({ message: "Invalid token" })
  }

})

router.get("/verify", verifyUser, (req, res) => {
  return res.json({ status: true, message: "Verified" });
});


router.get("/logout", (req, res) => {
  res.clearCookie("token")
  return res.json({ status: true, message: "Logged out" })
})

router.get("/profile", async (req, res) => {
  try {
    // Retrieve token from cookies
    const token = req.cookies.token;
    // console.log(token);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.KEY);

    // Fetch user from the database using the decoded token's user ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the user's information
    return res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error in profile route:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid or Malformed Token" });
  }
});

// Route to get user role by userId
router.get('/user/:id', verifyUser, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId, 'role name'); // Fetch only the role and name fields

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    return res.status(200).json({ status: true, role: user.role, name: user.name });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Route to get all users (for admin dashboard)
router.get('/users', verifyUser, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Forbidden: Only admin can access this route' });
    }

    const users = await User.find(); // Fetch all users
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Route to update a user's role
router.put('/user/:id/role', verifyUser, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Forbidden: Only admin can access this route' });
    }

    // Validate role
    if (!['admin', 'user', 'publisher'].includes(role)) {
      return res.status(400).json({ status: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    return res.status(200).json({ status: true, message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Route to delete a user
router.delete('/user/:id', verifyUser, async (req, res) => {
  const userId = req.params.id;

  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Forbidden: Only admin can access this route' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    return res.status(200).json({ status: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
});


export { router as UserRouter }
