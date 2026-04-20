import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../db/connection.js";

const router = express.Router();

let indexesReady = false;

async function ensureMessageIndexes() {
  if (indexesReady) return;
  const msgs = await getCollection("messages");
  await Promise.all([
    msgs.createIndex({ senderId: 1, createdAt: -1 }),
    msgs.createIndex({ recipientId: 1, createdAt: -1 }),
    msgs.createIndex({ senderId: 1, recipientId: 1, createdAt: 1 }),
  ]);
  indexesReady = true;
}

async function getUserRecord(userId) {
  if (!ObjectId.isValid(userId)) return null;
  const records = await getCollection("records");
  return records.findOne({ _id: new ObjectId(userId) });
}

// Find a user by exact username (used when adding a contact)
router.get("/find-user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const records = await getCollection("records");
    const user = await records.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.anonymous) {
      return res.status(403).json({ error: "Anonymous users cannot be messaged" });
    }
    res.json({ userId: user._id.toString(), username: user.username, avatar: user.avatar || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to find user" });
  }
});

// Get all unique conversation partners for a user (the contact list)
// Returns: [{ userId, username, avatar, lastMessage, lastAt, lastSenderId }]
router.get("/contacts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await getUserRecord(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (currentUser.anonymous) {
      return res.status(403).json({ error: "Anonymous users cannot send or receive messages" });
    }

    await ensureMessageIndexes();
    const msgs = await getCollection("messages");

    // Most-recent message first so we naturally get latest per partner
    const allMessages = await msgs
      .find({ $or: [{ senderId: userId }, { recipientId: userId }] })
      .sort({ createdAt: -1 })
      .toArray();

    // Unique partners, keyed by their userId (first occurrence = most recent)
    const partnerMap = new Map();
    for (const msg of allMessages) {
      const partnerId =
        msg.senderId === userId ? msg.recipientId : msg.senderId;
      const partnerUsername =
        msg.senderId === userId ? msg.recipientUsername : msg.senderUsername;
      const partnerAvatar =
        msg.senderId === userId ? msg.recipientAvatar : msg.senderAvatar;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          userId: partnerId,
          username: partnerUsername,
          avatar: partnerAvatar || null,
          lastMessage: msg.text,
          lastAt: msg.createdAt,
          lastSenderId: msg.senderId,
        });
      }
    }

    res.json([...partnerMap.values()]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Get all messages between two users, sorted chronologically (oldest first)
router.get("/conversation/:userId/:otherId", async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    const [currentUser, otherUser] = await Promise.all([
      getUserRecord(userId),
      getUserRecord(otherId),
    ]);
    if (!currentUser || !otherUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (currentUser.anonymous || otherUser.anonymous) {
      return res.status(403).json({ error: "Anonymous users cannot send or receive messages" });
    }

    await ensureMessageIndexes();
    const msgs = await getCollection("messages");

    const conversation = await msgs
      .find({
        $or: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const {
      senderId,
      senderUsername,
      senderAvatar,
      recipientId,
      recipientUsername,
      recipientAvatar,
      text,
    } = req.body;

    if (!senderId || !recipientId || !text?.trim()) {
      return res
        .status(400)
        .json({ error: "senderId, recipientId, and text are required" });
    }

    const [senderUser, recipientUser] = await Promise.all([
      getUserRecord(senderId),
      getUserRecord(recipientId),
    ]);
    if (!senderUser || !recipientUser) {
      return res.status(404).json({ error: "Sender or recipient not found" });
    }
    if (senderUser.anonymous || recipientUser.anonymous) {
      return res.status(403).json({ error: "Anonymous users cannot send or receive messages" });
    }

    const msgs = await getCollection("messages");
    const newMsg = {
      senderId,
      senderUsername: senderUsername || "Unknown",
      senderAvatar: senderAvatar || null,
      recipientId,
      recipientUsername: recipientUsername || "Unknown",
      recipientAvatar: recipientAvatar || null,
      text: text.trim(),
      flagged: false,
      flaggedAt: null,
      reportReason: null,
      reportedBy: null,
      createdAt: new Date(),
    };

    const result = await msgs.insertOne(newMsg);
    const created = await msgs.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Hard-delete a message by ID
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const msgs = await getCollection("messages");
    const { deletedCount } = await msgs.deleteOne({
      _id: new ObjectId(messageId),
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    const moderationReports = await getCollection("moderationReports");
    await moderationReports.deleteOne({ source: "dm", messageId });

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Flag a message for moderation review
router.post("/:messageId/report", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, reportedBy } = req.body;

    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const msgs = await getCollection("messages");
    const result = await msgs.findOneAndUpdate(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          flagged: true,
          flaggedAt: new Date(),
          reportReason: reason?.trim() || "No reason provided",
          reportedBy: reportedBy || "Anonymous",
        },
      },
      { returnDocument: "after" }
    );

    const message = result?.value || result;
    if (!message || !message._id) {
      return res.status(404).json({ error: "Message not found" });
    }

    const moderationReports = await getCollection("moderationReports");
    await moderationReports.updateOne(
      { source: "dm", messageId: message._id.toString() },
      {
        $set: {
          source: "dm",
          messageId: message._id.toString(),
          text: message.text,
          authorName: message.senderUsername || "Unknown",
          avatar: message.senderAvatar || null,
          createdAt: message.createdAt,
          flaggedAt: message.flaggedAt || new Date(),
          reportReason: message.reportReason || "No reason provided",
          reportedBy: message.reportedBy || "Anonymous",
        },
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Message reported successfully",
      reportedMessageId: message._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to report message" });
  }
});

export default router;
