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

    const { userName, email, commentText, avatar } = req.body;

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
      avatar: avatar || "",
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

    const { userName, email, replyText, avatar } = req.body;

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
      avatar: avatar || "",
      replyText: replyText.trim(),
      replies: [],
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
    console.log('Reply posted successfully, returning course with', updated.comments.length, 'comments');
    res.status(201).json(updated);
  } catch (err) {
    console.error('Error posting reply:', err);
    res.status(500).json({ error: "Failed to post reply" });
  }
});

// Helper function to find and update a reply at any nesting depth
function findAndAddReplyAtDepth(replies, replyId, newReply) {
  if (!replies || !Array.isArray(replies)) {
    return false;
  }

  for (let reply of replies) {
    if (reply._id.toString() === replyId) {
      if (!reply.replies) {
        reply.replies = [];
      }
      reply.replies.push(newReply);
      return true;
    }
    // Recursively search in nested replies
    if (findAndAddReplyAtDepth(reply.replies, replyId, newReply)) {
      return true;
    }
  }

  return false;
}

// Report a comment
router.post("/:courseId/comments/:commentId/report", async (req, res) => {
  try {
    const { courseId, commentId } = req.params;
    const { reason, reportedBy } = req.body;

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid course or comment ID" });
    }

    // Verify the course and comment exist
    const course = await collection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const comment = course.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Create the report
    const reportsCollection = db.collection("reports");
    const report = {
      _id: new ObjectId(),
      courseId: new ObjectId(courseId),
      commentId: new ObjectId(commentId),
      commentText: comment.commentText,
      commentAuthor: comment.userName,
      reason: reason || "No reason provided",
      reportedBy: reportedBy || "Anonymous",
      reportedAt: new Date(),
      status: "pending", // pending, reviewed, resolved
    };

    const result = await reportsCollection.insertOne(report);
    
    console.log('Report created:', result.insertedId);
    res.status(201).json({ 
      success: true, 
      message: "Report submitted successfully. Our moderators will review this.",
      reportId: result.insertedId 
    });
  } catch (err) {
    console.error('Error reporting comment:', err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// Helper function to find a reply at any nesting depth
function findReplyAtDepth(replies, replyId) {
  if (!replies || !Array.isArray(replies)) {
    return null;
  }

  for (let reply of replies) {
    if (reply._id.toString() === replyId) {
      return reply;
    }
    // Recursively search in nested replies
    const found = findReplyAtDepth(reply.replies, replyId);
    if (found) {
      return found;
    }
  }

  return null;
}

// Report a reply
router.post("/:courseId/comments/:commentId/replies/:replyId/report", async (req, res) => {
  try {
    const { courseId, commentId, replyId } = req.params;
    const { reason, reportedBy } = req.body;

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId) || !ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: "Invalid course, comment, or reply ID" });
    }

    // Verify the course and comment exist
    const course = await collection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const comment = course.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Find the reply at any depth
    const reply = findReplyAtDepth(comment.replies, replyId);
    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Create the report
    const reportsCollection = db.collection("reports");
    const report = {
      _id: new ObjectId(),
      courseId: new ObjectId(courseId),
      commentId: new ObjectId(commentId),
      replyId: new ObjectId(replyId),
      replyText: reply.replyText,
      replyAuthor: reply.userName,
      reason: reason || "No reason provided",
      reportedBy: reportedBy || "Anonymous",
      reportedAt: new Date(),
      status: "pending",
    };

    const result = await reportsCollection.insertOne(report);
    
    console.log('Reply report created:', result.insertedId);
    res.status(201).json({ 
      success: true, 
      message: "Report submitted successfully. Our moderators will review this.",
      reportId: result.insertedId 
    });
  } catch (err) {
    console.error('Error reporting reply:', err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// Post a reply to a reply (nested reply) - supports unlimited nesting depth
router.post("/:courseId/comments/:commentId/replies/:replyId", async (req, res) => {
  try {
    const { courseId, commentId, replyId } = req.params;
    console.log('Nested reply request:', { courseId, commentId, replyId });

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId) || !ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: "Invalid course, comment, or reply ID" });
    }

    const { userName, email, replyText, avatar } = req.body;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "User name is required" });
    }

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    // Fetch the course
    const course = await collection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the comment
    const comment = course.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ error: "Comment not found" });
    }

    const nestedReply = {
      _id: new ObjectId(),
      userName: userName.trim(),
      email: email || "",
      avatar: avatar || "",
      replyText: replyText.trim(),
      replies: [],
      createdAt: new Date(),
    };

    // Search for the reply at any depth and add the new reply to it
    const found = findAndAddReplyAtDepth(comment.replies, replyId, nestedReply);

    if (!found) {
      console.log('Reply not found at any depth:', replyId);
      return res.status(404).json({ error: "Course, comment, or reply not found" });
    }

    // Update the entire course with the modified comment
    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectId(courseId), "comments._id": new ObjectId(commentId) },
      { $set: { "comments.$": comment } }
    );

    if (modifiedCount === 0) {
      console.log('Failed to update comment');
      return res.status(404).json({ error: "Failed to update comment" });
    }

    const updated = await collection.findOne({ _id: new ObjectId(courseId) });
    console.log('Nested reply posted successfully, returning course with', updated.comments.length, 'comments');
    res.status(201).json(updated);
  } catch (err) {
    console.error('Error posting nested reply:', err);
    res.status(500).json({ error: "Failed to post nested reply" });
  }
});

export default router;

