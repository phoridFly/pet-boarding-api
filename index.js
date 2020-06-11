const router = module.exports = require('express').Router();

router.use('/rooms', require('./rooms'));
router.use('/pets', require('./pets'));
