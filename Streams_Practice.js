/Alan Castillo/
//SPECIFICATIONS//
// All functions use memoized streams. All input streams are nonempty, and may be finite or infinite.

// type Memo<T> = { get: () => T, toString() => string }
// memo0<T>(f: () => T): Memo<T>
function memo0(f) {
  let r = { evaluated: false };
  return { get: function() {
            if (! r.evaluated) {
              r = { evaluated: true, v: f() }
            }
            return r.v;
           },
           toString: function() {
            return r.evaluated ? r.v.toString() : "<unevaluated>";
           } 
  };
}

// type Memo<T> = { get: () => T }
// memo1<S, T>(f: (x: S) => T, x: S): Memo<T>
function memo1(f, x) {
  let r = { evaluated: false };
  return {
    get: function() {
      if (! r.evaluated) {
        r = { evaluated: true, v: f(x) }
      }
    return r.v;
    }
  };
}

// sempty: Stream<T>
let sempty = { isEmpty: () => true, toString: () => "sempty", map: f => sempty, filter: f => sempty};

// snode<T>(head: T, tail: Memo<Stream<T>>): Stream<T>
let counter = -1;
function snode(head, tail) {
  return { isEmpty: () => false, 
           head: () => head, 
           tail: tail.get, 
           toString: () => head.toString() + "x^" + (++counter).toString() + " + " + tail.toString(),
           map: f => snode(f(head), memo0(() => tail.map(f))),
           filter: f => f(head) ? 
              snode(head, memo0(() => tail.filter(f))) 
              : tail.filter(f)
          };
}

/Let the coefficient stream be the same as snode/
let s1 = snode(1, memo0(() => snode(2, memo0(() => snode(3, memo0(() => sempty))))));
//s1.tail().tail().tail();

let s2 = snode(2, memo0(() => snode(6, memo0(() => snode(9, memo0(() => sempty))))));
//s2.tail().tail().tail();

//addSeries(strm1: Stream<T>, strm2: Stream<T>): Stream<T>
function addSeries(strm1, strm2) {
  if (strm1.isEmpty() && strm2.isEmpty()) {
    return sempty;
  } else if (strm1.isEmpty()) {
    return strm2;
  } else if (strm2.isEmpty()) {
    return strm1;
  }
  return snode(strm1.head() + strm2.head(), memo0(() => addSeries(strm1.tail(), strm2.tail())));
}
//let c = addSeries(s1, s2);


//multSeries(s: Stream<T>, n: number): Stream<T>
function multSeries(s, n) {
  if (s.isEmpty()) {
    return sempty;
  }
  return snode(s.head() * n, memo0(() => multSeries(s.tail(), n)));
}
function prodSeries(s, t) {
  // S(x) * T(x) = a0*b0 + x(a0*t1(x) + b0+s1(x) + xs1(x)t1(x))
  if (s.isEmpty() || t.isEmpty()) {
    return snode(0, memo0(() => sempty));
  }
  let centerSeries = addSeries(multSeries(s.tail(), t.head()), multSeries(t.tail(), s.head()))
  return snode(s.head()*t.head(), memo0(() => addSeries(centerSeries, snode(0, memo0(() => prodSeries(s.tail(), t.tail()))))));
}
//let c = prodSeries(s1, s2);

//derivSeries(s: Stream<T>): Stream<T>
let derivCounter = -1;
function derivSeries(s) {
  if (s.isEmpty()) {
    derivCounter = -1;
    return sempty;
  } else if (derivCounter === -1) {
    ++derivCounter;
    return derivSeries(s.tail());
  }
  return snode(s.head() * (++derivCounter), memo0(() => derivSeries(s.tail())));
}
//let c = derivSeries(s1);

//coeff(s: Stream<T>, n: number): <T>[]
function coeff(s, n) {
  let result = [];
  while (n !== -1 && !s.isEmpty()) {
    result.push(s.head());
    s = s.tail();
    --n;
  }
  return result;  
}
//let c = coeff(s1,6);

//evalSeries(s: Stream<T>, n: number): x: number => number
function evalSeries(s, n) {
  return function(x) {
    let sum = 0;
    let counter = -1;
    while (!s.isEmpty() && n !== -1) {
      sum += s.head() * Math.pow(x, ++counter);
      s = s.tail();
      --n;
    }
    return sum;
  }
}
//let c = evalSeries(s1,3);

//rec1Series(f: T => T , v: T): Stream<T>
function rec1Series(f, v) {
  return snode(v, memo0(() => rec1Series(f, f(v))));
}
//let c = rec1Series(x => x+2, 1);

//expSeries(): Stream<T>
let tayCounter = -1;
function expSeries() {
  return snode(1/factorialize(++tayCounter), memo0(() => expSeries()));
}
//let c = expSeries();

//factorialize(num: number): number
function factorialize(num) {
  if (num < 0) {
    return -1;
  } else if (num === 0) {
      return 1;
  } else {
      return (num * factorialize(num - 1));
  }
}

//recurSeries(coef: numer[], init: number[]): Stream<T>

let arrIndex = -1;
function arrToStrm(a) {

  if (++arrIndex === a.length) {
    arrIndex = 0;
    return sempty;
  }
  return snode(a[arrIndex], memo0(() => arrToStrm(a)));
}

function recurrence(c, a) {
  if(c.length === 0 || a.length === 0) {
    return sempty;
  }
  let i = -1;
  let sum = c.reduce((acc, coef) => acc + (coef * a[++i]), 0);
  a.push(sum);
  a.shift();
  return snode(sum, memo0(() => recurrence(c, a)));
}

function sappend(left, right) {
  if (left.isEmpty()) {
    return right;
  } else {
    return snode(left.head(), memo0(() =>
    sappend(left.tail(), right)));
  }
}

function recurSeries(coef, init) { 
  if (coef.length === 0 || init.length === 0) {
    return sempty;
  }
  let temp = init.slice(0, init.length);
  return sappend(arrToStrm(temp), recurrence(coef, init));
}

//let init = [];
//let coef = [];
//let c = recurSeries(coef, init);
//let c = arrToStrm(a);