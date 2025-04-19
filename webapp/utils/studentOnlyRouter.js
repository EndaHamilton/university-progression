const express = require('express');
const requireStudent = require('../middleware/requireStudent');

function studentOnlyRouter() {
  const router = express.Router();

  router.use(requireStudent); // apply student check to all routes within file
  return router; //  return the fully configured router
}

module.exports = studentOnlyRouter;