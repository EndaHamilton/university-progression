const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');

function adminOnlyRouter() {
  const router = express.Router();

  router.use(requireAdmin); // apply admin check to all routes within file
  return router; //  return the fully configured router
}

module.exports = adminOnlyRouter;