var drawingfn = null;
var time = 0;
var dictionary = {
  // Math
  "+": "s.push(s.pop() + s.pop());",
  "*": "s.push(s.pop() * s.pop());",
  "mod": "var v = s.pop(); s.push(s.pop() % v);",
  "sin": "s.push(Math.sin(s.pop()));",
  "cos": "s.push(Math.cos(s.pop()));",
  "tan": "s.push(Math.tan(s.pop()));",
  "xor": "s.push(s.pop() ^ s.pop());",
  // Stack shuffling
  "dup": "var v = s.pop(); s.push(v); s.push(v);",
  "drop": "s.pop();",
  "swap": "var v = s.pop(), w = s.pop(); s.push(v); s.push(w);",
  "rot": "var v = s.pop(), w = s.pop(), x =s.pop(); s.push(w); s.push(v); s.push(x);",
  "?": "var f = s.pop(), t = s.pop(), test=s.pop(); s.push(test ? t : f);",
  "call": "s.pop()();",
  "dip": "var v = s.pop(), w = s.pop(); s.push(v); s.pop()(); s.push(w);",
};
var specials = {
  ":": function(dict, tokens, idx) {
    var end = matchingIndex(":", ";", tokens, idx);
    dict[tokens[idx+1]] = compile(dict, tokens.slice(idx+2,end));
    return ["", end];
  },
  "[": function(dict, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, idx);
    return [makeFun(dict, tokens.slice(idx+1,end)), end];
  },
  "(": function(dict, tokens, idx) {
    var end = matchingIndex("(", ")", tokens, idx);
    return ["", end];
  },
  "'": function(_, tokens, idx) { return ["s.push('" + tokens[idx+1] + "');", idx+1]; }
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
  return "s.push(function(){" + compile(dict, tokens) + "});";
}

function parseNum(token) {
  return "s.push(" + token + ");";
}

function compile(dict, tokens) {
    var str = "";
    for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if(specials[token]) {
            ret = specials[token](dict, tokens, i);
            str += ret[0];
            i = ret[1];
        } else {
            str += dict[token] || parseNum(token);
        }
    }
    return str;
}

function i(stack, dict, str){
  var js = compile(dict, str.trim().split(/\s+/g));
  console.log(js);
  return new Function("s", js)(stack);
}

//Drawing
function draw() {
  if(!drawingfn) return;

  var img = ctx.createImageData(canvas.width, canvas.height);
  time += 5 //= Date.now();//%512;
  for(var y = 0; y < img.height; y++) {
    for(var x = 0; x < img.width; x++) {
      var index = (x + y * img.width) * 4;
      var s = [time, y, x];
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

// TODO: real dip, better solution ot swapping out draw?

function init() {
  dict = Object.create(dictionary);
  defs = ": if  ? call ; \n\
: over [ dup ] dip swap ; \n\
: -   -1 * + ; \n\
: grey dup dup ; \n\
: bi@  dup dip dip ; \n\
: draw * * 0.00001 * sin 255 * grey ; \n\
: scale 255 * ; \n\
: slower 0.0001 * ; \n\
: draw  xor * 0.0001 * sin scale grey ;"
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  code = document.getElementById("code");
  //code.value = defs;
  output = document.getElementById("output");
  // Shift + Enter to eval and draw
  window.addEventListener("keydown", function(e) {
    if(e.shiftKey && e.which == 13 && code.value) {
      var stack = [];
      dict = Object.create(dictionary);
      i(stack, dict, code.value);
      drawingfn = dict.draw ? new Function("s", dict.draw) : null;
      console.log(stack, dict);
      draw();
      output.innerHTML = "" + stack;

      e.preventDefault(); // stop Enters newline
      return false;
    }
    return true;
  });
  setInterval(draw, 100);
}

window.onload = init;

/*
: if  ? call ;
: -   -1 * + ;
: grey dup dup ;
: bi@  dup dip dip ;
: draw * * 0.00001 * sin 255 * grey ;
: scale 255 * ;
: slower 0.0001 * ;
: draw  xor * 0.0001 * sin scale grey ;

: draw  xor swap 512 mod slower sin scale * grey ;

: rotate dup cos swap sin rot * rot rot * swap - ;
[ y x angle ] drop


*/