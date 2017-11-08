var stack = [];
var typeStack = [];

// Builtin definitions
var dictionary = {
  // Math
  "+": function(s) { s.push(s.pop() + s.pop()); },
  "*": function(s) { s.push(s.pop() * s.pop()); },
  "mod": function(s) { var v = s.pop(); s.push(s.pop() % v); },
  "sin": function(s) { s.push(Math.sin(s.pop())); },
  "cos": function(s) { s.push(Math.cos(s.pop())); },
  "xor": function(s) { s.push(s.pop() ^ s.pop()); },
  // Stack shuffling
  "dup": function(s) { var v = s.pop(); s.push(v); s.push(v); },
  "drop": function(s) { s.pop(); },
  "swap": function(s) { var v = s.pop(), w = s.pop(); s.push(v); s.push(w); },
  "rot": function(s) {
    var v = s.pop(), w = s.pop(), x = s.pop();
    s.push(w); s.push(v); s.push(x);
  },
  "?": function(s) {
    var f = s.pop(), t = s.pop(), test = s.pop();
    s.push(test ? t : f);
  },
  // specials
  "dip": function(s, dict) { dict.swap(s); var v = s.pop(); dict.call(s, dict); s.push(v); },
  "call": function(s, dict) { s.pop()(s, dict); },
  ":": function(s, dict) { dict[s.pop()] = s.pop(); },
  "[": function(stack, dict, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, idx);
    stack.push(makeFun(tokens.slice(idx+1,end)));
    return end;
  },
  "'": function(stack, _, tokens, idx) {
    stack.push(tokens[idx+1]);
    return idx+1;
  },
  'parseNum': function parseNum(stack, _, tokens, idx) {
    stack.push(parseFloat(tokens[idx]));
    return idx; // is return idx needed?
  },
};

function makeFun(tokens) {
  return function(stack, dict) { interpret(stack, dict, tokens); };
}

function matchingIndex(left, right, tokens, startIdx) {
  var i = startIdx +  1, balance = 1;
  while(balance > 0 && i < tokens.length) { // todo: forloopify
    if(tokens[i] == left) balance++;
    else if(tokens[i] == right) balance--;
    i++;
  }
  return --i;
}

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

function makeFunType(tokens) {
  return function(stack, dict) { interpret(stack, dict, tokens); };
}

var typeDictionary = {
  // Math
  "+": binaryNumOp,
  "*": binaryNumOp,
  "mod": binaryNumOp,
  "sin": unaryNumOp,
  "cos": unaryNumOp,
  "xor": binaryNumOp,
  // Stack shuffling (types same as def!)
  "dup": function(s) { var v = s.pop(); s.push(v); s.push(v); }, 
  "drop": function(s) { s.pop(); }, 
  "swap": function(s) { var v = s.pop(), w = s.pop(); s.push(v); s.push(w); }, 
  "rot": function(s) {
    var v = s.pop(), w = s.pop(), x = s.pop();
    s.push(w); s.push(v); s.push(x);
  },

  "?": function(s) {
    var fBranchType = s.pop(), tBranchType = s.pop(), testType = assert(s, Bool);
    pushOneOf(s, [fBranchType, tBranchType]);
  },
  // specials
  "dip": function(s, dict) { dict.swap(s); var v = s.pop(); dict.call(s, dict); s.push(v); }, // same as def, but dict is typeDictionary
  "call": function(s, dict) { 
    const func = s.pop();
    console.log('typechecking call of:', func, func instanceof Set);
    if(func instanceof Function) {
      func(s, dict);
    } else if(func instanceof Set) {
      // return multiple times here?! (impl nondeterminism while at it :)
      // or just choose one of the funcions above and continue with that. 
      // and assert that all typestacks are the same for each function 

      const stacks = []
      let lastF;
      for(let f of func) {
        const newStack = [...s];    
        const newDict = Object.create(dict);
        
        f(newStack, newDict); 
        stacks.push(newStack);
        lastF = f;
      }
      console.log('alternative universes: ', stacks);
      console.assert(
        stacks.every((s, _, arr) => arr[0].length === s.length && arr.every((t, i) => t === s[i])), 
        'All functions in union should have same stack effects'
      );
      lastF(s, dict);

    } else {
      console.warn('Could not call, wrong type: ', func);
    }
  },
  ":": function(s, dict) { dict[s.pop()] = s.pop(); }, // same here?
  "[": function(stack, dict, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, idx);
    stack.push(makeFunType(tokens.slice(idx+1,end)));
    return end;
  },
  "'": function(stack, _, tokens, idx) { // ???
    stack.push(tokens[idx+1]);
    return idx+1;
  },
  parseNum: pushNum,
};

// Typechecker and interpreter same except for dictionary

function interpret(stack, dict, tokens) {
  for(var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var impl = (dict[token] || dict.parseNum);
    // console.log('impl:', token, impl, dict);
    var ret = impl(stack, dict, tokens, i);
    if(!isNaN(ret)) i = ret;
    // console.log('i:', token, stack);
  }
  return stack;
}

function i(stack, dict, str){
  interpret(stack, dict, str.trim().split(/\s+/g));
  return stack;
}

//Drawing
function draw() {
  if(!dict.draw) return;
  var img = ctx.createImageData(canvas.width, canvas.height);
  var time = Date.now();//%512;
  for(var y = 0; y < img.height; y++) {
    for(var x = 0; x < img.width; x++) {
      var index = (x + y * img.width) * 4;
      var s = [time, y, x];
      dict.draw(s, dict);
      var b = s.pop(), g = s.pop(), r = s.pop();
      img.data[index + 0] = r;   // r
      img.data[index + 1] = g;   // g
      img.data[index + 2] = b;   // b
      img.data[index + 3] = 255; // a
    }
  }
  ctx.putImageData(img, 0, 0);
}

// TODO: real dip, better solution ot swapping out draw?

function init() {
  dict = Object.create(dictionary);
  defs = "[ ? call ] ' if :\n" +
    "[ -1 * + ] ' - :\n" +
    "[ dup dup ] ' grey :\n" +
    "[ dup dip dip ] ' bi@ :\n" +
    "[ * * 0.00001 * sin 255 * grey ] ' draw :\n" +
    "[ 255 * ] ' scale :\n" +
    "[ 0.0001 * ] ' slower :\n" +
    "[ xor * 0.0001 * sin scale grey ] ' draw :\n";
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  code = document.getElementById("code");
  code.value = defs;
  output = document.getElementById("output");
  // Shift + Enter to eval and draw
  window.addEventListener("keydown", function(e) {
    if(e.shiftKey && e.which == 13 && code.value) {
      stack = [];
      typeStack = [];

      typeDict = Object.create(typeDictionary);      
      dict = Object.create(dictionary);

      i(typeStack, typeDict, code.value);
      console.log('typeStack', typeStack, typeDict);
      
      i(stack, dict, code.value);
      console.log('dataStack', stack, dict);

      draw(dict);
      output.innerHTML = "" + stack;

      e.preventDefault(); // stop Enters newline
      return false;
    }
    return true;
  });
  setInterval(draw, 200);
}

window.onload = init;
