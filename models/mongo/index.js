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
    connectionString = process.env.MONGO_CONNECT
        || "mongodb://localhost:27017/webdrawquiz";

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
    Quiz.findOne({ host_sid: host_sid }, function (err, quiz) {
        if (err) return callback(err);

        return callback(null, quiz._id);
    });
};

model.contestantAuth = function (sid, callback) {
    Contestant.findOne({ sid: sid }, function (err, contestant) {
        if (err) return callback(err);

        if (!contestant)
            return callback(null); // no db error, sid invalid

        Quiz.findOne({ _id: contestant.quiz_id }, function (err, quiz) {
            if (err) return callback(err);

            return callback(null, contestant._id, quiz._id);
        });
    });
};

model.getContestantInfo = function (contestant_id, callback) {
    Contestant.findOne({ _id: contestant_id }, callback);
};

model.getQuestions = function (quiz_id, callback) {
    Question.find({ quiz_id: quiz_id }, function (err, questions) {
        if (err) return callback(err);

        questions = questions.map(function (q) {
            q.id = q._id;
            return q;
        });
        return callback(null, questions);
    });
};

model.getTitle = function (quiz_id, callback) {
    Quiz.findOne({ _id: quiz_id }, function (err, quiz) {
        if (err) return callback(err);

        return callback(null, quiz.title);
    });
};

model.submitResponse = function (question_id, contestant_id, type, data, callback) {
    Response.remove({ question_id: question_id, contestant_id: contestant_id }, function (err) {
        if (err) return callback(err);

        var response = new Response({
            question_id: question_id,
            contestant_id: contestant_id,
            type: type,
            data: data
        });
        response.save(function (err, response) {
            if (err) return callback(err);

            response.id = response._id;
            return callback(null, response);
        });
    });
};

model.markResponse = function (response_id, is_correct, callback) {
    Response.update({ _id: response_id }, { correct: is_correct }, callback);
};

model.isCorrect = function (contestant_id, question_id, callback) {
    Response.findOne({
        contestant_id: contestant_id,
        question_id: question_id,
        correct: true
    }, callback);
};

model.increaseScore = function (contestant_id, score_delta, callback) {
    Contestant.findOne({ _id: contestant_id }, function (err, contestant) {
        if (err) return callback(err);

        contestant.score += score_delta;
        contestant.save(function (err, contestant) {
            if (err) return callback(err);

            return callback(null, contestant.score);
        });
    });
};

model.getWinnerID = function (quiz_id, callback) {
    Contestant.find({ quiz_id: quiz_id })
        .sort({ score: 'descending' })
        .exec(function (err, contestants) {
            if (err) return callback(err);
            if (!contestants) return callback(null);

            var contestant = contestants[0];
            return callback(null, contestant._id);
        });
};

model.endGame = function (quiz_id, callback) {
    Quiz.update({ _id: quiz_id }, { host_sid: null }, function (err) {
        if (err) return callback(err);

        Contestant.update({ quiz_id: quiz_id }, { sid: null }, callback);
    });
};
