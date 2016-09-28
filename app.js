var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require("http");
var fs = require("fs");
var hbs = require("hbs");

var routes = require('./routes/index');

var GameServer = require("./game");
var model = require("./models/mongo");
var api = require("./api");
var wsapi = require("./api/ws");

var server = http.createServer();
var app = express();
server.on("request", app);

// view engine setup
var viewsDir = path.join(__dirname, 'views');
var partialsDir = path.join(viewsDir, 'partials');
app.set('views', viewsDir);
app.set('view engine', 'hbs');

// From https://gist.github.com/benw/3824204.
// Sets up handlebars partials for everything in the /views directory.
fs.readdirSync(partialsDir).forEach(function (filename) {
    var matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) return;

    var name = matches[1];
    var template = fs.readFileSync(path.join(partialsDir, filename), 'utf8');
    hbs.registerPartial(name, template);
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

var game = new GameServer({
    model: model,
    debug: true
});

app.use("/api/v1", api(game));
app.use("/api/v1/ws", wsapi(server, "/api/v1/ws", game));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(api.handler());
app.use(game.handler());

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = server;
