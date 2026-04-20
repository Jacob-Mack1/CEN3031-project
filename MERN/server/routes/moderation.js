import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../db/connection.js";

const router = express.Router();

async function requireModerator(moderatorUserId) {
  if (!ObjectId.isValid(moderatorUserId)) {
    return null;
  }

  const records = await getCollection("records");
  const moderator = await records.findOne({ _id: new ObjectId(moderatorUserId) });
  if (!moderator || !moderator.isModerator) {
    return null;
  }

  return moderator;
}

function findReplyAtDepth(replies, replyId) {
  if (!Array.isArray(replies)) {
    return null;
  }

  for (const reply of replies) {
    if (reply._id.toString() === replyId) {
      return reply;
    }

    const found = findReplyAtDepth(reply.replies, replyId);
    if (found) {
      return found;
    }
  }

  return null;
}

function removeReplyAtDepth(replies, replyId) {
  if (!Array.isArray(replies)) {
    return false;
  }

  const before = replies.length;
  const filtered = replies.filter((reply) => reply._id.toString() !== replyId);
  if (filtered.length !== before) {
    replies.splice(0, replies.length, ...filtered);
    return true;
  }

  for (const reply of replies) {
    if (removeReplyAtDepth(reply.replies, replyId)) {
      return true;
    }
  }

  return false;
}

async function removeQueueEntry(reportsCollection, source, ids) {
  const query = { source };
  if (ids.messageId) query.messageId = ids.messageId;
  if (ids.courseId) query.courseId = ids.courseId;
  if (ids.commentId) query.commentId = ids.commentId;
  if (ids.replyId) query.replyId = ids.replyId;
  await reportsCollection.deleteOne(query);
}

async function saveResolvedReport(report, action, moderatorUserId) {
  const resolvedCollection = await getCollection("resolvedReports");
  await resolvedCollection.insertOne({
    ...report,
    action: action, // "unflagged" or "deleted"
    resolvedBy: moderatorUserId,
    resolvedAt: new Date(),
  });
}

router.get("/queue/:moderatorUserId", async (req, res) => {
  try {
    const { moderatorUserId } = req.params;
    const moderator = await requireModerator(moderatorUserId);
    if (!moderator) {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const reportsCollection = await getCollection("moderationReports");
    const queue = await reportsCollection.find({}).sort({ flaggedAt: -1 }).toArray();
    res.json(queue);
  } catch (err) {
    console.error("Error fetching moderation queue:", err);
    res.status(500).json({ error: "Failed to fetch moderation queue" });
  }
});

router.get("/resolved/:moderatorUserId", async (req, res) => {
  try {
    const { moderatorUserId } = req.params;
    const moderator = await requireModerator(moderatorUserId);
    if (!moderator) {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const resolvedCollection = await getCollection("resolvedReports");
    const resolved = await resolvedCollection.find({}).sort({ resolvedAt: -1 }).limit(50).toArray();
    res.json(resolved);
  } catch (err) {
    console.error("Error fetching resolved reports:", err);
    res.status(500).json({ error: "Failed to fetch resolved reports" });
  }
});

router.post("/unflag", async (req, res) => {
  try {
    const { moderatorUserId, source, courseId, commentId, replyId, messageId } = req.body;
    const moderator = await requireModerator(moderatorUserId);
    if (!moderator) {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const reportsCollection = await getCollection("moderationReports");

    if (source === "dm") {
      if (!ObjectId.isValid(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const messagesCollection = await getCollection("messages");
      const result = await messagesCollection.updateOne(
        { _id: new ObjectId(messageId) },
        {
          $set: {
            flagged: false,
            flaggedAt: null,
            reportReason: null,
            reportedBy: null,
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Message not found" });
      }

      const report = await reportsCollection.findOne({ source: "dm", messageId: messageId.toString() });
      if (report) {
        await saveResolvedReport(report, "unflagged", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { messageId });
      return res.json({ success: true });
    }

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid course or comment ID" });
    }

    const coursesCollection = await getCollection("courses");

    if (source === "forum-comment") {
      const result = await coursesCollection.updateOne(
        { _id: new ObjectId(courseId), "comments._id": new ObjectId(commentId) },
        {
          $set: {
            "comments.$.flagged": false,
            "comments.$.flaggedAt": null,
            "comments.$.reportReason": null,
            "comments.$.reportedBy": null,
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const report = await reportsCollection.findOne({ source: "forum-comment", courseId, commentId });
      if (report) {
        await saveResolvedReport(report, "unflagged", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { courseId, commentId });
      return res.json({ success: true });
    }

    if (source === "forum-reply") {
      if (!ObjectId.isValid(replyId)) {
        return res.status(400).json({ error: "Invalid reply ID" });
      }

      const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const comment = (course.comments || []).find((item) => item._id.toString() === commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const reply = findReplyAtDepth(comment.replies, replyId);
      if (!reply) {
        return res.status(404).json({ error: "Reply not found" });
      }

      reply.flagged = false;
      reply.flaggedAt = null;
      reply.reportReason = null;
      reply.reportedBy = null;

      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId), "comments._id": new ObjectId(commentId) },
        { $set: { "comments.$": comment } }
      );

      const report = await reportsCollection.findOne({ source: "forum-reply", courseId, commentId, replyId });
      if (report) {
        await saveResolvedReport(report, "unflagged", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { courseId, commentId, replyId });
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Unknown moderation source" });
  } catch (err) {
    console.error("Error unflagging moderation item:", err);
    res.status(500).json({ error: "Failed to unflag item" });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const { moderatorUserId, source, courseId, commentId, replyId, messageId } = req.body;
    const moderator = await requireModerator(moderatorUserId);
    if (!moderator) {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const reportsCollection = await getCollection("moderationReports");

    if (source === "dm") {
      if (!ObjectId.isValid(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const messagesCollection = await getCollection("messages");
      const result = await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Message not found" });
      }

      const report = await reportsCollection.findOne({ source: "dm", messageId: messageId.toString() });
      if (report) {
        await saveResolvedReport(report, "deleted", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { messageId });
      return res.json({ success: true });
    }

    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid course or comment ID" });
    }

    const coursesCollection = await getCollection("courses");

    if (source === "forum-comment") {
      const result = await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $pull: { comments: { _id: new ObjectId(commentId) } } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const report = await reportsCollection.findOne({ source: "forum-comment", courseId, commentId });
      if (report) {
        await saveResolvedReport(report, "deleted", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { courseId, commentId });
      return res.json({ success: true });
    }

    if (source === "forum-reply") {
      if (!ObjectId.isValid(replyId)) {
        return res.status(400).json({ error: "Invalid reply ID" });
      }

      const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const comment = (course.comments || []).find((item) => item._id.toString() === commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const removed = removeReplyAtDepth(comment.replies, replyId);
      if (!removed) {
        return res.status(404).json({ error: "Reply not found" });
      }

      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId), "comments._id": new ObjectId(commentId) },
        { $set: { "comments.$": comment } }
      );

      const report = await reportsCollection.findOne({ source: "forum-reply", courseId, commentId, replyId });
      if (report) {
        await saveResolvedReport(report, "deleted", moderatorUserId);
      }

      await removeQueueEntry(reportsCollection, source, { courseId, commentId, replyId });
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Unknown moderation source" });
  } catch (err) {
    console.error("Error deleting moderation item:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
