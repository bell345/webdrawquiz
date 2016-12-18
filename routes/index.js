var express = require('express');
var slashes = require("connect-slashes");
var router = express.Router();

router.use(slashes(true, { base: "/webdrawquiz" }));

var bind = function (path, view, title) {
    router.get(path, function (req, res, next) {
        res.render(view, { title: title || "WebDrawQuiz" });
    });
};

bind('/', 'index');
bind("/about/", "about");
bind('/admin/', 'admin');
bind('/create/', 'create');
bind('/join/', 'join');
bind('/play/', 'play');

module.exports = router;
