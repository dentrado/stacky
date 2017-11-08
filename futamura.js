var drawingfn = null;
var time = 0;
var dictionary = {
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
  ":": function(dict, tokens, idx) {
    var end = matchingIndex(":", ";", tokens, idx);
    dict[tokens[idx+1]] = compile(dict, tokens.slice(idx+2,end));
    return [undefined, end];
  },
  "[": function(dict, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, idx);
    return [makeFun(dict, tokens.slice(idx+1,end)), end];
  },
  "(": function(dict, tokens, idx) {
    var end = matchingIndex("(", ")", tokens, idx);
    return [undefined, end];
  },
  "'": function(_, tokens, idx) { 
    const quotedToken = tokens[idx+1];
    return [(s) => s.push(quotedToken), idx+1]; 
  }
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

function makeFun(dict, tokens) {
  const fun = compile(dict, tokens);  
  return (s) => s.push(fun);
}

function parseNum(token) {
  const num = parseFloat(token);  
  return (s) => s.push(num);
}

function compile(dict, tokens) {
    let fns = [];
    for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if(specials[token]) {
            ret = specials[token](dict, tokens, i);
            if(ret[0] !== undefined) {
                fns.push(ret[0]);
            }
            i = ret[1];
        } else {
            fns.push(dict[token] || parseNum(token));
        }
    }
    return (s) => fns.forEach(fn => fn(s));
}

function i(stack, dict, str){
  var js = compile(dict, str.trim().split(/\s+/g));
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
      dict = Object.create(dictionary);
      i(stack, dict, code.value);
      drawingfn = dict.draw;
      console.log(stack, dict);
      draw();
      output.innerHTML = "" + stack;

      e.preventDefault(); // stop Enters newline
      return false;
    }
    return true;
  });
  setInterval(draw, 200);
}

window.onload = init;
