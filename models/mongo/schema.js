/**
 * Created by thomas on 2016-09-27 at 16:56.
 *
 * MIT Licensed
 */
var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

module.exports = {
    Quiz: mongoose.model("Quiz", new Schema({
        code: String,
        title: String,
        host_sid: { type: String, index: true }
    })),
    Contestant: mongoose.model("Contestant", new Schema({
        quiz_id: ObjectId,
        sid: { type: String, index: true },
        name: String,
        score: { type: Number, default: 0 }
    })),
    Question: mongoose.model("Question", new Schema({
        quiz_id: ObjectId,
        question: String,
        answer: String,
        time_limit: Number,
        score: Number
    })),
    Response: mongoose.model("Response", new Schema({
        question_id: ObjectId,
        contestant_id: ObjectId,
        type: { type: String },
        data: String,
        correct: { type: Boolean, default: false },
        bonus: Number
    }))
};
