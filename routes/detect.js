var express = require('express');
var router = express.Router();

/**
 * GET page.
 * Renders the 'detect' view with the title 'Object Detection'.
 */
router.get('/', function (req, res, next) {
    res.render('detect', {title: 'Object Detection'});
});

module.exports = router;
