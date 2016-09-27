/**
 * Created by thomas on 2016-09-27 at 18:42.
 *
 * MIT Licensed
 */

module.exports = runner;

function runner(fns, context, next) {
    var last = fns.length - 1;

    (function run(pos) {
        fns[pos].call(context, function (err) {
            if (err || pos === last) return next(err);
            run(++pos);
        });
    })(0);
}