var express = require('express');
var router = express.Router();

var bind = function (path, view, title) {
    router.get(path, function (req, res, next) {
        res.render(view, { title: title || "WebDrawQuiz" });
    });
};

bind('/', 'index');
bind('/admin', 'admin');
bind('/create', 'create');
bind('/join', 'join');

module.exports = router;
