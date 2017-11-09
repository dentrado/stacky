let drawingfn = null;
let time = 0;
let dictionary = {
  // Math
  "+": (s) => { s.push(s.pop() + s.pop()) },
  "*": (s) => { s.push(s.pop() * s.pop()) },
  "mod": (s) => { let v = s.pop(); s.push(s.pop() % v) },
  "sin": (s) => { s.push(Math.sin(s.pop())) },
  "cos": (s) => { s.push(Math.cos(s.pop())) },
  "tan": (s) => { s.push(Math.tan(s.pop())) },
  "xor": (s) => { s.push(s.pop() ^ s.pop()) },
  // Stack shuffling
  "dup": (s) => { var v = s.pop(); s.push(v); s.push(v); },
  "drop": (s) => { s.pop(); },
  "swap": (s) => { var v = s.pop(), w = s.pop(); s.push(v); s.push(w); },
  "rot": (s) => { var v = s.pop(), w = s.pop(), x =s.pop(); s.push(w,v,x); },
  "?": (s) => { var f = s.pop(), t = s.pop(), test=s.pop(); s.push(test ? t : f); },
  "call": (s) => { s.pop()(s); },
  "dip": (s) => { var v = s.pop(), w = s.pop(); v(s); s.push(w); },
  // debug
  "dbg": (s) => { console.log(s.pop()); },
};
var specials = {
  ":": function(dict, specials, tokens, idx) {
    var end = matchingIndex(":", ";", tokens, idx);
    dict[tokens[idx+1]] = compile(dict, specials, tokens.slice(idx+2,end));
    return [undefined, end];
  },
  "[": function(dict, specials, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, idx);
    return [makeFun(dict, specials, tokens.slice(idx+1,end)), end];
  },
  "(": function(dict, specials, tokens, idx) {
    var end = matchingIndex("(", ")", tokens, idx);
    return [undefined, end];
  },
  parseNum: function(token) {
    const num = parseFloat(token);  
    return (s) => s.push(num);
  }
};

// Types
// TODO better error reporting

const Number = 'Number';
// const Bool = 'Bool';
const Bool = 'Number'; // FIXME temp hack until we have bools :P


function oneOf(types) {
  const set = new Set(types);
  if (set.size === 1) {
    return set.values().next().value; // return the only type
  }
  return set;
}

function pushOneOf(s, types) {
  console.log('pushing: ', types);
  s.push(oneOf(types));
}

function pushNum(s) {
  console.log('pushing: ', Number);  
  s.push(Number);
}

function assert(s, expectedType) {
  const type = s.pop();
  console.log('asserting', type, 'is', expectedType);
  console.assert(type === expectedType, 'Expected', expectedType, 'but found', type);    
}

function popNum(s) {
  assert(s,  Number);  
}

function binaryNumOp(s) { 
  popNum(s); popNum(s); pushNum(s);
}

function unaryNumOp(s) { 
  popNum(s); pushNum(s);
}

let typeDict = {
  // Math
  "+": binaryNumOp,
  "*": binaryNumOp,
  "mod": binaryNumOp,
  "sin": unaryNumOp,
  "cos": unaryNumOp,
  "tan": unaryNumOp,
  "xor": binaryNumOp,
  // Stack shuffling
  "dup": dictionary.dup,
  "drop": dictionary.drop,
  "swap": dictionary.swap,
  "rot": dictionary.rot,
  "?": (s) => {
    let fBranchType = s.pop(), tBranchType = s.pop(), testType = assert(s, Bool);
    pushOneOf(s, [fBranchType, tBranchType]);
  },
  "dip": function(s) { typeDict.swap(s); var v = s.pop(); typeDict.call(s); s.push(v); }, // same as def, but dict is typeDictionary
  "call": function(s) { 
    const func = s.pop();
    console.log('typechecking call of:', func, func instanceof Set);
    if(func instanceof Function) {
      func(s);
    } else if(func instanceof Set) {
      // return multiple times here?! (impl nondeterminism while at it :)
      // or just choose one of the funcions above and continue with that. 
      // and assert that all typestacks are the same for each function 

      const stacks = []
      let lastF;
      for(let f of func) {
        const newStack = [...s];    
        // const newDict = Object.create(dict); // maybe keep access to dict for fns?
        
        f(newStack); 
        stacks.push(newStack);
        lastF = f;
      }
      console.log('alternative universes: ', stacks);
      console.assert(
        stacks.every((s, _, arr) => arr[0].length === s.length && arr.every((t, i) => t === s[i])), 
        'All functions in union should have same stack effects'
      );
      lastF(s);

    } else {
      console.warn('Could not call, wrong type: ', func);
    }
  },
  
  // debug
  "dbg": dictionary.dbg,  
};
var typeSpecials = {
  ":": specials[':'],
  "[": specials['['],
  "(": specials['('], // todo check stack length before, after & verify match w comment
  parseNum: () => pushNum,  
};


function matchingIndex(left, right, tokens, startIdx) {
  var i = startIdx +  1, balance = 1;
  while(balance > 0 && i < tokens.length) { // todo: forloopify
    if(tokens[i] == left) balance++;
    else if(tokens[i] == right) balance--;
    i++;
  }
  return --i;
}

function makeFun(dict, specials, tokens) {
  const fun = compile(dict, specials, tokens);  
  return (s) => s.push(fun);
}

function compile(dict, specials, tokens) {
    let fns = [];
    for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if(specials[token]) {
            ret = specials[token](dict, specials, tokens, i);
            if(ret[0] !== undefined) {
                fns.push(ret[0]);
            }
            i = ret[1];
        } else {
            fns.push(dict[token] || specials.parseNum(token));
        }
    }
    return (s) => fns.forEach(fn => fn(s));
}

function i(stack, dict, specials, str){
  var js = compile(dict, specials, str.trim().split(/\s+/g));
  console.log(js);
  return js(stack);
}

//Drawing
function draw() {
  if(!drawingfn) return;

  var img = ctx.createImageData(canvas.width, canvas.height);
  time += 5 //= Date.now();//%512;
  var s = [];
  for(var y = 0; y < img.height; y++) {
    for(var x = 0; x < img.width; x++) {
      var index = (x + y * img.width) * 4;
      s.push(time, y, x);
      //var s = [time, y, x];
      drawingfn(s);
      var b = s.pop(), g = s.pop(), r = s.pop();
      img.data[index + 0] = r;   // r
      img.data[index + 1] = g;   // g
      img.data[index + 2] = b;   // b
      img.data[index + 3] = 255; // a
    }
  }
  ctx.putImageData(img, 0, 0);
}

function init() {
  dict = Object.create(dictionary);
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  code = document.getElementById("code");

  output = document.getElementById("output");
  // Shift + Enter to eval and draw
  window.addEventListener("keydown", function(e) {
    if(e.shiftKey && e.which == 13 && code.value) {
      var stack = [];
      var typeStack = [];
      let dict = Object.create(dictionary);
      let typeDict2 = Object.create(typeDict);
      i(typeStack, typeDict2, typeSpecials, code.value);
      // i(stack, dict, specials, code.value);
      drawingfn = dict.draw;
      console.log(stack, dict);
      console.log('typed:',  typeStack, typeDict2);
      draw();
      output.innerHTML = "" + stack;

      e.preventDefault(); // stop Enters newline
      return false;
    }
    return true;
  });
  // setInterval(draw, 200);
}

window.onload = init;
