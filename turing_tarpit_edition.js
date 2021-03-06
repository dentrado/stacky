// TODO [ ] seems to be eating things after it
// replace interpret:
//  (specials[token] || dict[token] || parseNum)(stack, tokens, idx)


var stack = [];
var dict = {
  ":": function(s) { dict[s.pop()] = s.pop(); },
  "+": function(s) { s.push(s.pop() + s.pop()) }
};
var specials = {
  "[": function(stack, tokens, idx) {
    var end = matchingIndex("[", "]", tokens, i);
    stack.push(makeFun(tokens.slice(i+1,end)));
    return end;
  },
  "'": function(stack, tokens, idx) {
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
  console.log("fun created:" + tokens);
  return function(stack) { interpret(stack, tokens); };
}

function parseNum(stack, tokens, idx) {
  stack.push(parseFloat(tokens[idx]));
  return idx;
}

function interpret(stack, tokens) {
  for(var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    (specials[token] || dict[token] || parseNum)(stack, tokens, i);
  }
  return stack;
}

function i(str){ interpret(stack, str.split(" ")); return stack; }
