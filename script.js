var stack = [];
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

function makeFun(tokens) {
  return function(stack, dict) { interpret(stack, dict, tokens); };
}

function parseNum(stack, _, tokens, idx) {
  stack.push(parseFloat(tokens[idx]));
  return idx;
}

function interpret(stack, dict, tokens) {
  for(var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var ret = (dict[token] || parseNum)(stack, dict, tokens, i);
    if(!isNaN(ret)) i = ret;
  }
  return stack;
}

function i(stack, dict, str){
  interpret(stack, dict, str.trim().split(/\s+/g));
  return stack;
}

//Drawing
function draw(dict) {
  if(!dict.draw) return;
  var img = ctx.createImageData(canvas.width, canvas.height);
  for(var y = 0; y < img.height; y++) {
    for(var x = 0; x < img.width; x++) {
      var index = (x + y * img.width) * 4;
      var s = [y, x];
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

function init() {
  defs = "[ ? call ] ' if :\n" +
      "[ -1 * + ] ' - :\n" +
      "[ dup dup ] ' grey :\n" +
      "[ 100 - 0 1 ? ] ' hundred? :\n" +
      "[ + dup hundred? [ 255 255 ] [ grey ] if ] ' draw :";
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  code = document.getElementById("code");
  code.value = defs;
  output = document.getElementById("output");
  // Shift + Enter to eval and draw
  window.addEventListener("keydown", function(e) {
    if(e.shiftKey && e.which == 13 && code.value) {
      var stack = [];
      var dict = Object.create(dictionary);
      i(stack, dict, code.value);
      console.log(stack, dict);

      draw(dict);
      output.innerHTML = "" + stack;

      e.preventDefault(); // stop Enters newline
      return false;
    }
    return true;
  });
}

window.onload = init;
