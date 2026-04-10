import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/connection.js";

const router = express.Router();
const collection = db.collection("courses");

// Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await collection.find({}).toArray();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Search courses by class code
router.get("/search/:classCode", async (req, res) => {
  try {
    const classCode = req.params.classCode.toUpperCase();
    const course = await collection.findOne({ classCode: classCode });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search course" });
  }
});

// Get a single course by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }
    const course = await collection.findOne({ _id: new ObjectId(id) });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Add a new course
router.post("/", async (req, res) => {
  try {
    const { classCode, courseName, description, instructor, credits } = req.body;

    // Validate class code format (3 letters followed by 4 numbers)
    const codeRegex = /^[A-Z]{3}\d{4}$/;
    if (!classCode || !codeRegex.test(classCode)) {
      return res.status(400).json({ error: "Invalid class code format. Use 3 letters followed by 4 numbers (e.g., EEL4744)" });
    }

    if (!courseName || !courseName.trim()) {
      return res.status(400).json({ error: "Course name is required" });
    }

    // Check if course already exists
    const existing = await collection.findOne({ classCode: classCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: "A course with this class code already exists" });
    }

    const newCourse = {
      classCode: classCode.toUpperCase(),
      courseName: courseName.trim(),
      description: description || "",
      instructor: instructor || "",
      credits: credits || 3,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newCourse);
    const created = await collection.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// Update a course
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const updates = req.body;
    delete updates._id;
    updates.updatedAt = new Date();

    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found or no changes" });
    }

    const updated = await collection.findOne({ _id: new ObjectId(id) });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Delete a course
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const { deletedCount } = await collection.deleteOne({ _id: new ObjectId(id) });
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ message: "Course removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Post a comment on a course
router.post("/:id/comments", async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const { userName, email, commentText } = req.body;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "User name is required" });
    }

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const newComment = {
      _id: new ObjectId(),
      userName: userName.trim(),
      email: email || "",
      commentText: commentText.trim(),
      replies: [],
      createdAt: new Date(),
    };

    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectId(courseId) },
      { $push: { comments: newComment } }
    );

    if (modifiedCount === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updated = await collection.findOne({ _id: new ObjectId(courseId) });
    res.status(201).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Get comments for a course
router.get("/:id/comments", async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const course = await collection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course.comments || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Post a reply to a comment
router.post("/:courseId/comments/:commentId/replies", async (req, res) => {
  try {
    const { courseId, commentId } = req.params;

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid course or comment ID" });
    }

    const { userName, email, replyText } = req.body;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "User name is required" });
    }

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const newReply = {
      _id: new ObjectId(),
      userName: userName.trim(),
      email: email || "",
      replyText: replyText.trim(),
      createdAt: new Date(),
    };

    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectId(courseId), "comments._id": new ObjectId(commentId) },
      { $push: { "comments.$.replies": newReply } }
    );

    if (modifiedCount === 0) {
      return res.status(404).json({ error: "Course or comment not found" });
    }

    const updated = await collection.findOne({ _id: new ObjectId(courseId) });
    res.status(201).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post reply" });
  }
});

export default router;

