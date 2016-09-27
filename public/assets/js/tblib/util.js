if (!window.jQuery) {
    throw new Error("[tblib/util.js] jQuery has not been loaded");
} else if (!window.TBI) {
    throw new Error("[tblib/util.js] base.js has not been loaded");
}

TBI.Util = {};

$(function () {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.search(/firefox/)!=-1)
        document.body.className += " gecko";
    else if (ua.search(/webkit/)!=-1)
        document.body.className += " webkit";
    else if (ua.search(/trident/)!=-1)
        document.body.className += " trident";
    else if (ua.search(/msie/)!=-1)
        document.body.className += " ie";
});
// Shorthand for document.getElementById.
function gebi(id) { return document.getElementById(id); }
HTMLElement.prototype.gebi = function (id) { return this.getElementById(id) };
// Shorthand for document.getElementsByClassName.
function gecn(className) { return document.getElementsByClassName(className); }
HTMLElement.prototype.gecn = function (className) { return this.getElementsByClassName(className); };
// Shorthand for document.getElementsByTagName.
function getn(tagName) { return document.getElementsByTagName(tagName); }
HTMLElement.prototype.getn = function (tagName) { return this.getElementsByTagName(tagName); };
// Shorthand for document.getElementsByName.
function gebn(name) { return document.getElementsByName(name); }
HTMLElement.prototype.gebn = function (name) { return this.getElementsByName(name); };
HTMLElement.prototype.getStyle = function (name) { return getComputedStyle(this)[name]; };

function zeroPrefix(num, len, char) {
    len = len || 2;
    char = char || "0";
    num = num.toString();
    while (num.length < len) num = char + num;
    return num;
}

function sprintf(format) {
    var str = format;
    var args = []; for (var k=1;k<arguments.length;k++) args.push(arguments[k]);
    var j = 0;
    for (var i=0,f=false,s="";i<format.length;i++) {
        if (f) {
            s += format[i];
            switch (s) {
                case "s":
                    str = str.replace(/%s/, args[j++]); break;
                case "f":
                    str = str.replace(/%f/, parseFloat(args[j++])); break;
                case "i":
                    str = str.replace(/%i/, parseInt(args[j++])); break;
            }
        }
        if (format[i] == "%") { f = true; s = ""; }
        else if (f) f = false;
    }
    return str;
}

// Creates a multi-dimensional array given the depths of the dimensions.
Array.dimensional = function (lengths, initial) {
    if (isNull(lengths)) lengths = [0];
    Array.call(this);
    var len = lengths.shift();
    for (var i=0;i<len;i++) this.push(lengths.length==0?initial:new Array.dimensional(lengths, initial));
    /*var _checkDimension = function (arr) {
        var checked = false;
        arr.forEach(function (el) {
            if (el instanceof Array && !checked) {
                currDimension++;
                checked = true;
                return _checkDimension(el, currDimension);
            }
        });
        return currDimension;
    };
    Object.defineProperty(this, "dimension", {
        get: function () { return _checkDimension(this, 1) },
        enumerable: true
    });*/
    return this;
};
Array.dimensional.prototype = [];
Array.dimensional.prototype.constructor = Array.dimensional;
// Gemerates a dimensional array given a regular array.
Array.dimensional.fromArray = function (arr) {
    var a = new Array.dimensional([arr.length]);
    for (var i in arr) if (arr.hasOwnProperty(i)) {
        if (arr[i] instanceof Array) a[i] = Array.dimensional.fromArray(arr[i]);
        else a[i] = arr[i];
    }
    return a;
};
// Copies a multi-dimensional array into another.
Array.dimensional.prototype.copy = function () {
    var a = new Array.dimensional([0]);
    for (var i=0;i<this.length;i++) a.push(this[i]);
    return a;
};
// replaces elements of an array given the source entry dimensions, the new array and its dimensions.
Array.dimensional.prototype.replace = function (sdim, d, ddim) {
    if (!(d instanceof Array.dimensional)) d = Array.dimensional.fromArray(d);
    if (!(sdim instanceof Array.dimensional)) sdim = Array.dimensional.fromArray(sdim);
    if (!(ddim instanceof Array.dimensional)) ddim = Array.dimensional.fromArray(ddim);
    var sd = sdim.shift(),
        dd = ddim.shift();
    for (var i=sd[0],j=dd[0];i<sd[1],j<dd[1];i++,j++) {
        if (this[i] instanceof Array.dimensional) this[i].replace(sdim.copy(), d[j], ddim.copy());
        else this[i] = d[j];
    }
    return this;
};
// Turns a multi-dimensional array into a regular array.
Array.dimensional.prototype.flatten = function () {
    for (var i=0,a=[];i<this.length;i++) {
        if (this[i] instanceof Array.dimensional) a = a.concat(this[i].flatten());
        else a = a.concat(this[i]);
    }
    return a;
};
// Gets a section of a multi-dimensional array given entry and exit points for each dimension.
Array.dimensional.prototype.getSection = function (sdim) {
    var sd = sdim.shift(),
        a = new Array.dimensional([0]);
    if (!(sdim instanceof Array.dimensional)) sdim = Array.dimensional.fromArray(sdim);
    for (var i=sd[0];i<sd[1];i++) {
        if (this[i] instanceof Array.dimensional) a.push(this[i].getSection(sdim.copy()));
        else a.push(this[i]);
    }
    return a;
};
// Transposes a two dimensional array.
Array.dimensional.prototype.transpose2d = function (r) {
    r = isNull(r) ? 1 : r;
    for (var i=0,l=this[0].length,m=this.length,n=new Array.dimensional([l,m]);i<l;i++)
        for (var j=0;j<m;j++) n[i][j] = this[j][i];
    if (r > 1) return n.transpose2d(r-1);
    else return n;
};
Object._oldToString = Object.prototype.toString;
Object.oldToString = function (obj) {
    return Object._oldToString.call(obj);
};
Object.prototype.toString = function () {
    try {
        if (JSON.stringify) return JSON.stringify(this);
        var s = "";
        for (var prop in this) if (this.hasOwnProperty(prop)) {
            if (isNull(this[prop])) s += prop + ":" + (typeof(this[prop]) == "string" ? "" : typeof(this[prop])) + ",";
            else s += prop + ":" + this[prop].toString() + ",";
        }
        return "{" + s.substring(0, s.length - 1) + "}";
    } catch (e) {
        return Object.oldToString(this);
    }
};
Array._oldToString = Array.prototype.toString;
Array.oldToString = function (arr) {
    return Array._oldToString.call(arr);
}
Array.prototype.toString = function () {
    return "[" + Array.oldToString(this) + "]";
};
// Returns whether or not two arrays are the same.
Array.prototype.isEqual = function (arr) { return isEqual(this, arr); };
// Determines whether or not an array contains a particular item.
Array.prototype.contains = function (item) {
    for (var i=0;i<this.length;i++) if (isEqual(this[i], item)) return true; return false;
};
// Takes an array and reverses the order of its elements (e.g. [0,1,2,3] to [3,2,1,0])
Array.prototype.reverse = Array.prototype.reverse || function () {
    for (var i=this.length-1,a=[];i>=0;i--) a.push(this[i]);
    return a;
};
// Shorthand for removing a specific element index from an array.
Array.prototype.remove = Array.prototype.remove || function (index) {
    this.splice(index, 1);
    return this;
};
// Copies the elements from one array to another to prevent unintended changes to another array.
Array.prototype.copy = Array.prototype.copy || function () {
    for (var i=0,a=[];i<this.length;i++) a.push(this[i]);
    return a;
};
// Makes sure that a string doesn't get mistaken for meta-characters when constructing a RegExp from a string.
RegExp.quote = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};
// Replaces all instances of a specified string or regular expression with the given replacement string.
// When using parentheses in a regular expression; the contents of them will
// replace "$1"-"$9" in the replacement string in the order of where they are in the RegExp.
String.prototype.replaceAll = String.prototype.replaceAll || function (toReplace, replacement) {
    if (typeof(toReplace) == "string") toReplace = new RegExp(RegExp.quote(toReplace), 'g');
    else if (toReplace instanceof RegExp) toReplace = new RegExp(toReplace.source, 'g');
    return this.replace(toReplace, replacement);
};
// Removes all instances of each of the arguments from a string.
String.prototype.removeAll = function () {
    for (var i=0,s=this;i<arguments.length;i++)
        s = s.replaceAll(arguments[i], "");
    return s;
};
// Takes a string and reverses the order of its characters (e.g. "Hello world!" to "!dlrow olleH").
String.prototype.reverse = String.prototype.reverse || function () {
    for (var i=this.length-1,s="";i>=0;i--) s += this.charAt(i);
    return s;
};
// Returns a bool indicating whether or not the current string contains str at the beginning.
String.prototype.beginsWith = String.prototype.beginsWith || function (str) {
    if (str.length > this.length) return false;
    return this.indexOf(str) == 0;
};
// Returns a bool indicating whether or not the current string contains str at the end.
String.prototype.endsWith = String.prototype.endsWith || function (str) {
    if (str.length > this.length) return false;
    return this.lastIndexOf(str) == this.length-str.length;
};
// Splices an element and returns the array while preserving the original.
function splice(list, index, howMany) {
    var newlist = [];
    for (var i=0;i<list.length;i++)
        if (!(i >= index && i < index+howMany)) newlist.push(list[i]);
    return newlist;
}
// A function to compare often inaccurate floating-point values by measuring their difference against an immesurably small value.
Number.prototype.isFloatEqual = function (num) { return Math.abs(num - this) < Number.EPSILON };
// Fixes a malfunctioning floating-point value (e.g. 2.999999999995) by slightly reducing its precision.
Number.prototype.fixFloat = function (num) { return parseFloat(this.toPrecision(num?(num<13?num:12):12)) };
// Fixes a malfunctioning modulo function by fixing the arguments and the result.
Number.prototype.fixMod = function (mod, num) {
    var temp = (this.fixFloat(num) % mod.fixFloat(num)).fixFloat(num);
    if (temp.isFloatEqual(mod)) return 0;
    else return temp;
};
// arr.indexOf polyfill.
Array.prototype.indexOf = Array.prototype.indexOf || function (obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i++) if (this[i] === obj) return i;
    return -1;
};
// Sorts a number list in ascending order.
function oldSort(templst) {
    // while an acceptable algorithm, it does not take very long to overcome the call stack limit.
    var min = Math.min.apply(null, templst),
        max = Math.max.apply(null, templst);
    templst = splice(templst, templst.indexOf(min), 1);
    templst = splice(templst, templst.indexOf(max), 1);
    if (templst.length == 0) return [min,max];
    else if (templst.length == 1) return [min,templst[0],max];
    else {
        var newarr = sort(templst);
        newarr.push(max);
        newarr.unshift(min);
        return newarr;
    }
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
/*
function sort(list) {
    var swapListItems = function (a, i, j) { var temp = a[i]; a[i] = a[j]; a[j] = temp; }
    var determinePivot = function (a, istart, iend) {

    }
    var quicksort = function (a, istart, iend, pivot) {
        var running = istart;
        for (var i=istart;i<iend;i++) {
            if (a[i] >= pivot)
                swapListItems(a, i, running++);
        }
        if (iend - istart < 2) {
            quicksort(a, istart, running);
            quicksort(a, running, iend);
        }
    }
}
*/
function isSorted(list) {
    for (var i=1;i<list.length;i++)
        if (list[i-1] > list[i]) return false;
    return true;
}
// *stolen* off
// http://www.fleegix.org/articles/2006/05/30/getting-the-scrollbar-width-in-pixels
var scrollerWidth = -1;
function getScrollerWidth() {
    if (scrollerWidth != -1) return scrollerWidth;

    var scr, inn, wNoScroll, wScroll;

    // Outer scrolling div
    scr = document.createElement('div');
    scr.style.position = 'absolute';
    scr.style.top = '-1000px';
    scr.style.left = '-1000px';
    scr.style.width = '100px';
    scr.style.height = '50px';
    // Start with no scrollbar
    scr.style.overflow = 'hidden';

    // Inner content div
    inn = document.createElement('div');
    inn.style.width = '100%';
    inn.style.height = '200px';

    // Put the inner div in the scrolling div
    scr.appendChild(inn);
    // Append the scrolling div to the doc
    document.body.appendChild(scr);

    // Width of the inner div sans scrollbar
    wNoScroll = inn.offsetWidth;
    // Add the scrollbar
    scr.style.overflow = 'auto';
    // Width of the inner div width scrollbar
    wScroll = inn.offsetWidth;

    // Remove the scrolling div from the doc
    document.body.removeChild(
        document.body.lastChild);

    // Pixel width of the scroller
    scrollerWidth = (wNoScroll - wScroll);
    return scrollerWidth;
}
// A set of keycode definitions. Used for ease of use when writing programs with onkeydown events.
var Keys = {
    SPACE:32,ESC:27,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123,
    HOME:36,END:35,INSERT:45,DELETE:46,GRAVE:192,ZERO:48,ONE:49,TWO:50,THREE:51,FOUR:52,FIVE:53,SIX:54,
    SEVEN:55,EIGHT:56,NINE:57,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,
    Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90,HYPHEN:189,EQUALS:187,LBRAC:219,BACKSLASH:220,
    RBRAC:221,QUOTE:222,SEMICOLON:186,COMMA:188,PERIOD:190,SLASH:191,CTRL:17,ALT:18,SHIFT:16,TAB:9,
    CAPS_LOCK:20,PAGE_UP:33,PAGE_DOWN:34,SUPER:91,UP:38,DOWN:40,LEFT:37,RIGHT:39,RETURN:13,BACKSPACE:8,
    NUM_7:103,NUM_8:104,NUM_9:105,NUM_4:100,NUM_5:101,NUM_6:102,NUM_1:97,NUM_2:98,NUM_3:99,NUM_0:96,
    NUM_PERIOD:110,NUM_DIVIDE:111,NUM_MULTIPLY:106,NUM_SUBTRACT:109,NUM_ADD:107
};
// Converts a keypress event into a string that represents the face value of the key.
function convertKeyDown(event) {
    var chars = {
        32:" ",27:"esc",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",
        121:"f10",122:"f11",123:"f12",36:"home",35:"end",45:"insert",46:"delete",192:"`",48:"0",49:"1",
        50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",
        71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",
        85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",189:"-",187:"=",219:"[",220:"\\",221:"]",222:"'",186:";",
        188:",",190:".",191:"/",17:"ctrl",18:"alt",16:"shift",9:"tab",20:"caps",33:"pgup",34:"pgdn",
        91:"super",38:"up",40:"down",37:"left",39:"right",13:"enter",8:"backspace",103:"7",104:"8",105:"9",
        100:"4",101:"5",102:"6",97:"1",98:"2",99:"3",96:"0",110:".",111:"/",106:"*",109:"-",107:"+"
    };
    if (event.shiftKey && event.which != 16) return shiftUp(event.which, true);
    else return chars[event.which];
}
// Converts a normal key press into a shifted one.
// Only works on US keyboard layouts (no pounds or funny euroes)
function shiftUp(key, isKeyDown) {
    var chars = {};
    if (isKeyDown) {
        chars = {
            49:'!',50:'@',51:'#',52:'$',53:'%',54:'^',55:'&',56:'*',57:'(',48:')',189:'_',187:'+',192:'~',219:'{',
            221:'}',220:'|',186:':',222:'"',188:'<',190:'>',111:'?'
        };
        if (isNull(chars[key])) return key.toString();
        else return chars[key.toString()];
    } else {
        chars = {
            '1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+','`':'~','[':'{',
            ']':'}','\\':'|',';':':','\'':'"',',':'<','.':'>','/':'?'
        };
        if (key.search(/[a-z]/) != -1 && key.length == 1) return key.toUpperCase();
        else if (isNull(chars[key])) return key.toString();
        else return chars[key.toString()];
    }
}
// Converts shifted characters back down into normal ones.
function shiftDown(key) {
    var chars = {
        '!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','~':'`','{':'[',
        '}':']','|':'\\',':':';','"':'\'','<':',','>':'.','?':'/'
    };
    if (key.search(/[A-Z]/) != -1 && key.length == 1) return key.toLowerCase();
    else if (isNull(chars[key])) return key.toString();
    else return chars[key.toString()];
}
// A set of functions designed to be used with the Pointer Lock API.
var PointerLock = {
    check: function (l) {
        return PointerLock.get() == l;
    },
    get: function () {
        return document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
    },
    set: function (l, callback) {
        l.requestPointerLock = l.requestPointerLock || l.mozRequestPointerLock || l.webkitRequestPointerLock;
        l.requestPointerLock();
        if (callback) $(l).on("pointerlockchange", callback);
    },
    release: function (l) {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
        $(l).off("pointerlockchange");
    }
};

var Fullscreen = {
    check: function (l) {
        l = l || document.documentElement;
        return Fullscreen.get() == l;
    },
    get: function () {
        return document.fullscreenElement || document.mozFullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement;
    },
    set: function (l) {
        l = l || document.documentElement;
        l.requestFullscreen = l.requestFullscreen || l.mozRequestFullScreen || l.msRequestFullscreen || l.webkitRequestFullscreen;
        l.requestFullscreen();
    },
    release: function () {
        document.exitFullscreen = document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;
        document.exitFullscreen();
    }
};
// A 2 dimensional vector quantity.
function Vector2D(x, y) { if (isNull(y)) y = x; this.x = x; this.y = y; }
Vector2D.fromPolar = function (azimuth, radius) { return new Vector2D(radius*Math.cos(azimuth), radius*Math.sin(azimuth)); };
Vector2D.parse = function (str) { var components = str.replace(/\(\)/, "").split(/, ?/); return new Vector2D(components[0], components[1]); };
Vector2D.prototype = {
    constructor: Vector2D,
    // Create a copy of the vector that won't change the original.
    copy: function () { return new Vector2D(this.x, this.y); },
    // add, subtract and multiply are self-explanatory.
    add: function (a) { if (a instanceof Vector2D) return this.addVector(a); else return this.addScalar(a); },
    // note: "scalar" here just means "number", as in "not vector".
    addScalar: function (n) { return new Vector2D(this.x + n, this.y + n); },
    addVector: function (vec) { return new Vector2D(this.x + vec.x, this.y + vec.y); },
    subtract: function (a) { if (a instanceof Vector2D) return this.subtractVector(a); else return this.subtractScalar(a); },
    subtractScalar: function (n) { return new Vector2D(this.x - n, this.y - n); },
    subtractVector: function (vec) { return new Vector2D(this.x - vec.x, this.y - vec.y); },
    // Returns the magnitude of the vector.
    magnitude: function () { return Math.pythagoras(this.x, this.y); },
    // Returns the square of the magnitude of the vector (less computationally intensive).
    magnitudeSquared: function () { return this.dot(this); },
    // Changes the vector into a unit vector.
    normalise: function () { var mag = this.magnitude(); this.x /= mag; this.y /= mag; return this; },
    inverse: function () { return new Vector2D(1/this.x, 1/this.y); },
    // Rotates the vector into the first quadrant (++).
    absolute: function () { return new Vector2D(Math.abs(this.x), Math.abs(this.y)); },
    multiply: function (a) { if (a instanceof Vector2D) return this.multiplyVector(a); else return this.multiplyScalar(a); },
    multiplyScalar: function (n) { return new Vector2D(this.x * n, this.y * n); },
    multiplyVector: function (vec) { return new Vector2D(this.x * vec.x, this.y * vec.y); },
    divide: function (a) { if (a instanceof Vector2D) return this.divideVector(a); else return this.divideScalar(a); },
    divideScalar: function (n) { return this.multiply(1/n); },
    divideVector: function (vec) { return this.multiply(vec.inverse()); },
    negate: function () { return this.multiply(-1); },
    // Returns the dot product of two vectors.
    dot: function (vec) { return this.x*vec.x + this.y*vec.y; },
    // Returns the wedge product of two vectors.
    wedge: function (vec) { return this.x*vec.y - this.y*vec.x; },
    // Clamps the vector's x and y values to a minimum and maximum vector.
    clamp: function (min, max) { return new Vector2D(Math.bound(this.x, min.x, max.x), Math.bound(this.y, min.y, max.y)); },
    // Returns the angle formed by the vector with the positive X axis in the anticlockwise direction.
    angle: function () { return Math.atan2(this.y, this.x); },
    // Projects the vector onto another.
    project: function (vec) { return vec.multiply(this.dot(vec)/vec.dot(vec)); },
    // Gets the normal of a vector.
    normal: function (dir) { if (dir) return new Vector2D(-this.y, this.x); else return new Vector2D(this.y, -this.x); },
    // Law of reflection, assuming instaced vector is the incidence vector and argument is the surface normal.
    reflect: function (nml) { return nml.multiply(2*this.dot(nml)).subtract(this); },
    equals: function (vec) { return this.x == vec.x && this.y == vec.y; },
    fix: function (num) { return new Vector2D(this.x.fixFloat(num), this.y.fixFloat(num)); },
    toMatrix: function () { return new Matrix([this.x, this.y]); },
    // Use this one though, totally cool with it.
    toString: function () { return "("+this.x+", "+this.y+")"; },
    valueOf: function () { throw new TypeError("Vector2D maths failed: Use the member functions .add, .subtract, .multiply, etc. You're doing it wrong, somewhere."); }
};
Vector2D.zero = new Vector2D(0, 0);
// Returns a random positive integer below the specified number.
function randomInt(num) { return parseInt(Math.random()*num) }
// Returns a random integer between two numbers.
function advRandomInt(num1, num2) { return parseInt(Math.random()*(num2-num1))+num1; }
// For legacy applications.
function intRand(num) { return randomInt(num) }
// Degrees to radians.
function dtr(deg) { return (Math.PI/180)*deg }
// Radians to degrees.
function rtd(rad) { return (180/Math.PI)*rad }
// Location of a point on a circle's circumference.
function circlePoint(a, r, x, y) { return new Vector2D((x||0)+r*Math.cos(dtr(a)),(y||0)+r*Math.sin(dtr(a))) }
// Formula for the circumference of a circle with the specified radius r.
function circum(r) { return 2*Math.PI*r }
// Formula for calculating the hypotenuse length of a right angled triangle, given sides a and b.
// If mode is true, it returns the remaining side length given a side length and the hypotenuse length.
Math.pythagoras = function (arg0, arg1, mode) {
    if (mode && arg0 > arg1) return Math.sqrt((arg0*arg0)-(arg1*arg1));
    else if (mode && arg0 < arg1) return Math.sqrt((arg1*arg1)-(arg0*arg0));
    else if (Math.hypot) return Math.hypot(arg0, arg1);
    else return Math.sqrt((arg0*arg0)+(arg1*arg1)).fixFloat();
};
// Bounds a number by returning the low value if it is lower than it, and returns the high value if it is higher than it.
Math.bound = function (num, low, high) {
    low = isNull(low) ? -Infinity : low;
    high = isNull(high) ? Infinity : high;
    return num < low ? low : num > high ? high : num;
};
// requestAnimationFrame polyfill
window.requestAnimationFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
function (cback) { setTimeout(cback, 1000/60); };

// Moves the specified element in 2D CSS space using transforms
function moveWithTransforms(el, x, y, abs) {
    var currTransform = el.style.transform ||
                        el.style.webkitTransform ||
                        el.style.mozTransform || ""; // get current transform
    if (!abs && !isNull(currTransform)) { // if it exists...
        var currX = 0, currY = 0;
        try { // if it complains about the match being null, don't hold up execution and just reset the values
            currX = parseInt(currTransform.match(/translateX\(([^\)]*)\)/)[1]);
            currY = parseInt(currTransform.match(/translateY\(([^\)]*)\)/)[1]);
        } catch (e) { }
        if (!isNaN(currX)) x += currX; // add the previous values to the current one
        if (!isNaN(currY)) y += currY;
        currTransform = currTransform.replace(/translate[XY]\([^\)]*\) ?/g, ""); // get rid of previous transform
    } else currTransform = ""; // otherwise set it to be empty
    currTransform += "translateX("+x+"px) "; // transform appropriately
    currTransform += "translateY("+y+"px) ";
    if (el.style.transform !== undefined) el.style.transform = currTransform; // apply changes
    else if (el.style.webkitTransform !== undefined) el.style.webkitTransform = currTransform;
    else if (el.style.mozTransform !== undefined) el.style.mozTransform = currTransform;
}
function resetMovementWithTransforms(el) {
    el.style.transform = el.style.transform.replace(/translate[XY]\([^\)]*\) ?/g, "");
}

// Quick and dirty class for representing top, right, bottom and left properties.
// Similar to CSS margin-width, border-width, etc. shorthand.
function DirectionQuantity(top, right, bottom, left) {
    this.top = top;
    this.right = right || top;
    this.bottom = bottom || top;
    this.left = left || right || top;
}

/** A class for colours.
 * Currently supports constructing from and outputting
 * RGB, RGBA, HSV and hex colour formatted strings.
 * HSL coming soon.
 * Also supports 3-4 values for red, green, blue and alpha.
 * Can also take a colour object as an argument (for compatibility).
 * @param arg0 Can be any of Colour type, red channel as Integer (0-255),
 * (hsv|rgb|rgba) colour spec, full hex string or shortened W3C hex string (#000).
 * @param g When using 3/4 RGBA? numbers, this represents the green channel (0-255).
 * @param b When using 3/4 RGBA? numbers, this represents the blue channel (0-255).
 * @param a When using 4 RGBA numbers, this represents the alpha channel (0-1).
 * @constructor
 */
function Colour(arg0, g, b, a) {
    // default is transparent, also colour returned when parsing fails
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;

    if (arg0 instanceof Colour) {
        this.r = arg0.r;
        this.g = arg0.g;
        this.b = arg0.b;
        this.a = arg0.a;
    // if input is provided as three/four rgb(a) values
    } else if (!isNull(g) && !isNull(b)) {
        this.r = arg0;
        this.g = g;
        this.b = b;
        this.a = !isNull(a) ? a : 1;
    // here comes the string parsing
    } else if (!isNull(arg0)) {
        var vals;
        var str = arg0;
        if (Colours[str] instanceof Colour) {
            var col = Colours[str];
            this.r = col.r;
            this.g = col.g;
            this.b = col.b;
            this.a = col.a;
        } else if (str.startsWith("#")) {
            this.setHex(str);
        // if it's rgb formatted, extract the numbers from the string
        } else if (str.startsWith("rgb")) {
            // remove the rgb/rgba( and ) delimiters
            str = str.removeAll(/rgba?\(/, ")");
            // split by commas and trailing whitespace
            vals = str.split(/,\W*/);
            // only accept good lengths of input
            if (vals.length == 3 || vals.length == 4) this.setRGBA(
                // and just parse the strings as integers
                parseInt(vals[0]),
                parseInt(vals[1]),
                parseInt(vals[2]),
                parseFloat(isNull(vals[3]) ? 1 : vals[3])
            );
        // pretty much rgb() all over again, but with a few modifications
        // and no optional alpha to worry about
        } else if (str.startsWith("hsv")) {
            str = str.removeAll("hsv(", ")");
            vals = str.split(/,\W*/);
            if (vals.length == 3) this.setHSV(
                parseInt(vals[0]),
                // s and v are apparently given as percentages rather than floats
                // parseFloat() gets rid of the trailing percentage mark
                // (lazy, I know)
                parseFloat(vals[1])/100,
                parseFloat(vals[2])/100
            )
        }
    }

    // a pseudo-property for the hue (hue hue hue) value
    // stolen from the same website where I got my hsv parsing code from
    Object.defineProperty(this, "h", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            var M = Math.max(r, g, b);
            var m = Math.min(r, g, b);
            var delta = M - m;
            if (delta == 0) return 0;

            switch (M) {
                case r: return 60 * (((g - b)/delta) % 6); break;
                case g: return 60 * (((b - r)/delta) + 2); break;
                case b: return 60 * (((r - g)/delta) + 4); break;
            }
        }, set: function (h) {
            this.setHSV(h, this.s, this.v);
        }
    });
    // another pseudo-property, this time for saturation
    Object.defineProperty(this, "s", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            var max = Math.max(r, g, b);
            var delta = max - Math.min(r, g, b);

            if (max == 0) return 0;
            else return delta / max;
        }, set: function (s) {
            s = s.toString();
            // either it is given as a percentage, or as a float
            // handle both
            if (s.endsWith("%")) s = parseFloat(s)/100;
            this.setHSV(this.h, s, this.v);
        }
    });
    // last one for the 'value' value
    Object.defineProperty(this, "v", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            return Math.max(r, g, b);
        }, set: function (v) {
            v = v.toString();
            // either it is given as a percentage, or as a float
            // handle both
            if (v.endsWith("%")) v = parseFloat(v)/100;
            this.setHSV(this.r, this.s, v);
        }
    });
}
Colour.prototype = {
    constructor: Colour,

    // Sets a Colour object with the colour represented by a hex string.
    // e.g. "#6a0094" or "#ffd" or "AADF09"
    setHex: function (hexStr) {
        // get rid of the "#", and don't rely on it
        hexStr = hexStr.removeAll("#");
        // if hex is three-digit shorthand
        if (hexStr.length == 3) {
            // too lazy for the mathematical way
            hexStr = [
                hexStr[0], hexStr[0],
                hexStr[1], hexStr[1],
                hexStr[2], hexStr[2]
            ];
        }
        if (hexStr.length == 6) {
            // simple: just convert the relevant hex areas of the string
            // into their decimal representations using parseInt().
            this.r = parseInt(hexStr[0]+hexStr[1], 16);
            this.g = parseInt(hexStr[2]+hexStr[3], 16);
            this.b = parseInt(hexStr[4]+hexStr[5], 16);
            this.a = 1;
        }

        return this;
    },
    // Sets a Colour object with the colour represented by three
    // red, green and blue bytes.
    // e.g. (34, 89, 179)
    setRGB: function (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;

        return this;
    },
    // Sets a Colour object with the colour represented by three
    // red, green and blue bytes and an alpha channel intensity.
    // e.g. (34, 89, 179, 0.73)
    setRGBA: function (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = isNull(a) ? 1 : a;

        return this;
    },
    // Sets a Colour object with the colour represented by
    // three hue [0-360), saturation [0-1] and value [0-1] values.
    // e.g. 190, 0.5, 0.83
    // Also: I got this off of a website, no idea where it was [not mine]
    // and I have no idea how this works (well, I have a cursory idea)
    setHSV: function (h, s, v) {
        var c = v * s;
        var x = c * (1 - Math.abs((h/60) % 2 - 1));
        var m = v - c;

        var rgb = [0, 0, 0];
        if      (h <  60) rgb = [c,x,0];
        else if (h < 120) rgb = [x,c,0];
        else if (h < 180) rgb = [0,c,x];
        else if (h < 240) rgb = [0,x,c];
        else if (h < 300) rgb = [x,0,c];
        else if (h < 360) rgb = [c,0,x];

        this.r = (rgb[0] + m)*255;
        this.g = (rgb[1] + m)*255;
        this.b = (rgb[2] + m)*255;
        this.a = 1;

        return this;
    },

    // These functions return valid string representations of themselves
    // in various formats (these can also be passed back into Colour()).
    // Useful for HTML/CSS styling and colour animation.
    toRGBA: function () {
        var p = parseInt;
        return "rgba("+p(this.r)+", "+p(this.g)+", "+p(this.b)+", "+this.a+")";
    },
    toRGB: function () {
        var p = parseInt;
        return "rgb("+p(this.r)+", "+p(this.g)+", "+p(this.b)+")";
    },
    toHex: function () {
        var red = zeroPrefix(parseInt(this.r).toString(16), 2);
        var green = zeroPrefix(parseInt(this.g).toString(16), 2);
        var blue = zeroPrefix(parseInt(this.b).toString(16), 2);
        return "#"+red+green+blue;
    },
    toNumber: function () {
        return parseInt(this.toHex().removeAll("#"), 16);
    },
    toHSV: function () {
        return "hsv("+parseInt(this.h)+", "+(this.s*100)+"%, "+(this.v*100)+"%)";
    },
    // A common interface for the above functions;
    // because I like overriding toString() and using parameters. Sue me.
    toString: function (format) {
        format = !isNull(format) ? format.toLowerCase() : "rgba";
        switch (format) {
            case "hex": return this.toHex();
            case "rgb": return this.toRGB();
            case "hsv": return this.toHSV();
            default: return this.toRGBA();
        }
    },
    valueOf: function () {
        return this.toNumber();
    },
    copy: function () {
        return new Colour(this.r, this.g, this.b, this.a);
    }

};
Colour.fromHSV = function (h, s, v) {
    Colour.call(this);
    this.setHSV(h, s, v);
};
Colour.fromHSV.prototype = Object.create(Colour.prototype);
// Directly from the W3C's list of colour names:
// http://www.w3.org/TR/css3-color/#svg-color
var Colours = {
    aliceblue           : new Colour(240, 248, 255),
    antiquewhite        : new Colour(250, 235, 215),
    aqua                : new Colour(  0, 255, 255),
    aquamarine          : new Colour(127, 255, 212),
    azure               : new Colour(240, 255, 255),
    beige               : new Colour(245, 245, 220),
    bisque              : new Colour(255, 228, 196),
    black               : new Colour(  0,   0,   0),
    blanchedalmond      : new Colour(255, 235, 205),
    blue                : new Colour(  0,   0, 255),
    blueviolet          : new Colour(138,  43, 226),
    brown               : new Colour(165,  42,  42),
    burlywood           : new Colour(222, 184, 135),
    cadetblue           : new Colour( 95, 158, 160),
    chartreuse          : new Colour(127, 255,   0),
    chocolate           : new Colour(210, 105,  30),
    coral               : new Colour(255, 127,  80),
    cornflowerblue      : new Colour(100, 149, 237),
    cornsilk            : new Colour(255, 248, 220),
    crimson             : new Colour(220,  20,  60),
    cyan                : new Colour(  0, 255, 255),
    darkblue            : new Colour(  0,   0, 139),
    darkcyan            : new Colour(  0, 139, 139),
    darkgoldenrod       : new Colour(184, 134,  11),
    darkgray            : new Colour(169, 169, 169),
    darkgreen           : new Colour(  0, 100,   0),
    darkgrey            : new Colour(169, 169, 169),
    darkkhaki           : new Colour(189, 183, 107),
    darkmagenta         : new Colour(139,   0, 139),
    darkolivegreen      : new Colour( 85, 107,  47),
    darkorange          : new Colour(255, 140,   0),
    darkorchid          : new Colour(153,  50, 204),
    darkred             : new Colour(139,   0,   0),
    darksalmon          : new Colour(233, 150, 122),
    darkseagreen        : new Colour(143, 188, 143),
    darkslateblue       : new Colour( 72,  61, 139),
    darkslategray       : new Colour( 47,  79,  79),
    darkslategrey       : new Colour( 47,  79,  79),
    darkturquoise       : new Colour(  0, 206, 209),
    darkviolet          : new Colour(148,   0, 211),
    deeppink            : new Colour(255,  20, 147),
    deepskyblue         : new Colour(  0, 191, 255),
    dimgray             : new Colour(105, 105, 105),
    dimgrey             : new Colour(105, 105, 105),
    dodgerblue          : new Colour( 30, 144, 255),
    firebrick           : new Colour(178,  34,  34),
    floralwhite         : new Colour(255, 250, 240),
    forestgreen         : new Colour( 34, 139,  34),
    fuchsia             : new Colour(255,   0, 255),
    gainsboro           : new Colour(220, 220, 220),
    ghostwhite          : new Colour(248, 248, 255),
    gold                : new Colour(255, 215,   0),
    goldenrod           : new Colour(218, 165,  32),
    gray                : new Colour(128, 128, 128),
    green               : new Colour(  0, 128,   0),
    greenyellow         : new Colour(173, 255,  47),
    grey                : new Colour(128, 128, 128),
    honeydew            : new Colour(240, 255, 240),
    hotpink             : new Colour(255, 105, 180),
    indianred           : new Colour(205,  92,  92),
    indigo              : new Colour( 75,   0, 130),
    ivory               : new Colour(255, 255, 240),
    khaki               : new Colour(240, 230, 140),
    lavender            : new Colour(230, 230, 250),
    lavenderblush       : new Colour(255, 240, 245),
    lawngreen           : new Colour(124, 252,   0),
    lemonchiffon        : new Colour(255, 250, 205),
    lightblue           : new Colour(173, 216, 230),
    lightcoral          : new Colour(240, 128, 128),
    lightcyan           : new Colour(224, 255, 255),
    lightgoldenrodyellow: new Colour(250, 250, 210),
    lightgray           : new Colour(211, 211, 211),
    lightgreen          : new Colour(144, 238, 144),
    lightgrey           : new Colour(211, 211, 211),
    lightpink           : new Colour(255, 182, 193),
    lightsalmon         : new Colour(255, 160, 122),
    lightseagreen       : new Colour( 32, 178, 170),
    lightskyblue        : new Colour(135, 206, 250),
    lightslategray      : new Colour(119, 136, 153),
    lightslategrey      : new Colour(119, 136, 153),
    lightsteelblue      : new Colour(176, 196, 222),
    lightyellow         : new Colour(255, 255, 224),
    lime                : new Colour(  0, 255,   0),
    limegreen           : new Colour( 50, 205,  50),
    linen               : new Colour(250, 240, 230),
    magenta             : new Colour(255,   0, 255),
    maroon              : new Colour(128,   0,   0),
    mediumaquamarine    : new Colour(102, 205, 170),
    mediumblue          : new Colour(  0,   0, 205),
    mediumorchid        : new Colour(186,  85, 211),
    mediumpurple        : new Colour(147, 112, 219),
    mediumseagreen      : new Colour( 60, 179, 113),
    mediumslateblue     : new Colour(123, 104, 238),
    mediumspringgreen   : new Colour(  0, 250, 154),
    mediumturquoise     : new Colour( 72, 209, 204),
    mediumvioletred     : new Colour(199,  21, 133),
    midnightblue        : new Colour( 25,  25, 112),
    mintcream           : new Colour(245, 255, 250),
    mistyrose           : new Colour(255, 228, 225),
    moccasin            : new Colour(255, 228, 181),
    navajowhite         : new Colour(255, 222, 173),
    navy                : new Colour(  0,   0, 128),
    oldlace             : new Colour(253, 245, 230),
    olive               : new Colour(128, 128,   0),
    olivedrab           : new Colour(107, 142,  35),
    orange              : new Colour(255, 165,   0),
    orangered           : new Colour(255,  69,   0),
    orchid              : new Colour(218, 112, 214),
    palegoldenrod       : new Colour(238, 232, 170),
    palegreen           : new Colour(152, 251, 152),
    paleturquoise       : new Colour(175, 238, 238),
    palevioletred       : new Colour(219, 112, 147),
    papayawhip          : new Colour(255, 239, 213),
    peachpuff           : new Colour(255, 218, 185),
    peru                : new Colour(205, 133,  63),
    pink                : new Colour(255, 192, 203),
    plum                : new Colour(221, 160, 221),
    powderblue          : new Colour(176, 224, 230),
    purple              : new Colour(128,   0, 128),
    red                 : new Colour(255,   0,   0),
    rosybrown           : new Colour(188, 143, 143),
    royalblue           : new Colour( 65, 105, 225),
    saddlebrown         : new Colour(139,  69,  19),
    salmon              : new Colour(250, 128, 114),
    sandybrown          : new Colour(244, 164,  96),
    seagreen            : new Colour( 46, 139,  87),
    seashell            : new Colour(255, 245, 238),
    sienna              : new Colour(160,  82,  45),
    silver              : new Colour(192, 192, 192),
    skyblue             : new Colour(135, 206, 235),
    slateblue           : new Colour(106,  90, 205),
    slategray           : new Colour(112, 128, 144),
    slategrey           : new Colour(112, 128, 144),
    snow                : new Colour(255, 250, 250),
    springgreen         : new Colour(  0, 255, 127),
    steelblue           : new Colour( 70, 130, 180),
    tan                 : new Colour(210, 180, 140),
    teal                : new Colour(  0, 128, 128),
    thistle             : new Colour(216, 191, 216),
    tomato              : new Colour(255,  99,  71),
    turquoise           : new Colour( 64, 224, 208),
    violet              : new Colour(238, 130, 238),
    wheat               : new Colour(245, 222, 179),
    white               : new Colour(255, 255, 255),
    whitesmoke          : new Colour(245, 245, 245),
    yellow              : new Colour(255, 255,   0),
    yellowgreen         : new Colour(154, 205,  50)
};

// not mine: repurposed from the ActionScript functions in http://gizma.com/easing/. Thanks to Robert Penner.
var TimingFunctions = {
    linear: function (t, d) { return t / d; },
    quadratic: {
        "in": function (t, d) { t /= d; return t * t; },
        "out": function (t, d) { t /= d; return -t * (t - 2); },
        "both": function (t, d) { t /= (d/2); if (t < 1) return (t * t)/2; t--; return -(t * (t - 2) - 1)/2; }
    },
    cubic: {
        "in": function (t, d) { t /= d; return t*t*t; },
        "out": function (t, d) { t /= d; t--; return t*t*t + 1; },
        "both": function (t, d) { t /= d/2; if (t < 1) return (t*t*t)/2; t -= 2; return (t*t*t + 2)/2; }
    },
    quartic: {
        "in": function (t, d) { t /= d; return t*t*t*t; },
        "out": function (t, d) { t /= d; t--; return -(t*t*t*t - 1); },
        "both": function (t, d) { t /= d/2; if (t < 1) return (t*t*t*t)/2; t -= 2; return -(t*t*t*t - 2)/2; }
    },
    quintic: {
        "in": function (t, d) { t /= d; return t*t*t*t*t; },
        "out": function (t, d) { t /= d; t--; return t*t*t*t*t + 1; },
        "both": function (t, d) { t /= d/2; if (t < 1) return (t*t*t*t*t)/2; t -= 2; return (t*t*t*t*t + 2)/2; }
    },
    sinusoidal: {
        "in": function (t, d) { return -(Math.cos(t/d * (Math.PI/2)) - 1); },
        "out": function (t, d) { return Math.sin(t/d * (Math.PI/2)); },
        "both": function (t, d) { return -(Math.cos(Math.PI*t/d) - 1)/2; }
    },
    exponential: {
        "in": function (t, d) { return Math.pow(2, 10 * (t/d - 1)); },
        "out": function (t, d) { return -Math.pow(2, -10 * t/d) + 1; },
        "both": function (t, d) { t /= d/2; if (t < 1) return Math.pow(2, 10*(t-1))/2; t--; return (-Math.pow(2, -10 * t) + 2)/2;  }
    }
};

// Defines a transition between a start and end value that takes ms milliseconds
// and uses func as a timing function (from the list above, or of a custom creation).
// manual animation #thewayilikeit
function Tween(start, end, ms, func) {
    this.start = start;
    this.end = end;
    this.duration = ms;
    this.startTime = -1;
    this.timingFunction = func || TimingFunctions.linear;

    // fun fact: I used this.start() before, not knowing that it was already defined as a property
    // a few lines above
    // This begins the animation at the specified time (or at time of execution).
    this.beginAnimation = function (time) { this.startTime = time || new Date().getTime(); };

    // A function for returning the value that can be overridden by classes that inherit Tween.
    // e.g. redefining this to return a vector value for animating position
    Object.defineProperty(this, "getValue", {
        value: function () {
            return ((this.end-this.start) * this.progress) + this.start;
        },
        writable: false,
        configurable: true
    });

    // pseudo-properties
    // This one represents the current progress from start to end as a float [0-1].
    // Used in returning a value and also useful for determining when to stop the animation.
    Object.defineProperty(this, "progress", {
        // all timing functions take the elapsed time t and the duration of the animation d.
        get: function () { return this.timingFunction(Math.bound(this.elapsedTime, 0, this.duration), this.duration); }
    });
    // Pseudo-property for the above getValue(), just because using methods looks wrong
    Object.defineProperty(this, "value", {
        get: function () { return this.getValue(); }
    });
    // A boolean returning whether or not the animation has run its course.
    // Defined either when the progress breaks the 100% barrier, or when the elapsed time
    // exceeds the duration.
    Object.defineProperty(this, "completed", {
        get: function () { return this.progress >= 1 || this.elapsedTime > this.duration; }
    });
    // Returns the number of milliseconds from when the animation first began.
    // If it hasn't begun yet, then it will launch the animation.
    Object.defineProperty(this, "elapsedTime", {
        get: function () {
            var currTime = new Date().getTime();
            if (this.startTime == -1) this.beginAnimation(currTime);
            return currTime - this.startTime;
        }
    });
}

// Defines a transition between two points in 2D space. Takes start and
// end as Vector2Ds, and ms as the duration in milliseconds.
// Can also take a timing function func, either from the list
// defined in TimingFunctions or one of specialised design.
Tween.Vector = function (start, end, ms, func) {
    // Inherit from Tween.
    Tween.call(this, start, end, ms, func);

    // Override the getValue() method to return a vector value.
    // Assumes that start and end are vectors.
    Object.defineProperty(this, "getValue", {
        value: function () {
            var coordX = ((this.end.x - this.start.x) * this.progress) + this.start.x;
            var coordY = ((this.end.y - this.start.y) * this.progress) + this.start.y;
            return new Vector2D(coordX, coordY);
        },
        writable: false,
        configurable: true
    });
};
// This isn't *strictly* required, but I like to do it anyway.
Tween.Vector.prototype = Object.create(Tween.prototype);

// Defines a transition between two colours. Takes start and end
// as Colour values, ms as the duration of the animation in milliseconds
// and func as a timing function, either from TimingFunctions or a custom one.
Tween.Colour = function (start, end, ms, func) {
    // Inherit from Tween.
    Tween.call(this, start, end, ms, func);

    // Override the getValue() method to return a Colour value.
    // Assumes that start and end are Colour values.
    Object.defineProperty(this, "getValue", {
        value: function () {
            var red = ((this.end.r-this.start.r) * this.progress) + this.start.r;
            var green = ((this.end.g-this.start.g) * this.progress) + this.start.g;
            var blue = ((this.end.b-this.start.b) * this.progress) + this.start.b;
            var alpha = ((this.end.a-this.start.a) * this.progress) + this.start.a;
            return new Colour(Math.floor(red), Math.floor(green), Math.floor(blue), alpha);
        },
        writable: false,
        configurable: true
    })
};
Tween.Colour.prototype = Object.create(Tween.prototype);

// This creates a helper object that can batch execute common CanvasRenderingContext2D
// tasks, such as drawing a line plot or 2D text.
function CvsHelper(context) {
    this.$ = context;

    var self = this;
    Object.defineProperty(this, "width", {
        get: function () { return self.$.canvas.width; },
        set: function (val) { self.$.canvas.width = parseInt(val); }
    });
    Object.defineProperty(this, "height", {
        get: function () { return self.$.canvas.height; },
        set: function (val) { self.$.canvas.height = parseInt(val); }
    });
}
CvsHelper.prototype = {
    constructor: CvsHelper,
    // Alias to quickly clear entire canvas.
    // Doesn't take into account $.(translate|rotate|scale).
    clear: function () {
        this.$.clearRect(0, 0, this.width, this.height);
    },
    // Converts a non-vector value (such as a deprecated Coords() or a two-length array)
    // to a vector value.
    convertToVector: function (point) {
        if (point instanceof Vector2D) return point;
        else if (!isNull(point.x) && !isNull(point.y)) return new Vector2D(point.x, point.y);
        else if (!isNull(point[0]) && !isNull(point[1])) return new Vector2D(point[0], point[1]);
        else return new Vector2D(0, 0);
    },
    // Does the same as above, but in batch for an array of points (either array or Coords)
    convertToVectorList: function (points) {
        for (var i=0,a=[];i<points.length;i++) a.push(this.convertToVector(points[i]));
        return a;
    },
    // Corrects a coordinate on a canvas to a properly signed value for drawing on a Canvas2D.
    // Also works in the opposite direction: can correct a canvas coordinate in retrieving a logical coordinate.
    correctCoordinate: function (coord) {
        return new Vector2D(coord.x, -coord.y);
    },
    // Makes sure that the coordinate is located inside of the canvas borders.
    bound: function (coord) {
        return coord.clamp(Vector2D.zero, new Vector2D(this.width, this.height));
    },
    // Returns whether or not the specified coordinate is inside of the canvas borders.
    isBounded: function (coord) {
        return this.bound(coord).equals(coord);
    },
    // Returns a Vector2D representing the canvas location of the given logical plane coordinate.
    // extents: The width and height of the logical plane subsection inside of the canvas.
    // pan: The centre of the logical plane subsection inside of the canvas.
    getLocationOfCoordinate: function (coord, extents, pan) {
        var factor = new Vector2D(this.width, this.height).divide(extents);
        return factor.multiply(extents.divide(2).subtract(this.correctCoordinate(pan)).add(this.correctCoordinate(coord)));
    },
    // Returns a Vector2D representing the logical plane coordinate from the given canvas location.
    // extents: The width and height of the logical plane subsection inside of the canvas.
    // pan: The centre of the logical plane subsection inside of the canvas.
    getCoordinateFromLocation: function (location, extents, pan) {
        var factor = new Vector2D(this.width, this.height).divide(extents);
        var coord = location.divide(factor).add(this.correctCoordinate(pan)).subtract(extents.divide(2));
        return this.correctCoordinate(coord);
    },
    // Draws an array of points on the canvas as a line plot.
    // The 'fuzz' refers to the glow (rather, shadow) behind a drawn line.
    // It is not required.
    linePlot: function (points, width, style, fuzz, fuzzColour) {
        points = this.convertToVectorList(points);
        if (points.length == 0) return;
        this.$.save();
        this.$.beginPath();
        if (!isNull(width)) this.$.lineWidth = width;
        if (!isNull(style)) this.$.strokeStyle = style;
        if (!isNull(fuzz)) {
            if (!isNull(fuzzColour)) this.$.shadowColor = fuzzColour;
            else this.$.shadowColor = this.$.strokeStyle;
            this.$.shadowBlur = fuzz;
        } else this.$.shadowBlur = 0;
        this.$.moveTo(points[0].x, points[0].y);
        for (var i=1;i<points.length;i++)
            this.$.lineTo(points[i].x, points[i].y);
        this.$.stroke();
        this.$.closePath();
        this.$.restore();
    },
    genericDotPlot: function (points, drawFunc, style, strokeStyle) {
        points = this.convertToVectorList(points);
        if (points.length == 0) return;
        this.$.save();
        if (!isNull(style)) this.$.fillStyle = style;
        if (!isNull(strokeStyle)) this.$.strokeStyle = strokeStyle;
        for (var i=0;i<points.length;i++) {
            this.$.save();
            this.$.translate(points[i].x, points[i].y);
            this.$.beginPath();
            drawFunc(this.$, points[i]);
            this.$.closePath();
            this.$.restore();
        }
        this.$.restore();
    },
    crossPlot: function (points, length, width, style) {
        if (isNull(length)) length = 12;
        if (isNull(width)) width = 2;
        this.genericDotPlot(points, function (l, w) {
            return function ($, point) {
                $.rotate(dtr(45));
                $.moveTo(-l/2, 0);
                $.lineTo(l/2, 0);
                $.moveTo(0, -l/2);
                $.lineTo(0, l/2);
                $.stroke();
            }
        }(length, width), null, style);
    },
    // Draws an array of points representing a polygon on the screen.
    polygon: function (points, style, borderWidth, borderStyle) {
        points = this.convertToVectorList(points);
        this.$.save();
        this.$.beginPath();
        if (!isNull(style)) this.$.fillStyle = style;
        this.$.moveTo(points[0].x, points[0].y);
        for (var i=1;i<points.length;i++)
            this.$.lineTo(points[i].x, points[i].y);
        this.$.lineTo(points[0].x, points[0].y);
        if (!isNull(style)) this.$.fill();
        if (!isNull(borderWidth) || !isNull(borderStyle)) {
            if (!isNull(borderWidth)) this.$.lineWidth = borderWidth;
            if (!isNull(borderStyle)) this.$.strokeStyle = borderStyle;
            this.$.stroke();
        }
        this.$.closePath();
        this.$.restore();
    },
    // Draws a circle centred at the specified position.
    circle: function (centre, radius, style, borderWidth, borderStyle) {
        centre = this.convertToVector(centre);
        this.$.save();
        this.$.beginPath();
        if (!isNull(style)) this.$.fillStyle = style;
        this.$.arc(centre.x, centre.y, radius, 0, dtr(360), false);
        if (!isNull(style)) this.$.fill();
        if (!isNull(borderWidth) || !isNull(borderStyle)) {
            if (!isNull(borderWidth)) this.$.lineWidth = borderWidth;
            if (!isNull(borderStyle)) this.$.strokeStyle = borderStyle;
            this.$.stroke();
        }
        this.$.closePath();
        this.$.restore();
    },
    // Writes text to the screen.
    // pos: the position of the text on the canvas. (e.g. (150, 300))
    // font: the font used to render the text (e.g. "Franklin Gothic Medium 20")
    // style: the colour used to fill in the text (e.g. "#555555")
    // align: text alignment (left, center, right)
    // baseline: where to place the baseline in relation to the position (e.g. "hanging")
    // width: the width of the container used to draw the text. The text will be squished to fit.
    write: function (text, pos, font, style, align, baseline, width) {
        pos = this.convertToVector(pos);
        this.$.save();
        if (!isNull(font)) this.$.font = font;
        if (!isNull(style)) this.$.fillStyle = style;
        if (!isNull(align)) this.$.textAlign = align;
        if (!isNull(baseline)) this.$.textBaseline = baseline;
        this.$.beginPath();
        if (isNull(width)) this.$.fillText(text, pos.x, pos.y);
        else this.$.fillText(text, pos.x, pos.y, width);
        this.$.closePath();
        this.$.restore();
    }
};

/**
 * Similar to CvsHelper, provides an interface for common or otherwise labourious tasks,
 * such as clearing SVG node of all elements, or plotting coordinates as a line plot.
 * This implementation may be more convenient, as it relies on CSS by using class names
 * and grouping instead of JS properties to style the objects. It also means that
 * certain elements can be removed instead of having to clear the canvas and start all
 * over again.
 * @param root The SVG node through which all new elements will get appended to. Does not have to be a root node.
 * @constructor
 */
function SVGHelper(root) {
    this.root = root;

    var self = this;
    Object.defineProperty(this, "svg", {
        get: function () {
            if (self.root.ownerSVGElement != null) return self.root.ownerSVGElement;
            else return self.root;
        }
    });
    Object.defineProperty(this, "width", {
        get: function () { return parseInt(self.svg.getAttribute("width")); },
        set: function (val) { self.svg.setAttribute("width", val.toString() + "px"); }
    });
    Object.defineProperty(this, "height", {
        get: function () { return parseInt(self.svg.getAttribute("height")); },
        set: function (val) { self.svg.setAttribute("height", val.toString() + "px"); }
    });
}

/**
 * Helper builder that allows for easily creating SVG paths through a semantic interface.
 * @param helper {SVGHelper} Used to append paths to an SVG document.
 * @constructor
 */
function SVGPathBuilder(helper) {
    this.helper = helper;
    this.path = "";
}
SVGPathBuilder.prototype = {
    constructor: SVGPathBuilder,
    activePath: false,
    command: function (op) {
        this.path += op + " ";
        for (var i=1;i<arguments.length;i++)
            this.path += arguments[i].toString() + " ";

        this.activePath = true;
    },
    move: function (coord, relative) {
        this.command(relative ? "m" : "M", coord.x, coord.y);
        return this;
    },
    line: function (coord, relative) {
        this.command(relative ? "l" : "L", coord.x, coord.y);
        return this;
    },
    append: function (coord) {
        if (!this.activePath)
            this.move(coord, false);
        else this.line(coord, false);
        return this;
    },
    close: function (polygon) {
        if (this.activePath && polygon)
            this.command("Z");
        this.activePath = false;
        return this;
    },
    apply: function (className, groupName) {
        var result = this.helper.path(this.path, className, groupName);
        this.path = "";
        return result;
    }
};

/**
 * Helper builder that allows for easily drawing the same path multiple times in
 * different locations.
 * @param {SVGHelper} helper
 * @param {Function} pathBuilder A function that takes a {@link SVGPathBuilder} and a coordinate as an
 * argument and returns the {@link SVGPathBuilder} configured to draw a common path using relative coordinates.
 * @param {Function} [config] Called after a path is created, allows for visual changes, etc.
 * @param {String} [className] The class name that each individual path will possess.
 * @param {String} [groupName] The optional group that the paths will be appended to.
 * @constructor
 */
function SVGPathCollectionBuilder(helper, pathBuilder, config, className, groupName) {
    this.helper = helper;
    this.buildPath = pathBuilder;
    this.builder = new SVGPathBuilder(helper);
    this.config = config || function () {};

    this.className = className;
    this.groupName = groupName;
}
SVGPathCollectionBuilder.prototype = {
    constructor: SVGPathCollectionBuilder,
    append: function (coord) {
        this.buildPath(this.builder, coord);
        this.config(this.builder.apply(this.className, this.groupName));
        return this;
    }
};

(function (l) {

    SVGHelper.prototype = {
        constructor: SVGHelper,
        _ns: "http://www.w3.org/2000/svg",

        groups: {},

        append: function (el, className, groupName) {
            if (!isNull(className)) el.setAttribute("class", className);
            if (!isNull(groupName)) this.getGroup(groupName).appendChild(el);
            else this.root.appendChild(el);

            return el;
        },

        clear: function () {
            var i;
            var children = [];
            for (i=0;i<this.root.childNodes.length;i++) children.push(this.root.childNodes[i]);

            for (i=0;i<children.length;i++)
                children[i].remove();

            this.groups = {};
        },
        appendGroup: function (groupName, parent) {
            if (isNull(parent)) parent = this.root;
            else if (typeof parent == typeof "") parent = this.getGroup(parent);

            if (this.groups[groupName] == undefined) return;

            var g = this.groups[groupName];
            var groups = parent.getElementsByTagName("g");
            for (var i=0;i<groups.length;i++)
                if (groups[i] == g) return;

            parent.appendChild(g);
        },
        getGroup: function (groupName, parent) {
            if (isNull(parent)) parent = this.root;
            if (isNull(groupName)) return parent;
            var groups = parent.getElementsByTagName("g");
            if (this.groups[groupName] != undefined) return this.groups[groupName];
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].getAttribute("class") == groupName) {
                    this.groups[groupName] = groups[i];
                    return groups[i];
                }
            }


            var g = document.createElementNS(this._ns, "g");
            g.setAttribute("class", groupName);
            //parent.appendChild(g);

            this.groups[groupName] = g;

            return g;
        },
        linePlot: function (points, className, groupName, tagName) {
            if (isNull(tagName)) tagName = "polyline";
            points = this.convertToVectorList(points);
            if (points.length == 0) return;
            var p = points.map(function (v) {
                return v.x + "," + v.y;
            }).join(" ");

            var el = document.createElementNS(this._ns, tagName);
            el.setAttribute("points", p);

            this.append(el, className, groupName);

            return el;
        },
        path: function (pathstr, className, groupName) {
            var el = document.createElementNS(this._ns, "path");
            el.setAttribute("d", pathstr);

            this.append(el, className, groupName);

            return el;
        },
        polygon: function (points, className, groupName) {
            return this.linePlot(points, className, groupName, "polygon");
        },
        write: function (text, position, className, groupName, tagName) {
            if (isNull(tagName)) tagName = "text";

            var el = document.createElementNS(this._ns, tagName);
            el.setAttribute("x", position.x.toString());
            el.setAttribute("y", position.y.toString());
            el.textContent = text;

            this.append(el, className, groupName);

            return el;
        }

    };

    for (var i=0;i<l.length;i++)
        SVGHelper.prototype[l[i]] = CvsHelper.prototype[l[i]];

})(["convertToVector",
    "convertToVectorList",
    "correctCoordinate",
    "bound",
    "isBounded",
    "getLocationOfCoordinate",
    "getCoordinateFromLocation"
]);

/**
 * A class for canvas interfaces that handle common utilities such as frame management, resizing,
 * reacting to window size changes and UI bindings.
 * @param cvs A HTMLCanvasElement where the context will come from.
 * @param expandElement An optional element that the canvas will fill the entirety of.
 * @constructor
 */
function WideCanvas(cvs, expandElement) {
    this.canvas = cvs;
    this.$ = cvs.getContext("2d");
    if (isNull(this.$)) {
        TBI.error("Canvas initialisation failed.");
        return;
    }

    this.helper = new CvsHelper(this.$);
    if (expandElement instanceof Node)
        this.expandElement = expandElement;
    else if (expandElement)
        this.expandElement = document.body;
    else this.expandElement = null;

    this._loop();
}
WideCanvas.prototype = {
    constructor: WideCanvas,
    paused: false,
    lastFrame: -1,
    _loop: function () {
        var self = this;
        requestAnimationFrame(function () {
            self._loop();
        });

        var currTime = new Date().getTime();
        if (!this.paused) {
            if (this.lastFrame == -1) this.lastFrame = currTime;
            var delta = (currTime - this.lastFrame) / 1000;
            this.loop(delta);
        } else {

        }

        if (this.expandElement != null) {
            var dims = [
                parseInt(this.expandElement.getStyle("width")),
                parseInt(this.expandElement.getStyle("height"))
            ];
            if (dims[0] != this.helper.width)
                this.helper.width = dims[0];
            if (dims[1] != this.helper.height)
                this.helper.height = dims[1];
        }
        this.lastFrame = currTime;
    },
    loop: function () {},

    bindings: [],
    bind: function (element, event, property, onEvent) {
        if (element instanceof Array || element instanceof jQuery.fn.init) {
            for (var i=0;i<element.length;i++)
                this.bind(element[i], event, property, onEvent);
            return;
        }

        if (!(onEvent instanceof Function)) onEvent = function () {};
        var cvs = this;

        var initialVal;
        if (property instanceof Function) initialVal = property(cvs, null, element);
        else initialVal = Object.getProperty(cvs, property);

        var isNum = typeof initialVal == typeof 1;

        $(element).val(initialVal);

        var binding = {
            element: element,
            event: event,
            property: property,
            isNumber: isNum
        };
        this.bindings.push(binding);

        $(element).on(event, function (e) {
            if (property instanceof Function) property(cvs, isNum ? parseFloat(this.value) : this.value, this, e);
            else Object.setProperty(cvs, property, isNum ? parseFloat(this.value) : this.value);
            onEvent(e, this.value);
        });
    },
    updateBinding: function (binding) {
        var cvs = this, value;
        if (binding.property instanceof Function) value = binding.property(cvs, null, binding.element);
        else value = Object.getProperty(cvs, binding.property);
        $(binding.element).val(value);
    },
    updateBindings: function (property) {
        var cvs = this, filterFunc;
        if (isNull(property)) filterFunc = function () { return true; };
        else if (property instanceof Function) filterFunc = property;
        else filterFunc = function (e) { return e.property == property; };

        this.bindings.filter(filterFunc).forEach(function (e) { cvs.updateBinding(e); });
    },

    events: {},
    addEventHandler: function (evt, func) {
        if (this.events[evt] == undefined) this.events[evt] = {};
        var id = generateUUID();
        this.events[evt][id] = func;
        return id;
    },
    removeEventHandler: function (id) {
        for (var evt in this.events) if (this.events.hasOwnProperty(evt))
            if (this.events[evt][id] != undefined)
                delete this.events[evt][id];
    },
    triggerEvent: function (evt, pass) {
        var self = this;
        if (evt instanceof Array) return evt.forEach(function (e) {
            self.triggerEvent(e);
        });

        if (this.events[evt] == undefined) return;
        for (var id in this.events[evt]) if (this.events[evt].hasOwnProperty(id))
            this.events[evt][id](this, pass);
    }
};

/**
 * Implements the WideCanvas interface, but uses SVG for implementation.
 * Works with SVGHelper to provide common display utilities, such as
 * handling window size changes and UI bindings, frame management and
 * pausing.
 * @param svg The SVG element that is element passed to SVGHelper as the root node.
 * @param expandElement An optional element that the SVG document will fill the entirety of.
 * @constructor
 */
function WideSVG(svg, expandElement) {
    this.svg = svg;
    this.helper = new SVGHelper(svg);

    if (expandElement instanceof Node)
        this.expandElement = expandElement;
    else if (expandElement)
        this.expandElement = document.body;
    else this.expandElement = null;

    this._loop();

    var self = this;
    Object.defineProperty(this, "width", {
        get: function () { return self.helper.width; },
        set: function (val) { self.helper.width = val; }
    });
    Object.defineProperty(this, "height", {
        get: function () { return self.helper.height; },
        set: function (val) { self.helper.height = val; }
    });
}
WideSVG.prototype = Object.create(WideCanvas.prototype);
WideSVG.prototype.constructor = WideSVG;
