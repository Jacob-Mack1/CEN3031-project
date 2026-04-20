import express from "express";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getCollection } from "../db/connection.js";

const router = express.Router();

async function col() {
  return getCollection("records");
}

router.get("/", async (req, res) => {
  try {
    const collection = await col();
    const records = await collection.find({}).toArray();
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

router.get("/check-username/:username", async (req, res) => {
  try {
    const collection = await col();
    const { username } = req.params;
    const existing = await collection.findOne({ username: username.toLowerCase() });
    res.json({ exists: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check username" });
  }
});

router.get("/check-email/:email", async (req, res) => {
  try {
    const collection = await col();
    const { email } = req.params;
    const existing = await collection.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check email" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const collection = await col();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }
    const record = await collection.findOne({ _id: new ObjectId(id) });
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

router.post("/", async (req, res) => {
  try {
    const collection = await col();
    const { username, email, password, anonymous, avatar } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Validate avatar size (max 5MB)
    if (avatar && typeof avatar === 'string' && avatar.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Avatar image is too large. Maximum size is 5MB." });
    }

    // Check for existing username
    const existingUsername = await collection.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Check for existing email
    const existingEmail = await collection.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const newRecord = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      anonymous: !!anonymous,
      isModerator: false,
      avatar: avatar || null,
      followedCourses: [],
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newRecord);
    const created = await collection.findOne({ _id: result.insertedId });
    
    res.status(201).json({ 
      user: {
        _id: created._id,
        username: created.username,
        email: created.email,
        avatar: created.avatar,
        anonymous: created.anonymous,
        isModerator: created.isModerator || false,
        followedCourses: created.followedCourses || [],
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create record: " + err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const collection = await col();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await collection.findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar, anonymous: user.anonymous, isModerator: user.isModerator || false, followedCourses: user.followedCourses || [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/:id/make-moderator", async (req, res) => {
  try {
    const collection = await col();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isModerator: true } },
      { returnDocument: "after" }
    );

    const userDoc = updated?.value || updated;
    if (!userDoc || !userDoc._id) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({
      message: "User is now a moderator",
      user: {
        _id: userDoc._id,
        username: userDoc.username,
        email: userDoc.email,
        avatar: userDoc.avatar,
        anonymous: userDoc.anonymous,
        isModerator: userDoc.isModerator || false,
        followedCourses: userDoc.followedCourses || [],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign moderator role" });
  }
});
// Toggle follow status for a course
router.post("/:userId/follow-course", async (req, res) => {
  try {
    const collection = await col();
    const { userId } = req.params;
    const { courseId, courseData } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if course is already followed
    const courseIdStr = courseId.toString();
    const isFollowed = user.followedCourses && user.followedCourses.some(course => {
      const storedIdStr = course._id ? course._id.toString() : '';
      return storedIdStr === courseIdStr;
    });
    
    let updatedUser;
    if (isFollowed) {
      // Remove from followed courses
      updatedUser = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $pull: { followedCourses: { _id: new ObjectId(courseId) } } },
        { returnDocument: "after" }
      );
    } else {
      // Add to followed courses - ensure courseId is properly set
      const courseToAdd = {
        ...courseData,
        _id: new ObjectId(courseId)
      };
      updatedUser = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $push: { followedCourses: courseToAdd } },
        { returnDocument: "after" }
      );
    }

    if (!updatedUser) {
      console.error('Failed to update user - updatedUser is null:', { userId, courseId });
      return res.status(500).json({ error: "Failed to update user" });
    }

    // Handle both MongoDB driver responses - some versions return { value }, others return the document directly
    const userDoc = updatedUser.value || updatedUser;
    
    if (!userDoc || !userDoc._id) {
      console.error('Failed to extract user document:', { userId, courseId, updatedUser, userDoc });
      return res.status(500).json({ error: "Failed to update user" });
    }

    res.json({ 
      user: {
        _id: userDoc._id,
        username: userDoc.username,
        email: userDoc.email,
        avatar: userDoc.avatar,
        anonymous: userDoc.anonymous,
        isModerator: userDoc.isModerator || false,
        followedCourses: userDoc.followedCourses || [],
      }
    });
  } catch (err) {
    console.error('Error in follow-course endpoint:', err);
    res.status(500).json({ error: "Failed to toggle follow status" });
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const collection = await col();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const updates = { ...req.body };
    delete updates._id;

    // Check for username uniqueness if updating username
    if (updates.username) {
      const existingUser = await collection.findOne({ 
        username: updates.username.toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      });
      if (existingUser) {
        return res.status(409).json({ error: "Username already taken" });
      }
      updates.username = updates.username.toLowerCase();
    }

    // Check for email uniqueness if updating email
    if (updates.email) {
      const existingEmail = await collection.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already registered" });
      }
      updates.email = updates.email.toLowerCase();
    }

    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (modifiedCount === 0) {
      return res.status(404).json({ error: "Record not found or no changes" });
    }

    const updated = await collection.findOne({ _id: new ObjectId(id) });
    res.json({ 
      user: {
        _id: updated._id,
        username: updated.username,
        email: updated.email,
        avatar: updated.avatar,
        anonymous: updated.anonymous,
        isModerator: updated.isModerator || false,
      }
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update record: " + err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const collection = await col();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const { deletedCount } = await collection.deleteOne({ _id: new ObjectId(id) });
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

export default router;
