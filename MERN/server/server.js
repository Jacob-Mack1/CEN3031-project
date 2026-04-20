import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import courses from "./routes/courses.js";
import messages from "./routes/messages.js";
import moderation from "./routes/moderation.js";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: "Request timed out while contacting the database. Please retry.",
      });
    }
  });
  next();
});

app.use("/record", records);
app.use("/courses", courses);
app.use("/messages", messages);
app.use("/moderation", moderation);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});