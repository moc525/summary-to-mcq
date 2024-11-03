// routes/index.js

const express = require('express');
const mcqRoutes = require('./mcqRoutes'); // Import mcqRoutes

const router = express.Router();

// Use the route modules
router.use(mcqRoutes);

// Export the main router
module.exports = router;
