"use strict";

var Person = function() {
  this.name = "joe";
  this.kids = [1,20,100];
  this.burp = function(n){
    console.log("Person 1 Burping:  " + n);
  };
  this.greetAll = function() { 
    var p = this;
    this.kids.forEach(function(k) { 
      p.burp(k);
    });
  };
};
var p = new Person();
p.greetAll();
