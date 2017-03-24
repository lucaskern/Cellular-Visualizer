(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
loader.js
variable 'app' is in global scope - i.e. a property of window.
app is our single global object literal - all other functions and properties of 
the game will be properties of app.
*/

"use strict";

const main = require('./main.js');

window.addEventListener('load', function () {
  console.log("window.onload ran");
    let run = main.init();
})
},{"./main.js":2}],2:[function(require,module,exports){
'use strict'

const app = {
  canvas: undefined,
  ctx: undefined,
  firstRun: true,
  accurate: false,
  frames: 100,
  framesLimit: 3,
  grid: [],
  temp: [],
  width: 60,
  height: 45
    //size of each cell in px

    ,
  cellSize: 12
    //max amount of times a cell can be consecutively alive before dying.

    ,
  maxAge: 30
    //how fast it changes color (higher : quicker)

    ,
  colorRate: 6
    //color values for bg

    ,
  colorMode: "B&W"
    //color of cells

    ,
  colorVal: null
    //live neighbor count

    ,
  liveCount: 0
  
    /*, audCtx : new AudioContext()
    // create an oscillator
    , osc : audCtx.createOscillator()
    // change waveform of oscillator
    , osc.type : 'sawtooth'
    // start the oscillator running
    , osc.start()*/

    ,
  playNote: function (frequency, attack, decay, cmRatio, index) {
    //let audCtx = new AudioContext();
    // create our primary oscillator
    const carrier = audCtx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = frequency;
    // create an oscillator for modulation
    const mod = audCtx.createOscillator();
    mod.type = 'sine';
    // The FM synthesis formula states that our modulators 
    // frequency = frequency * carrier-to-modulation ratio.
    mod.frequency.value = frequency * cmRatio;
    const modGainNode = audCtx.createGain();
    // The FM synthesis formula states that our modulators 
    // amplitude = frequency * index
    modGainNode.gain.value = frequency * index;
    mod.connect(modGainNode);
    // plug the gain node into the frequency of
    // our oscillator
    modGainNode.connect(carrier.frequency);
    const envelope = audCtx.createGain();
    envelope.gain.linearRampToValueAtTime(1, audCtx.currentTime + attack);
    envelope.gain.linearRampToValueAtTime(0, audCtx.currentTime + attack + decay);
    carrier.connect(envelope);
    envelope.connect(audCtx.destination);
    mod.start(audCtx.currentTime);
    carrier.start(audCtx.currentTime);
    osc.stop(audCtx.currentTime + attack + decay);
  }
  
  , init: function () {
      console.log("app.main.init() called");
      // initialize properties
      this.canvas = document.querySelector('canvas');
      this.canvas.width = this.width * this.cellSize;
      this.canvas.height = this.height * this.cellSize;
      this.ctx = this.canvas.getContext('2d');
      //set up controls
      this.controls();
    
      console.log("init ran");
    
      //set up grid on first init only
      if (this.firstRun) {
        this.gridSetup();
        this.firstRun = false;
      }
      //playNote(880, .01, 1, 1.5307, 1);
      this.update();
    }
    //create grid using default or user modified values

    ,
  gridSetup: function () {
      this.grid = [];
      this.temp = [];
      //create canvas at appropriate size
      this.canvas.width = this.width * this.cellSize;
      this.canvas.height = this.height * this.cellSize;
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, 3000, 3000);
      //instantiate spaces in arrays
      for (let y = 0; y < this.height; y++) {
        this.grid[y] = [[]];
        this.temp[y] = [[]];
        for (let x = 0; x < this.width; x++) {
          //fill with random values 
          this.grid[y][x] = [Math.round(Math.random()), 0];
          this.temp[y][x] = [0, 0];
          //create border
          if (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1) {
            this.grid[y][x] = 0;
          }
        }
      }
    }
    //set up value controllers

    ,
  controls: function () {
    let thisRef = this;
    
    document.querySelector("#colorMode").onchange = function (e) {
      thisRef.colorMode = e.target.value;
    };
    document.querySelector("#cellSize").onchange = function (e) {
      thisRef.cellSize = e.target.value;
      thisRef.gridSetup();
      document.querySelector("#cellSizeVal").value = e.target.value;
    };
    document.querySelector("#width").onchange = function (e) {
      thisRef.width = e.target.value;
      thisRef.gridSetup();
      document.querySelector("#widthVal").value = e.target.value;
    };
    document.querySelector("#height").onchange = function (e) {
      thisRef.height = e.target.value;
      thisRef.gridSetup();
      document.querySelector("#heightVal").value = e.target.value;
    };
    document.querySelector("#dispMode").onchange = function (e) {
      if (e.target.value == "aesthetics") {
        thisRef.accurate = false;
        thisRef.gridSetup();
      } else {
        thisRef.accurate = true;
        thisRef.gridSetup();
      }
    }
    document.querySelector("#maxAge").onchange = function (e) {
      thisRef.maxAge = e.target.value;
      document.querySelector("#maxAgeVal").value = e.target.value;
    };
    document.querySelector("#colorRate").onchange = function (e) {
      thisRef.colorRate = e.target.value;
      document.querySelector("#colorRateVal").value = e.target.value;
    };
  },
  runAutomata: function () {
    // loop through every cell
    // look at cell neighbors and count live ones
    // determine next cell state based on neighbor count
    // set temp [y][x] -> new cell state
    this.liveCount = 0;
    //loop through and count live neighbors
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y - 1][x - 1][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y - 1][x][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y - 1][x + 1][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y][x - 1][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y][x + 1][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y + 1][x - 1][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y + 1][x][0] == 1) {
          this.liveCount++;
        }
        if (this.grid[y + 1][x + 1][0] == 1) {
          this.liveCount++;
        }
        //update temp
        if (this.grid[y][x][0] == 1) {
          if (this.liveCount == 1 || this.liveCount == 0) {
            this.temp[y][x][0] = 0;
            this.temp[y][x][1] = 0;
            //playNote(333, .01, .5, 2.5307, 1);
          } else if (this.liveCount == 2 || this.liveCount == 3) {
            this.temp[y][x][0] = 1;
            this.temp[y][x][1]++;
          } else {
            this.temp[y][x][0] = 0;
            this.temp[y][x][1] = 0;
          }
          if (this.grid[y][x][1] >= this.maxAge) {
            this.temp[y][x][0] = 0;
            this.temp[y][x][1] = 0;
            //play note on death from old age
            //playNote(1333, .04, .1, 1.5307, 1);
          }
        } else if (this.grid[y][x][0] == 0) {
          if (this.liveCount == 3) {
            this.temp[y][x][0] = 1;
            this.temp[y][x][1]++;
          } else {
            this.temp[y][x][0] = 0;
            this.temp[y][x][1] = 0;
          }
        }
        this.liveCount = 0;
      }
    }
    // after for loop swap grid and temp arrays
    let swap = this.grid;
    this.grid = this.temp;
    //swap if conway rules is selected by user
    if (this.accurate) {
      this.temp = swap;
    }
  },
  draw: function () {
      //BG color, alpha is important
      this.ctx.fillStyle = 'rgba(13, 9, 28, .2)';
      this.ctx.fillRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);
      this.ctx.fillStyle = 'black';
    
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x][0] == 1) {
            this.ctx.strokeStyle = "black";
            //determine color intensity of cell based on its age
            this.colorVal = (this.grid[y][x][1] * this.colorRate).toString();
            //change fillStyle based on color mode selected
            switch (this.colorMode) {
              case "default":
                this.ctx.fillStyle = 'rgb(' + this.colorVal + ', 1 ,' + this.colorVal + ')';
                break;
              case "blue":
                this.ctx.fillStyle = 'rgb(' + this.colorVal + ',' + this.colorVal + ',' + Math.round(this.colorVal * 2.5) + ')';
                break;
              case "orange":
                this.ctx.fillStyle = 'rgb(' + this.colorVal * 4 + ',' + this.colorVal * 2 + ',' + 20 + ')';
                break;
              case "B&W":
                this.ctx.fillStyle = 'rgb(' + this.colorVal + ',' + this.colorVal + ',' + this.colorVal + ')';
            }
            if (this.grid[y][x][1] == this.maxAge - 1) {
              this.ctx.fillStyle = "red";
            }
            //fill and stroke rects
            this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize)
            this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
          }
          //make border
          else if (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            this.ctx.fillStyle = "black";
          }
        }
      }
      //run round of cell calculations
      this.runAutomata();
    }
    //render

    ,
  update: function () {
    this.animationID = requestAnimationFrame(this.update.bind(this));
    
    //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    //only draw once threshold is passed
    if (this.frames >= this.framesLimit) {
      this.draw();
      this.frames = 0;
    }
    this.frames++;
    //stop tracking fps

    //window.requestAnimationFrame(update);
  }
}

module.exports = app;
},{}]},{},[1]);