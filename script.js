var stack = [];
var dict = { 
  ":": function(s) { dict[s.pop()] = s.pop(); },
  "+": function(s) { s.push(s.pop() + s.pop()) },
};
var specials = {};

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

function interpret(stack, tokens) {
  for(var i = 0; i < tokens.length; i++) {
    if(tokens[i] == "[") {
      var end = matchingIndex("[", "]", tokens, i);
      stack.push(makeFun(tokens.slice(i+1,end)));
      i = end;
    } else if(dict[tokens[i]]) {
  		dict[tokens[i]](stack);
    } else {
    	stack.push(tokens[i]);
    }
  }
  return stack;
}

function i(str){ interpret(stack, str.split(" ")); return stack; }
