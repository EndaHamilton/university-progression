function validateProgressionPayload(req, res, next) {
    const { student_id, academic_year_id, progression_result, mitigating_comment } = req.body;
  
    if (!student_id) {
      return res.status(400).json({ error: "Student ID required." });
    }
    if (!academic_year_id) {
      return res.status(400).json({ error: "Academic Year ID required." });
    }
    if (!progression_result) {
      return res.status(400).json({ error: "Progression result required." });
    }
  
    if (progression_result.trim().toLowerCase === 'progress to next level with mitigating circumstances' & !mitigating_comment) {
      return res.status(400).json({ error: "Mitigating circumstances required for this progression" });
    }
  
    next();
  }
  
  module.exports = validateProgressionPayload;
  