/**
 * Created by thomas on 2016-09-27 at 12:36.
 *
 * MIT Licensed
 */
var mongoose = require("mongoose"),
    debug = require("debug")("webdrawquiz:mongo"),
    schema = require("./schema"),
    Quiz = schema.Quiz,
    Contestant = schema.Contestant,
    Question = schema.Question,
    Response = schema.Response,
    model = module.exports,
    connectionString = "mongodb://localhost:27017/webdrawquiz";

mongoose.connect(connectionString);

var db = mongoose.connection;
db.on("error", debug.bind(this, "DB connection error: "));
db.once("open", function () {
    debug("Connected to DB");
});

function zeroPrefix(s, n, c) {
    s = s.toString();
    c = c || '0';
    return (new Array(n - s.length + 1)).join(c) + s;
}

model.getNewQuizCode = function (callback) {
    var inner = function (callback, tries) {
        tries = tries || 0;
        tries++;

        var code = zeroPrefix(Math.floor(Math.random()*10000).toString(), 4); // four digit code

        Quiz.find({ code: code }, function (err, count) {
            if (err) return callback(err);

            if (count !== 0) {
                if (tries > 100) { // to prevent deadlock
                    Quiz.remove({ code: code }, function (err) {
                        if (err) return callback(err);

                        callback(null, code);
                    });
                }
                else return inner(callback, tries);
            }
            else callback(null, code);
        });
    };
    return inner(callback);
};

model.createGame = function (title, code, questions, host_sid, callback) {
    var quiz = new Quiz({
        code: code,
        title: title,
        host_sid: host_sid
    });
    quiz.save(function (err, quiz) {
        if (err) return callback(err);

        function saveQuestion(i) {
            if (i >= questions.length)
                return callback(null, quiz);

            var qdata = questions[i];
            var question = new Question({
                quiz_id: quiz._id,
                question: qdata["question"],
                answer: qdata["answer"],
                time_limit: qdata["time_limit"],
                score: qdata["score"]
            });

            question.save(function (err) {
                if (err) return callback(err);

                saveQuestion(i+1);
            });
        }

        saveQuestion(0);
    });
};

model.addContestant = function (quiz_code, sid, name, callback) {
    Quiz.findOne({ code: quiz_code }, function (err, quiz) {
        if (err || !quiz) return callback(err || "invalid_code");

        Contestant.count({ name: name }, function (err, count) {
            if (err || count !== 0) return callback(err || "name_taken");

            var id = quiz._id;
            var contestant = new Contestant({
                quiz_id: id,
                sid: sid,
                name: name
            });
            contestant.save(callback);
        });
    });
};

model.hostAuth = function (host_sid, callback) {
    Quiz.findOne({ host_sid: host_sid }, callback);
};

model.contestantAuth = function (sid, callback) {
    Contestant.findOne({ sid: sid }, callback);
};

