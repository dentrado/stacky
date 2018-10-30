type Dict = { [name: string]: string }
const dictionary: Dict = {
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
  "rot": "var v = s.pop(), w = s.pop(), x =s.pop(); s.push(w,v,x);",
  "?": "var f = s.pop(), t = s.pop(), test=s.pop(); s.push(test ? t : f);",
  "call": "s.pop()();",
  "dip": "var v = s.pop(), w = s.pop(); s.push(v); s.pop()(); s.push(w);",
  // debug
  "dbg": "console.log(s.pop());"
};
type Specials = { [name: string]: (dict: Dict, tokens: Array<string>, idx: number) => [string, number] };
const specials: Specials = {
  ":": function (dict, tokens, idx) {
    const end = matchingIndex(":", ";", tokens, idx);
    dict[tokens[idx + 1]] = compile(dict, tokens.slice(idx + 2, end));
    return ["", end];
  },
  "[": function (dict, tokens, idx) {
    const end = matchingIndex("[", "]", tokens, idx);
    return [makeFun(dict, tokens.slice(idx + 1, end)), end];
  },
  "(": function (dict, tokens, idx) {
    const end = matchingIndex("(", ")", tokens, idx);
    return ["", end];
  },
  "'": function (_, tokens, idx) { return ["s.push('" + tokens[idx + 1] + "');", idx + 1]; }
};


function matchingIndex(left: string, right: string, tokens: Array<string>, startIdx: number) {
  let i = startIdx + 1, balance = 1;
  while (balance > 0 && i < tokens.length) { // todo: forloopify
    if (tokens[i] == left) balance++;
    else if (tokens[i] == right) balance--;
    i++;
  }
  return --i;
}

function makeFun(dict: Dict, tokens: Array<string>) {
  return "s.push(function(){" + compile(dict, tokens) + "});";
}

function parseNum(token: string) {
  return "s.push(" + token + ");";
}

function compile(dict: Dict, tokens: Array<string>) {
  let str = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (specials[token]) {
      const [s, idx] = specials[token](dict, tokens, i);
      str += s;
      i = idx;
    } else {
      str += dict[token] || parseNum(token);
    }
  }
  return str;
}

function i(stack: Array<any>, dict: Dict, str: string) {
  var js = compile(dict, str.trim().split(/\s+/g));
  console.log(js);
  return new Function("s", js)(stack);
}

//Drawing
let ctx, canvas, time, dict, code, output, drawingfn;
function draw() {
  if (!drawingfn) return;

  var img = ctx.createImageData(canvas.width, canvas.height);
  time += 5 //= Date.now();//%512;
  var s = [];
  for (var y = 0; y < img.height; y++) {
    for (var x = 0; x < img.width; x++) {
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

// TODO: real dip, better solution ot swapping out draw?

function init() {
  dict = Object.create(dictionary);
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  code = document.getElementById("code");

  output = document.getElementById("output");
  // Shift + Enter to eval and draw
  window.addEventListener("keydown", function (e) {
    if (e.shiftKey && e.which == 13 && code.value) {
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
  setInterval(draw, 50);
}

window.onload = init;
