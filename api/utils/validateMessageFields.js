function validateMessageFields(mode) {
    return function (req, res, next) {
      let { sender_id, receiver_id, cohort_target, subject, body } = req.body;
  
      if (!sender_id) return res.status(400).json({ error: "Sender ID is required" });
      if (!subject) return res.status(400).json({ error: "Message subject is required" });
      if (!body) return res.status(400).json({ error: "Message body is required" });
  
      sender_id = parseInt(sender_id);
      if (isNaN(sender_id) || sender_id <= 0) {
        return res.status(400).json({ error: "Sender ID must be a positive number" });
      }
  
      if (mode === "individual") {
        if (!receiver_id) return res.status(400).json({ error: "Receiver ID is required for individual message" });
        receiver_id = parseInt(receiver_id);
        if (isNaN(receiver_id) || receiver_id <= 0) {
          return res.status(400).json({ error: "Receiver ID must be a positive number" });
        }
        if (sender_id === receiver_id) {
          return res.status(400).json({ error: "Sender and receiver cannot be the same" });
        }
      }
  
      if (mode === "cohort") {
        if (!cohort_target || String(cohort_target).trim() === "") {
          return res.status(400).json({ error: "Cohort target is required for cohort message" });
        }
        cohort_target = String(cohort_target).trim();
      }
  
      subject = String(subject).trim();
      body = String(body).trim();
  
      if (subject.length > 255) {
        return res.status(400).json({ error: "Message subject cannot exceed 255 characters" });
      }
  
      // Update req.body with validated and cleaned fields
      req.body.sender_id = sender_id;
      req.body.receiver_id = receiver_id || null;
      req.body.cohort_target = cohort_target || null;
      req.body.subject = subject;
      req.body.body = body;
  
      next();
    };
  }
  
  module.exports = validateMessageFields;
  