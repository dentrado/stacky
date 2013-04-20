var stack = [];
var dictionary = {
  "+": function(s) { s.push(s.pop() + s.pop()); },
  "*": function(s) { s.push(s.pop() * s.pop()); },
  "dup": function(s) { var v = s.pop(); s.push(v); s.push(v); },
  "?": function(s) {
    var f = s.pop(), t = s.pop(), test = s.pop();
    s.push(test ? t : f);
  },
  // specials
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
  // console.log("fun created:", tokens);
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
    if(!isNaN(ret))
      i = ret;
//    console.log("one interp: ", "" + stack, tokens, i);
  }
  return stack;
}

function i(stack, dict, str){
  interpret(stack, dict, str.trim().split(/\s+/g));
  return stack;
}

//Drawing
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function draw() {
    var img = ctx.createImageData(canvas.width, canvas.heigth);
    for(var x = 0; x < canvas.width; x++) {
        for(var y = 0; y < canvas.height; y++) {
            img.data[0 * 4] = x + y;
        }
    }
    ctx.putImageData(img, 0, 0);
}


var defs = "[ ? call ] ' if :           ";
