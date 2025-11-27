const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB Atlas Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas Connected ✅"))
    .catch((err) => console.error("Atlas Connection Error ❌:", err));

// User Schema & Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Signup Route
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists ⚠️" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Signup successful 🎉" });
    } catch (error) {
        res.status(500).json({ message: "Error signing up ❌" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found ❌" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials ❌" });

        res.json({ message: "Login successful ✅", user: { username: user.username } });
    } catch (error) {
        res.status(500).json({ message: "Error logging in ❌" });
    }
});

// Home Route (Accessible After Login)
app.get("/home", (req, res) => {
    res.json({ message: "Welcome to the Home Page! 🏠✨" });
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
