if (!window.jQuery) {
    throw new Error("[tblib/math.js] jQuery has not been loaded");
} else if (!window.TBI) {
    throw new Error("[tblib/math.js] base.js has not been loaded");
} else if (!TBI.Util) {
    throw new Error("[tblib/math.js] util.js has not been loaded");
}

TBI.Math = {};

// non-recursive algorithm
function highestCommonFactor(a, b) {
    while (b != 0) {
        var c = a;
        a = b;
        b = c % b;
    }
    return a;
}
// Proportions a number given from a function with limits a (top) to b (bottom), to a different function with limits c to d.
Math.proportion = function (n, a, b, c, d) { return (c-d)/(a-b)*n+(d-b); }
// Transforms a HSV colour value into its equivalent RGB value.
function hsvToRgb(h,s,v) {
    var bt = (1-s)*v,
        sv = v-bt,
        a = 0, b = 60, c = 180, d = 240,
        g = function (k) { return k>=b&&h<=c?1:k<b&&k>a?(k-a)/(b-a):h>c&&h<d?(h-c)/(d-c):0 };
    return [sv*g(h+120,a,b,c,d)+bt, sv*g(h,a,b,c,d)+bt, sv*g(h-120,a,b,c,d)+bt];
}
// Transforms an RGB colour value into its equivalent HSV value. (Not written by me)
function rgbToHsv(r,g,b) {
    var max = Math.max(r,g,b),
        min = Math.min(r,g,b),
        h = 0;
    if (r == max) h = (g-b)/d;
    else if (g == max) h = 120 + (b-r)/d;
    else if (b == max) h = 240 + (r-g)/d;
    return [h,1-min/max,max];
}
// Returns a set of instructions (chars) given a starting value and a set of rules that change characters into other sequences.
function lsystem(start, rules, n) {
    if (n < 1) return start;
    var a = lsystem(start, rules, n-1);
    for (var i=0,s="";i<a.length;i++) {
        var b = a[i];
        for (var rule in rules) if (rules.hasOwnProperty(rule)) if (a[i] == rule) b = rules[rule];
        s += b;
    }
    return s;
}
// Finds the total of a list.
Math.total = function (list) {
    var total = 0;
    for (var i=0;i<list.length;i++) total += list[i];
    return total;
}
// Finds the mean of a list.
Math.mean = function (list) {
    return Math.total(list) / list.length;
}
// Finds the median of a list.
Math.median = function (list) {
    if (!isSorted(list)) list = sort(list);
    if (list.length % 2 == 0) return Math.mean([list[list.length/2], list[(list.length/2)-1]]);
    else return list[(list.length-1)/2];
}
// Finds the mode of a list.
Math.mode = function (list) {
    var freq = {},
        max = 0,
        modes = [];
    for (var i=0;i<list.length;i++) {
        if (freq[list[i]] == undefined) freq[list[i]] = 0;
        freq[list[i]]++;
    }
    for (var key in freq) if (freq.hasOwnProperty(key) && freq[key] > max) max = freq[key];
    for (var key in freq) if (freq.hasOwnProperty(key) && freq[key] == max) {
        if (parseFloat(key).toString() != key) modes.push(key);
        else modes.push(parseFloat(key));
    }
    if (max < 2) return null;
    return modes.length == 1?modes[0]:modes;
}
// Finds the range of a list.
Math.range = function (list) {
    list = sort(list);
    return list[list.length-1]-list[0];
}
// Finds the upper quartile, the lower quartile, median and the inter-quartile range of a list.
Math.quartiles = function (list) {
    list = sort(list);
    var med = Math.median(list);
    while (list.indexOf(med) != -1) list = splice(list, list.indexOf(med), 1);
    var up = [], lw = [];
    for (var i=0;i<list.length;i++) i<list.length/2?lw.push(list[i]):up.push(list[i]);
    return {lower:Math.median(lw),median:med,upper:Math.median(up),range:Math.median(up) - Math.median(lw)};
}
// Returns the factorial of the number specified.
Math.factorial = function (num) {
    for (var i=0,t=1;i<num;i++) t *= i+1;
    return t;
}
// Uses Eratosthenes' sieve to calculate the prime numbers up to the number specified.
Math.eratosthenes = function (num) {
    var sqrt = Math.sqrt(num),
        nums = [];
    for (var i=0;i<num;i++)
        nums.push(true);
    for (var i=2;i<sqrt;i++)
        if (nums[i])
            for (var j=i*i;j<num;j+=i)
                nums[j] = false;
    return nums;
}
// Returns a value which, when added to a list of values, will change its mean to the specified number.
Math.newValueForMean = function (list, num) {
    return num * (list.length + 1) - Math.total(list);
}
// Declares a fraction with a numerator and a denominator.
function Fraction(numerator, denominator) {
    this.numerator = numerator;
    this.denominator = denominator;
}
Fraction.prototype = {
    constructor: Fraction,
    simplify: function () {
        var factor = highestCommonFactor(this.numerator, this.denominator);
        return new Fraction(this.numerator/factor, this.denominator/factor);
    },
    multiply: function (frac2) {
        if (!(frac2 instanceof Fraction)) frac2 = new Fraction(frac2, 1);
        return new Fraction(this.numerator*frac2.numerator, this.denominator*frac2.denominator).simplify();
    },
    add: function (frac2) {
        if (!(frac2 instanceof Fraction)) frac2 = new Fraction(frac2, 1);
        var deno = this.denominator * frac2.denominator;
        return new Fraction(this.numerator * frac2.denominator + frac2.numerator * this.denominator, deno).simplify();
    },
    eval: function () { return this.numerator / this.denominator; }
};
// Declares an object of {x,y} to represent a coordinate value.
function Coords(x, y) {
    if (x instanceof Array) return new Coords(x[0], x[1]);
    this.x = x;
    this.y = y;
}
// Declares a coordinate value given a string as follows: "(x, y)".
Coords.parse = function (str) {
    var params = str.replaceAll(/[\(\)]/, "").split(/\, ?/);
    return new Coords(parseFloat(params[0]).fixFloat(), parseFloat(params[1]).fixFloat());
}
// Transforms coordinates into an array of [x,y].
Coords.prototype.toArray = function () { return [this.x,this.y] }
// Transforms coordinates into a string representation of "(x, y)".
Coords.prototype.toString = function (spacing) { return "("+this.x+","+(isNull(spacing)?" ":spacing?" ":"")+this.y+")" }
// Transforms cartesian coordinates into a polar form of (r, a).
Coords.prototype.toPolar = function () {
    return new PolarCoords(Math.pythagoras(this.x, this.y), Math.atan2(this.y, this.x));
}
Coords.prototype.toVector = function () { return new Vector2D(this.x, this.y); }
// Declares a set of polar coordinates as follows: {r,a}, where r is the radius and a is the azimuth.
function PolarCoords(radius, azimuth) {
    this.radius = radius;
    this.azimuth = azimuth;
}
// Declares a polar coordinate value using a string as follows: "(r, a)".
PolarCoords.parse = function (str) {
    var params = str.replaceAll(/[\(\)]/, "").split(/\, ?/);
    return new PolarCoords(params[0], params[1]);
}
// Transforms polar coordinates into a cartesian form of (x, y).
PolarCoords.prototype.toCartesian = function () {
    return new Coords(this.radius*Math.cos(this.azimuth), this.radius*Math.sin(this.azimuth));
}
// Transforms polar coordinates into a string representation of "(r, a)".
PolarCoords.prototype.toString = function () { return "("+this.radius+", "+this.azimuth+")" }
// Declares a line segment with the endpoints start and end.
function LineSegment(start, end) {
    if (!(start instanceof Vector2D) && !isNull(start[1])) start = new Vector2D(start[0], start[1]);
    if (!(end instanceof Vector2D) && !isNull(end[1])) end = new Vector2D(end[0], end[1]);
    this.start = start;
    this.end = end;
    this.length = Math.pythagoras(this.end.x-this.start.x, this.end.y-this.start.y);
    this.midpoint = new Vector2D(Stat.mean([this.start.x, this.end.x]), Stat.mean([this.start.y, this.end.y]));
    this.gradient = ((this.end.y-this.start.y) / (this.end.x-this.start.x)).fixFloat();
    // simple: m = rise/run
    // the trick is to use two points
    // take away the first point's y values from the second y value (rise)
    // and then divide that by the second x from the first x, same as the last step (run)
    // the .fix() is simply to reduce the chances of floating point errors
    // the formula is (y2-y1)/(x2-x1)
    this.yIntercept = this.start.y-(this.gradient*this.start.x);
    // pick a point, any point
    // I chose the "start" point, but it doesn't matter
    // the gradient was calculated previously with two of the points
    // simply take this point's y value
    // and take away from it the value of mx,
    // where m is the gradient and x is the x value of the point
    // the formula is y-mx
}
// Declares a line segment using a string of the form: "((x1,y1),(x2,y2))".
LineSegment.parse = function (str) {
    var params = str.replace("((", "(").replace("))", ")").split(/\), ?\(/);
    return new LineSegment(Coords.parse(params[0]), Coords.parse(params[1]));
}
// Finds the midpoint of a line segment.
LineSegment.prototype.midpoint = function () {
    return new Vector2D(Stat.mean([this.start.x, this.end.x]), Stat.mean([this.start.y, this.end.y]));
}
// Transforms a line segment into a linear function.
LineSegment.prototype.toLinear = function () { return new LinearFunc(this.gradient, this.yIntercept); }
// Transforms a line segment into a multi-dimensional array representation of [[x1,y1],[x2,y2]].
LineSegment.prototype.toArray = function () { return [[this.start.x, this.start.y], [this.end.x, this.end.y]]; }
// Transforms a line segment into a string representation of "((x1,y1),(x2,y2))".
LineSegment.prototype.toString = function (spacing) {
    var s = spacing ? " " : "";
    return "(" + this.start.toString(s==" ") + "," + s + this.end.toString(s==" ") + ")";
}
function Enum() {
    var removeDashes = function (str) {
        str = str.replace(/ /g, "_").split("");
        for (var i=0,a=false,s="";i<str.length;i++) {
            if (a) {
                str[i] = str[i].toUpperCase();
                a = false;
            }
            if (str[i] == "-") a = true;
            else s += str[i];
        }
        return s;
    }
    for (var i=0;i<arguments.length;i++)
        this[removeDashes(arguments[i])] = arguments[i];
    if (Object.freeze) Object.freeze(this);
}
function MathFunction(evalFunc, type, className) {
    this.eval = evalFunc;
    this.type = type || MathFunction.Types.Cartesian;
    this.className = className || "MathFunction";
    this.toString = function (useHTML) {
        return equationToString(this.eval, false, useHTML);
    }
}
MathFunction.Types = new Enum("Cartesian", "Polar", "Parametric");

MathFunction.Variable = function (evalFunc, varObj, type, className) {
    MathFunction.call(this, evalFunc, type, className);
    var chars = "abcdefghijklmnopqrstuvwxyz";
    var vars = [];
    if (typeof(varObj) == typeof 1) for (var i=2;i<arguments.length && (i-2) < chars.length;i++) {
        this[chars[i-2]] = arguments[i];
        vars.push(chars[i-2]);
    } else for (var prop in varObj) if (varObj.hasOwnProperty(prop)) {
        this[prop] = varObj[prop];
        vars.push(prop);
    }
    this.variables = vars;
};
MathFunction.Variable.parse = function (str, varObj) {
    try {
        for (var prop in varObj) if (varObj.hasOwnProperty(prop)) {
            str = str.replaceAll(new RegExp("([^\\(]|^)\\$"+RegExp.quote(prop)+"([^\\)]|$)"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("(\\()\\$"+RegExp.quote(prop)+"([^\\)])"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("([^\\(])\\$"+RegExp.quote(prop)+"(\\))"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("\\(\\$"+prop+"\\)"), "(this."+prop+")");
        }
        return new MathFunction.Variable(stringToEquation(str, true), varObj);
    } catch (e) {
        TBI.error("The MathFunction.Variable failed to parse: " + e.message);
    }
};
MathFunction.Variable.prototype = Object.create(MathFunction.prototype);
MathFunction.Variable.prototype.constructor = MathFunction.Variable;
function PolynomialFunc() {
    MathFunction.call(this, function (x) {
        this.correctCoefficients();
        var result = 0;
        for (var i=0;i<this.coefficients.length;i++)
            result += Math.pow(x, i) * this.coefficients[i];
        return result;
    }, MathFunction.Types.Cartesian, "PolynomialFunc");
    this.correctCoefficients = function () {
        for (var i=this.coefficients.length-1,r=false,a=[];i>=0;i--) {
            var curr = this.coefficients[i];
            if (curr != 0 || !isNaN(curr) || r) {
                if (isNaN(curr)) curr = 0;
                a.push(curr);
                r = true;
            }
        }
        this.coefficients = a.reverse();
    }
    var args = [];
    for (var i=0,r=false;i<arguments.length;i++) {
        if (arguments[i] != 0 || r) {
            args.push(arguments[i]);
            r = true;
        }
    }
    this.coefficients = args.reverse();
    this.correctCoefficients();
    this.toString = function (useHTML) {
        this.correctCoefficients();
        if (isNull(useHTML)) useHTML = false;
        var s = " ";
        var str = "";
        if (this.coefficients.length < 1) return "";
        for (var i=0;i<this.coefficients.length-1;i++) {
            var val = this.coefficients[i];
            if (val != 0) {
                var sign = "";
                switch (Math.sign(val)) {
                    case -1: sign = "-"; break;
                    case 0: sign = ""; break;
                    case 1: sign = "+"; break;
                }
                val = Math.abs(val);
                var variable = "";
                if (i == 0) variable = "";
                else if (i == 1) variable = "x";
                else if (useHTML) variable = "x<sup>"+i+"</sup>";
                else variable = "x^"+i;
                str = s+sign+s+(i != 0 && val == 1 ? "" : val.toString())+variable + str;
            }
        }
        var lastIndex = this.coefficients.length-1;
        var lastVal = this.coefficients[lastIndex];
        var variable = "";
        if (lastIndex == 0) variable = "";
        else if (lastIndex == 1) variable = "x";
        else if (useHTML) variable = "x<sup>"+i+"</sup>";
        else variable = "x^"+lastIndex;
        str = (lastVal == 1 ? "" : lastVal.toString())+variable + str;
        str = "f(x)" + s + "=" + s + str;
        return str;
    };
    var defineAliases = function (aliasObj) {
        for (var alias in aliasObj) if (aliasObj.hasOwnProperty(alias)) {
            Object.defineProperty(this, alias, {
                get: function (v) { return function () { return this.coefficients[v]; }; }(aliasObj[alias]),
                set: function (v) { return function (val) { this.coefficients[v] = val; }; }(aliasObj[alias])
            })
        }
        delete this.defineAliases;
    }
    Object.defineProperty(this, "defineAliases", {
        value: defineAliases,
        configurable: true,
        enumerable: false
    });
}
PolynomialFunc.prototype = Object.create(MathFunction.prototype);
function LinearFunc(gradient, yIntercept) {
    PolynomialFunc.call(this, gradient, yIntercept);
    this.className = "LinearFunc";
    this.defineAliases({
        "gradient": 1,
        "yIntercept": 0
    });
    this.intersection = function (f2) {
        if (!(f2 instanceof LinearFunc)) return null;
        var x = ((f2.yIntercept - this.yIntercept) / (this.gradient-f2.gradient)).fixFloat();
        return new Vector2D(x, this.eval(x));
    };
    this.multiply = function (f2) {
        if (f2 instanceof LinearFunc) return new QuadraticFunc(
            this.gradient*f2.gradient,
            this.yIntercept*f2.gradient+this.gradient*f2.yIntercept,
            this.yIntercept*f2.yIntercept
        );
        else return null;
    };
}
LinearFunc.prototype = Object.create(PolynomialFunc.prototype);
function QuadraticFunc(a, b, c) {
    if (a == 0) return new LinearFunc(b, c);
    PolynomialFunc.call(this, a, b, c);
    this.className = "QuadraticFunc";
    this.defineAliases({
        "a": 2,
        "b": 1,
        "c": 0
    });
    this.getSolution = function (sign) {
        return (
            -this.b // negative b
            + (sign)*Math.sqrt( // plus the plus/minus square root of
                Math.pow(this.b, 2) // b squared
                - 4 * this.a * this.c // minus 4 a c
            )
        ) / ( // over
            2 * this.a // 2 a
        );
    }
}
QuadraticFunc.prototype = Object.create(PolynomialFunc.prototype);
// ax + by = c
function RelationFunc(a, b, c) {
    MathFunction.call(this, function (x) {
        return this.gradient*x + this.yIntercept;
    }, MathFunction.Types.Cartesian, "RelationFunc");

    this.a = a;
    this.b = b;
    this.c = c;

    Object.defineProperty(this, "gradient", {
        get: function () { return -(this.a / this.b); }
    });
    Object.defineProperty(this, "yIntercept", {
        get: function () { return this.c / this.b; }
    });
    this.toLinear = function () {
        return new LinearFunc(this.gradient, this.yIntercept);
    };
    this.toString = function () {
        var s = " ";
        var str = "";
        var a = this.a;
        if (a != 0) {
            if (a == 1) a = "";
            else if (a == -1) a = "-";
            else a = a.toString();
            str += a + "x" + s;
        }
        var sign = isNegative(this.b) ? "-" : "+";
        var b = this.b;
        if (b != 0) {
            if (b == 1) b = "";
            else b = b.toString();
            str += sign + s + b + "y" + s;
        }
        str += s + "=" + s + this.c;
        return str;
    }
}
RelationFunc.prototype = Object.create(MathFunction.prototype);
function PolarFunction(func) {
    MathFunction.call(this, func, MathFunction.Types.Polar, "PolarFunction");
}
PolarFunction.parse = function (str) {
    var func = null;
    try {
        func = stringToEquation(str);
    } catch (e) {
        TBI.error("The PolarFunction failed to parse: "+e.message);
        return new PolarFunction(function (a) { return 0; });
    }
    return new PolarFunction(func);
};

PolarFunction.Variable = function (evalFunc, varObj) {
    MathFunction.Variable.call(this, evalFunc, varObj, MathFunction.Types.Polar, "PolarFunction");
};
PolarFunction.Variable.parse = function (str, varObj) {
    try {
        for (var prop in varObj) if (varObj.hasOwnProperty(prop)) {
            str = str.replaceAll(new RegExp("([^\\(]|^)\\$"+RegExp.quote(prop)+"([^\\)]|$)"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("(\\()\\$"+RegExp.quote(prop)+"([^\\)])"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("([^\\(])\\$"+RegExp.quote(prop)+"(\\))"), "$1(this."+prop+")$2");
            str = str.replaceAll(new RegExp("\\(\\$"+prop+"\\)"), "(this."+prop+")");
        }
        return new PolarFunction.Variable(stringToEquation(str, true), varObj);
    } catch (e) {
        TBI.error("The PolarFunction.Variable failed to parse: " + e.message);
    }
};
PolarFunction.Variable.prototype = Object.create(PolarFunction.prototype);
PolarFunction.Variable.prototype.constructor = PolarFunction.Variable;
function ParametricFunc(xf, yf, className) {
    className = className || "ParametricFunc";
    MathFunction.call(this, function (t) {
        return new Vector2D(this.xf(t), this.yf(t));
    }, MathFunction.Types.Parametric, className);
    this.xf = xf;
    this.yf = yf;
    this.toString = function (useHTML) {
        return "f(t) = ("+equationToString(this.xf, true, useHTML)+", "+equationToString(this.yf, true, useHTML)+")";
    }
}
ParametricFunc.parse = function (xf, yf) {
    try {
        return new ParametricFunc(stringToEquation(xf), stringToEquation(yf));
    } catch (e) {
        TBI.error("The ParametricFunc failed to parse: "+e.message);
        return new ParametricFunc(function(){return 0;}, function(){return 0;});
    }
}
ParametricFunc.prototype = Object.create(MathFunction.prototype);
ParametricFunc.Variable = function (xf, yf, varObj) {
    ParametricFunc.call(this, xf, yf, "ParametricFunc_Variable");
    var chars = "abcdefghijklmnopqrstuvwxyz";
    var vars = [];
    if (typeof(varObj) == "number") for (var i=2;i<arguments.length&&(i-2)<chars.length;i++) {
        this[chars[i-2]] = arguments[i];
        vars.push(chars[i-2]);
    } else for (var prop in varObj) if (varObj.hasOwnProperty(prop)) {
        this[prop] = varObj[prop];
        vars.push(prop);
    }
    this.variables = vars;
    this.toString = function (useHTML, funcOnly) {
        var str = "f(t) = ("+equationToString(this.xf, true, useHTML)+", "+equationToString(this.yf, true, useHTML)+")";
        //if (!funcOnly) {
        //    str += ", ";
        //    if (useHTML) str += "<ul>";
        //    for (var i=0;i<this.variables.length;i++) {
        //        if (useHTML) str += "<li>";
        //        str += this.variables[i] + " = "+this[this.variables[i]];
        //        if (useHTML) str += "</li>";
        //        if (!useHTML && i != this.variables.length - 1) str += ", ";
        //    }
        //    if (useHTML) str += "</ul>";
        //}
        return str;
    }
}
ParametricFunc.Variable.parse = function (xf, yf, varObj) {
    try {
        for (var prop in varObj) if (varObj.hasOwnProperty(prop)) {
            xf = xf.replaceAll(new RegExp("([^\\(]|^)\\$"+RegExp.quote(prop)+"([^\\)]|$)"), "$1(this."+prop+")$2");
            xf = xf.replaceAll(new RegExp("(\\()\\$"+RegExp.quote(prop)+"([^\\)])"), "$1(this."+prop+")$2");
            xf = xf.replaceAll(new RegExp("([^\\(])\\$"+RegExp.quote(prop)+"(\\))"), "$1(this."+prop+")$2");
            xf = xf.replaceAll(new RegExp("\\(\\$"+prop+"\\)"), "(this."+prop+")");
            yf = yf.replaceAll(new RegExp("([^\\(]|^)\\$"+RegExp.quote(prop)+"([^\\)]|$)"), "$1(this."+prop+")$2");
            yf = yf.replaceAll(new RegExp("(\\()\\$"+RegExp.quote(prop)+"([^\\)])"), "$1(this."+prop+")$2");
            yf = yf.replaceAll(new RegExp("([^\\(])\\$"+RegExp.quote(prop)+"(\\))"), "$1(this."+prop+")$2");
            yf = yf.replaceAll(new RegExp("\\(\\$"+prop+"\\)"), "(this."+prop+")");
        }
        return new ParametricFunc.Variable(stringToEquation(xf, true), stringToEquation(yf, true), varObj);
    } catch (e) {
        TBI.error("The ParametricFunc.Variable failed to parse: "+e.message);
    }
}
ParametricFunc.Variable.prototype = Object.create(ParametricFunc.prototype);
// Declares a parametric function that generates an ellipse.
ParametricFunc.ellipse = function (a, b) {
    ParametricFunc.Variable.call(this,
        function (t) { return this.a*Math.cos(t); },
        function (t) { return this.b*Math.sin(t); },
        a, b
    );
    this.className = "Ellipse";
}
ParametricFunc.ellipse.prototype = Object.create(ParametricFunc.Variable.prototype);
// Declares a parametric function that generates a Lissajous curve.
ParametricFunc.lissajous = function (a, b, sigma) {
    ParametricFunc.Variable.call(this,
        function (t) { return Math.sin(this.a*t + this.σ); },
        function (t) { return Math.sin(this.b*t); },
        { a:a, b:b, σ: isNaN(sigma) ? 0 : sigma }
    );
    this.className = "Lissajous";
}
ParametricFunc.lissajous.prototype = Object.create(ParametricFunc.Variable.prototype);
// Declares a parametric function that generates a trochoid.
ParametricFunc.trochoid = function (a, b) {
    ParametricFunc.Variable.call(this,
        function (t) { return this.a*t - this.b*Math.sin(t); },
        function (t) { return this.a - this.b*Math.cos(t); },
        { a:a, b:b }
    );
    this.className = "Trochoid";
}
ParametricFunc.trochoid.prototype = Object.create(ParametricFunc.Variable.prototype);
// Declares a parametric function that generates a hypotrochoid.
ParametricFunc.hypotrochoid = function (R, r, d) {
    ParametricFunc.Variable.call(this,
        function (t) { var d = this.R - this.r; return a*Math.cos(t) + this.d*Math.cos(a/r*t); },
        function (t) { var d = this.R - this.r; return a*Math.sin(t) - this.d*Math.sin(a/r*t); },
        { R:R, r:r, d:d }
    );
    this.className = "Hypotrochoid";
}
ParametricFunc.hypotrochoid.prototype = Object.create(ParametricFunc.Variable.prototype);
// The transcendental butterfly curve.
// https://en.wikipedia.org/wiki/Butterfly_curve_(transcendental)
ParametricFunc.butterfly = function (a, b) {
    ParametricFunc.Variable.call(this,
        function (t) { return (this.a-this.b)*Math.cos(t) + this.b*Math.cos(t*((this.a/this.b) - 1)); },
        function (t) { return (this.a-this.b)*Math.sin(t) - this.b*Math.sin(t*((this.a/this.b) - 1)); },
        { a:a||1, b:b||1 }
    );
    this.className = "Butterfly";
}
ParametricFunc.butterfly.prototype = Object.create(ParametricFunc.Variable.prototype);

var Stat = {};
// Works just like big sigma summation, but specifically designed to go over all of the elements of an array.
Math.sigmaSum = function (arr, func) {
    for (var i=0,t=0;i<arr.length;i++)
        t += func(arr[i], i, arr);
    return t;
}
Stat.sum = function (arr) { return Math.sigmaSum(arr, function (a) { return a; }); }
Stat.mean = function (arr) {
    return Stat.sum(arr) / arr.length;
}
Stat.median = function (arr) {
    var even = arr.length % 2 == 0;
    if (!even) return arr[arr.length/2];
    else {
        var mid = arr.length / 2;
        return (arr[Math.floor(mid)] + arr[Math.ceil(mid)]) / 2;
    }
}
Stat.mode = function (arr) {
    var freqs = {};
    for (var i=0;i<arr.length;i++) {
        if (freqs[arr[i]] == undefined) freqs[arr[i]] = 0;
        freqs[arr[i]]++;
    }
    var result = [],
        resultFreq = -1;
    for (var prop in freqs) if (freqs.hasOwnProperty(prop)) {
        if (freqs[prop] > resultFreq) {
            result = [prop];
            resultFreq = freqs[prop];
        } else if (freqs[prop] == resultFreq)
            result.push(prop);
    }
    return result;
}
Stat.quartiles = function (arr) {
    var q2 = Stat.median(arr);
    var even = arr.length % 2 == 0;

    var list = arr;
    if (!even) list.splice(Math.floor(list.length / 2), 1);

    var firstHalf = list.splice(0, list.length / 2);
    var secondHalf = list;
    var first = Stat.median(firstHalf);
    var second = Stat.median(secondHalf);

    return { lower: first, upper: second, median: q2, range: second - first };
}
Stat.trendline = function (arr) {
    for (var i=0,a=[];i<arr.length;i++) a.push(new Vector2D(arr[i].x, arr[i].y));

    var xmean = Stat.mean(a.map(function (e) { return e.x; }));
    var ymean = Stat.mean(a.map(function (e) { return e.y; }));

    var gradient = Math.sigmaSum(a, function (e) {
        return (e.x - xmean) * (e.y - ymean);
    }) / Math.sigmaSum(a, function (e) {
        return Math.pow(e.x - xmean, 2);
    });

    return new LinearFunc(gradient, ymean - gradient*xmean);
}

// because why not? I'm using UTF-8 anyway
var π = Math.PI;
// Transforms an equation into a string representation.
Function.equationToString = function (func, toReplace, replacement) {
    return equationToString(func);
}
// Magic. Obfuscated to f**k.
// Takes all instances of function r with b brackets and
// interior regex specification n in s and replaces them with t.
//             str                func                   interior                   replacement  brackets
// e.g. "sin<84 * sin<2x + 4>>", "sin", "([0-9])([a-z]) ?[\\+\\-\\*\\/] ?([0-9])", "$1, $2, $3", "<>"
// returns "sin<84 * 2, x, 4>"
/*function replaceNestedFunctions(s, r, n, t, b) {
    var q = RegExp.quote(r);
    if (isNull(b)) b = "()";
    var c = [RegExp.quote(b[0]), RegExp.quote(b[1])];
    for (var i=0,s2="",d=[],u="\uFFFF",l=0,f=[];i<s.length;i++) {
        if (s2.lastIndexOf(r) != -1 && s2.lastIndexOf(r) == s2.length-r.length) {
            s2 += u+l+u;
            d.push(l);
        }
        if (s[i] == b[0]) l++;
        if (s[i] == b[1] && d.indexOf(--l) != -1) {
            f.push(l);
            d = d.remove(d.indexOf(l));
            s2 += u+l+u;
        }
        s2 += s[i];
    }
    for (var i=0;i<f.length;i++) {
        var h = u+f[i]+u;
        s2 = s2.replace(new RegExp(r+h+c[0]+n+h+c[1], 'g'), t);
    }
    s2 = s2.replace(new RegExp("\uFFFF[0-9]+\uFFFF", 'g'), "");
    return s2;
};*/
function replaceNestedFunctions(str, func, interior, replacement, brackets) {
    if (isNull(brackets)) brackets = "()";
    var result = "",
        watchLayers = [],
        resultLayers = [],
        layer = 0,
        u = "\uFFFF";
    for (var i=0;i<str.length;i++) {
        if (result.endsWith(func)) {
            result += u + layer + u;
            watchLayers.push(layer);
        }
        if (str[i] == brackets[0]) layer++;
        else if (str[i] == brackets[1] && watchLayers.indexOf(--layer) != -1) {
            resultLayers.push(layer);
            watchLayers = watchLayers.remove(watchLayers.indexOf(layer));
            result += u + layer + u;
        }
        result += str[i];
    }

    func = RegExp.quote(func);
    brackets = [
        RegExp.quote(brackets[0]),
        RegExp.quote(brackets[1])
    ];

    for (var i=0;i<resultLayers.length;i++) {
        var head = u + resultLayers[i] + u;
                                        // func<marker>(...<marker>)
        result = result.replace(new RegExp(func+head+brackets[0]+interior+head+brackets[1], 'g'), replacement);
    }
    result = result.replace(new RegExp(u+"[0-9]+"+u, 'g'), "");
    return result;
}
function equationToString(func, noHeader, useHTML) {
    if (isNull(useHTML)) useHTML = false;
    var str = func.toString();

    str = str.replaceAll(/\t/, "    ");
    str = str.replaceAll(/\r?\n/, " ");
    str = str.replaceAll(/  +/, " ");
    str = str.replaceAll(/((\() +| +(\)))/, "$2")
    str = str.replaceAll(/ *(f)unction ?(\([^\)]*\)) ?\{ ?(return )?/, noHeader ? "" : "$1$2 = ");
    str = str.removeAll(/ ?return ?/);
    str = str.replaceAll(/\; ?\, ?/, ", ");
    str = str.replaceAll(/(([A-Za-z_]|\\[0-9])+)([0-9])([A-Za-z0-9_]*)\(/, "$1\\$3$4(");
    str = str.replaceAll(/([A-Za-z_]+) ?\* ?([0-9]+)/, "$2$1");
    str = str.replaceAll(/\\([0-9])/, "$1");
    str = str.removeAll("Math.", "var ", / *\* */);
    str = str.replaceAll(/this\.([^ \+\-\*\/\)\(]+)/, "$\uFFFF$1").replaceAll("$\uFFFF", "$");
    str = str.removeAll(/;? ?\} */);
    str = replaceNestedFunctions(str, "pow", "([^,]+), ?(.*?)", useHTML?"$1<sup>$2</sup>":"$1^$2");
    str = str.replaceAll(/[pP][iI]/, "π");
    return str;
}
MathFunction.parse = function (str, type) {
    var func = null;
    try {
        func = stringToEquation(str);
    } catch (e) {
        TBI.error("The MathFunction failed to parse: "+e.message);
        return new MathFunction(function (x) { return 0; });
    }
    return new MathFunction(func, isNull(type) ? MathFunction.Types.Cartesian : type);
};
function stringToEquation(str, noVerify) {
    str = str.replaceAll("pi", "π");
    str = str.replaceAll(/(^ *| *$)/, "");
    if (str.search(/^f\([^\)]*/) == -1) str = "f(x) = " + str;
    str = str.replaceAll(/^f(\([^\)]*\)) ?= ?/, "function $1 { return ");
    str = str.replaceAll(/(([A-Za-z_]|\\[0-9])+)([0-9])([A-Za-z0-9_]*)\(/, "$1\\$3$4(");
    str = str.replaceAll(/([0-9π\)]+)([\(a-zA-Zπ]+)/, "$1*$2");
    str = str.replaceAll(/([a-zA-Zπ\)]+)([0-9π]+)/, "$1*$2");
    str = str.replaceAll(/\\([0-9])/, "$1");
    str = str.replaceAll(/([0-9a-zA-Z\.]+)\^(([0-9a-zA-Z\.]+|\([^\)]+?\)))/, "Math.pow($1,$2)");
    str = str.replace(/$/, "; }");
    var funcs = str.match(/[a-zA-Z_][a-zA-Z0-9_]*\(/g);
    if (funcs != null) for (var i=0;i<funcs.length;i++)
        if (typeof(Math[funcs[i].removeAll("(")]) != "undefined")
            str = str.replaceAll(new RegExp("([^\\.])("+RegExp.quote(funcs[i])+")", 'g'), "$1Math.$2");
    try {
        var func = null;
        eval("func = "+str);
        if (!noVerify) func(1);
    } catch (e) {
        TBI.error(e);
        return null;
    }
    return func;
}
// Declares a function using a string as input.
String.parseFunction = function (text) {
    var val = (text
        .replaceAll("pi", "π")
        .replaceAll(/([0-9π\)]+)([\(a-zA-Z]+)/, "$1*$2")
        .replaceAll(/([a-zA-Z\)]+)([0-9π]+)/, "$1*$2")
        .replaceAll("π", "Math.PI")
        .replaceAll(/(([^a-zA-Z\.]|^))e/, "$1Math.E")
        .replaceAll(/([0-9a-zA-Z\.]+)\^(([0-9a-zA-Z\.]+|\([^\)]+?\)))/, "Math.pow($1,$2)")
        .replaceAll(/([^\.a])(a?(sin|cos|tan))/, "$1Math.$2"));
    var regex = /f\(([a-zA-Z_]([a-zA-Z0-9_]+)?)\) ?= ?/,
        typestr = "";
    if (val.search(regex) != -1) typestr = val.match(regex)[1];
    else typestr = "x";
    val = val.replaceAll(regex, "");
    try {
        eval("var func = function ("+typestr+") { return "+val+" }");
        func(1);
    } catch (e) { TBI.error(e); return null; }
    return func;
}
function createCodedStream(str, radix, len, delimit) {
    if (isNull(len)) delimit = true;
    var characters = str.split("");
    for (var i=0,s="";i<characters.length;i++) {
        var charCode = characters[i].charCodeAt();
        s += transformDecimal(charCode, radix, len);
        if (delimit && i != characters.length-1) s += " ";
    }
    return s;
}
function translateCodedStream(str, radix, len) {
    if (isNull(radix)) return "";
    var codes = [];
    if (isNull(len)) codes = str.split(/\W+/);
    else codes = str.split(new RegExp("(\\w{"+len+"})\\W*"));
    for (var i=0,s="";i<codes.length;i++) {
        if (codes[i] != "") {
            var character = String.fromCharCode(parseInt(codes[i], radix));
            s += character;
        }
    }
    return s;
}
function transformDecimal(num, radix, len) {
    var sign = "",
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (isNull(num) ||
        isNull(radix) ||
        Math.bound(radix, 2, chars.length) != radix) return "";
    if (isNegative(num)) {
        num = Math.abs(num);
        sign = "-";
    }
    var currPlace = num % radix,
        nextPlace = Math.floor(num / radix);
    if (nextPlace < 1) return chars[currPlace];
    else return sign+zeroPrefix(transformDecimal(nextPlace, radix) + chars[currPlace], len || 0);
}
function sort(list) {
    var a = [],
        placeFromBottom = function (value) { // 2 into [1,1,2,4,5,8,9]
            for (var j=0,n=-1;j<a.length;j++) { // start at 0
                if (value >= a[j]) n = j; // try until n = 2
                else break;
            }
            if (n == -1) a.unshift(value); // if test fails
            else a.splice(n+1, 0, value); // shift after n
        },
        placeFromTop = function (value) { // 5 into [2,2,3,4,4,5,7,8,9]
            for (var j=a.length-1,n=-1;j>=0;j--) { // start at top
                if (value <= a[j]) n = j; // try until index = 4
                else break;
            }
            if (n == -1) a.push(value); // if test fails
            else a.splice(n, 0, value); // shift after n
        };
    for (var i=0;i<list.length;i++) {
        if (a.length == 0) a.push(list[i]);
        else if (list[i] <= a[Math.floor(a.length/2)]) placeFromBottom(list[i]);
        else placeFromTop(list[i]);
    }
    return a;
}
// This assumes that num == low and num == high will not be corrected
// Only difference is taken into account
// Not good for arrays, great for floats.
// Designed for such things as video game screen wrapping
Math.wrap = function (num, low, high) {
    // upper and lower bounds if low and/or high is not given
    low = isNull(low) ? -Infinity : low;
    high = isNull(high) ? Infinity : high;
    // ensuring that low < high
    if (low > high) {
        var temp = high;
        high = low;
        low = temp;
    }
    // range of "return field" (between low and high)
    var range = high - low;
    // num when confined to the return field
    var bound = Math.bound(num, low, high);
    // if the num is inside the return field (it didn't have to be confined, so it stays the same)
    if (num == bound) return bound;
    // the distance away from the return field (+ if num > max, - if num < low, 0 if inside)
    var diff = num - bound;
    // never go range away from the return field, only record in closest return field unit
    diff = diff % range;
    // if num is bounded to the higher end (num > high)
    // wrap from low side
    if (high == bound) return low + diff;
    // if num is bounded to the lower end (num < low)
    // wrap from right side (diff is negative in this case)
    else if (low == bound) return high + diff;
    else return bound;
}
// arr[num % arr.length], but more generalised.
Math.wrapArray = function (arr, num) {
    return arr[((num % arr.length) + arr.length) % arr.length];
}
Math.bounce = function (num, low, high) {

}

function Circle(centre, radius) {
    this.centre = centre;
    this.radius = radius;
}
Circle.prototype = {
    constructor: Circle,
    contains: function (point) {
        return this.centre.subtract(point).magnitude() < this.radius;
    }
}
Object.defineProperty(Circle.prototype, "diameter", {
    get: function () { return 2*this.radius; },
    set: function (val) { this.radius = val/2; }
});
Object.defineProperty(Circle.prototype, "circumference", {
    get: function () { return 2*Math.PI*this.radius; },
    set: function (val) { this.radius = val/(2*Math.PI); }
});
Object.defineProperty(Circle.prototype, "area", {
    get: function () { return Math.PI*this.radius*this.radius; },
    set: function (val) { this.radius = Math.sqrt(val/Math.PI); }
});

function Polygon(points) {
    this.points = points;
}
Polygon.prototype.getSides = function () {
    var sides = [], j = this.points.length - 1;
    for (var i=1;i<this.points.length;i++) {
        sides.push(new LineSegment(this.points[j], this.points[i]));
        j = i;
    }

    return sides;
}
Polygon.prototype.area = function () {
    var area = 0, j;
    for (var i=1;i<this.points.length;i++) {
        j = (i + 1) % this.points.length;
        area += (this.points[i].x + this.points[j].x) * (this.points[i].y - this.points[j].y);
    }

    return Math.abs(area/2);
}

// TODO: implement logic gate adding machine

function BigNumber(mantissa, exponent, negative) {
    this.mantissa = mantissa;
    this.exponent = parseInt(exponent);
    this.negative = negative ? true : false;
}
BigNumber.fromNative = function (n, exponent) {
    this.negative = n < 0;
    n = Math.abs(n);
    var fracComp = (n % 1).toFixed(15).removeAll(/0*$/).substring(2),
        intComp = parseInt(n).toString().removeAll(/^0*/),
        mapFunc = function (e) { return parseInt(e, 10); };

    this.mantissa = intComp.split("").map(mapFunc).concat(fracComp.split("").map(mapFunc));
    if (!isNaN(parseInt(exponent)))
        this.exponent = parseInt(exponent) + (intComp.length - 1);
    else this.exponent = intComp.length < 1 ? -fracComp.length : intComp.length - 1;

}
BigNumber.fromString = function (n, exponent) {
    this.negative = n.startsWith("-");
    n = n.removeAll("-");
    var split = n.split(".");
    var fracComp = split.length > 1 ? split[1].removeAll(/0*$/) : "",
        intComp = split[0].removeAll(/^0*/),
        mapFunc = function (e) { return parseInt(e, 10); };

    this.mantissa = intComp.split("").map(mapFunc).concat(fracComp.split("").map(mapFunc));
    if (!isNaN(parseInt(exponent)))
        this.exponent = parseInt(exponent) + (intComp.length - 1);
    else this.exponent = intComp.length < 1 ? -fracComp.length : intComp.length - 1;
}
BigNumber.parse = function (n, exponent) {
    if (typeof n == typeof "") return BigNumber.fromString(n, exponent);
    else if (typeof n == typeof 0) return BigNumber.fromNative(n, exponent);
    else return BigNumber.fromNative(0);
}

BigNumber.prototype.toNative = function () {
    return (this.negative ? -1 : 1) * parseFloat(this.mantissa[0] + "." + this.mantissa.slice(1).join("") + "e" + this.exponent.toString());
}
BigNumber.fromNative = function (n, exponent) {
    this.negative = n < 0;
    n = Math.abs(n);
    var fracComp = (n % 1).toFixed(15).removeAll(/0*$/).substring(2),
        intComp = parseInt(n).toString().removeAll(/^0*/),
        mapFunc = function (e) { return parseInt(e, 10); };

    this.mantissa = intComp.split("").map(mapFunc).concat(fracComp.split("").map(mapFunc));
    if (!isNaN(parseInt(exponent)))
        this.exponent = parseInt(exponent) + (intComp.length - 1);
    else this.exponent = intComp.length < 1 ? -fracComp.length : intComp.length - 1;

}
BigNumber.fromString = function (n, exponent) {
    this.negative = n.startsWith("-");
    n = n.removeAll("-");
    var split = n.split(".");
    var fracComp = split.length > 1 ? split[1].removeAll(/0*$/) : "",
        intComp = split[0].removeAll(/^0*/),
        mapFunc = function (e) { return parseInt(e, 10); };

    this.mantissa = intComp.split("").map(mapFunc).concat(fracComp.split("").map(mapFunc));
    if (!isNaN(parseInt(exponent)))
        this.exponent = parseInt(exponent) + (intComp.length - 1);
    else this.exponent = intComp.length < 1 ? -fracComp.length : intComp.length - 1;
}

BigNumber.prototype.negate = function () {
    return new BigNumber(this.mantissa, this.exponent, !this.negative);
}

BigNumber.prototype.add = function (n2) {
    if (!(n2 instanceof BigNumber)) n2 = BigNumber.parse(n2);

    if (n2.negative) return this.subtract(n2.negate());
    else if (this.negative && !n2.negative) return this.negate().subtract(n2).negate();

    var m1 = this.mantissa.length,
        m2 = n2.mantissa.length;
    var diff = Math.abs(this.exponent - n2.exponent);

    var newMantissa = new Array(m1 + m2 - (Math.min(m1, m2) - diff)),
        carry = new Array(newMantissa.length + 1);
    for (var i=newMantissa.length-1;i>=0;i--) {
        var i1 = i - n2.exponent + this.exponent;
        var i2 = i - this.exponent + n2.exponent;

        var newVal = carry[i+1] == undefined ? 0 : carry[i+1];
        if (i1 > 0 && i1 < m1) newVal += this.mantissa[i1];
        if (i2 > 0 && i2 < m2) newVal += n2.mantissa[i2];

        if (newVal > 10) {
            carry[i] = parseInt(newVal / 10);
            newVal -= carry[i] * 10;
        }
        newMantissa[i] = newVal;
    }

    if (carry[0] != undefined) newMantissa.unshift(carry[0]);

    var newExponent = Math.max(this.exponent, n2.exponent) + (carry[0] != undefined ? 1 : 0);

    return new BigNumber(newMantissa, newExponent, false);
}
BigNumber.prototype.subtract = function (n2) {
    if (!(n2 instanceof BigNumber)) n2 = BigNumber.parse(n2);

    if (n2.negative) return this.add(n2.negate());
    else if (this.negative && !n2.negative) return this.negate().add(n2).negate();

    var m1 = this.mantissa.length,
        m2 = n2.mantissa.length;
    var diff = Math.abs(this.exponent - n2.exponent);

    var newMantissa = new Array(m1 + m2 - (Math.min(m1, m2) - diff)),
        carry = new Array(newMantissa.length + 1);

}
