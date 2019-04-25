// SPLASH resource generator

"use strict";

// Data reference for future storage
let data = [];

// Parent element of the grid
let gridElem = document.getElementById("Grid");

// The value of decay affects the probability of a resource based on the quantity
let decay;
let decayInterval;
let decayExponent;

// Also used for decay... should probably rename
let entityCount = 0;

// The color of the lil' boxes
let markColor;

// How likely a square is to inherit a resource
let probability;

// Square grud suze
let size;

// List of items to processed
let processQue = [];

var grid = {
    generate: function(){        
        grid._clear(true);
        grid._build();
    },
    _build: function() {
        
        for (let i = 0; i < size; i++) {
            let r = document.createElement('span');
            r.className = 'row';
            data[i] = [];
            for (let j = 0; j < size; j++) {
                let c = document.createElement('span');
                c.className = 'cell';
                c.setAttribute('data-pos', `${i}-${j}`);
                r.appendChild(c);
                data[i][j] = 0;
                
            }
            gridElem.appendChild(r);
        }

        grid._createEvents();
    },
    _createEvents: function(){
        let all = document.querySelectorAll('.cell');

        let _this = this;
        for (let i = 0; i < all.length; i++) {
            all[i].addEventListener("click", function(e){
                grid._seed(e);
            });
        }
    },
    _seed: function(e){
        let index = e.target.getAttribute('data-pos').split('-');
        grid._clear();
        grid._createMarkColor();
    
        index[0] = Number(index[0]);
        index[1] = Number(index[1]);

        grid._addEntity(e.target, index, 100);
        grid._setNeighbors(index);
        grid._runProcessQue();

    },
    _setNeighbors: function(index){
        
        let pos = {
            y: lc(index[0]),
            x: lc(index[1]),
            top: lc(index[0] - 1),
            bottom: lc(index[0] + 1),
            right: lc(index[1] + 1),
            left: lc(index[1] - 1),
        }
        //debugger;
        // TOP

        if ( (typeof(pos.top) === 'number' ) && (data[pos.top][pos.x] === 0)){
            processQue.push([pos.top, pos.x]);
            data[pos.top][pos.x] = 1;
        }
        // RIGHT
        if ((typeof (pos.right) === 'number') && (data[pos.y][pos.right] === 0)) {
            processQue.push([pos.y, pos.right]);
            data[pos.y][pos.right] = 1;
        }
        // BOTTOM
        if ((typeof (pos.bottom) === 'number') && (data[pos.bottom][pos.x] === 0)) {
            processQue.push([pos.bottom, pos.x]);
            data[pos.bottom][pos.x] = 1;
        }
        // LEFT
        if ((typeof (pos.left) === 'number') && (data[pos.y][pos.left] === 0)) {
            processQue.push([pos.y, pos.left]);
            data[pos.y][pos.left] = 1;            
        }

        // Keep within grid parameters
        function lc(v) {
            return (v <= (size - 1)) && (v >= 0) ? v : null;
        }


    },
    _runProcessQue: function() {
        let _this = this;
        let max = 0;
        for (let index = 0; index < processQue.length; index++) {

            if (typeof (processQue[index][0]) === 'number' && typeof (processQue[index][1]) === 'number'){
                
                let elem = document.querySelectorAll(`[data-pos='${processQue[index][0]}-${processQue[index][1]}']`)[0];

                grid._processCell(processQue[index], elem);
            }
        }
        console.log('entity count: ', entityCount);
        processQue = [];
    },
    _processCell: function(index, elem){
        //elem.style.backgroundColor = 'blue';
        // Chance to process cell
        let ran = Math.random() * (100 - 0);

        if(decay !== 0 && (entityCount === decayInterval ** decayExponent)){
            decayExponent++
            probability = probability - decay;
            markColor[3] = markColor[3] - .1;
            entityCount = 0;
            //debugger;
            
        }

        if (ran <= probability){
            entityCount++
            grid._addEntity(elem, index, probability);
            grid._setNeighbors(index);
        }
    },
    _addEntity: function(parent, index, value){
        let marker = document.createElement('span');

        index[0] = Number(index[0]);
        index[1] = Number(index[1]);

        marker.className = 'marker';
        marker.style.backgroundColor = `rgba(${markColor[0]},${markColor[1]},${markColor[2]},${markColor[3]})`;
        marker.innerHTML = `<label>${value ? value : '0'}</label>`;
        //debugger;
        parent.appendChild(marker);

        data[index[0]][index[1]] = value ? value : '0';
    },
    _createMarkColor: function(){
        markColor = [
            Math.floor(Math.random() * (255 - 0)),
            Math.floor(Math.random() * (255 - 0)),
            Math.floor(Math.random() * (255 - 0)),
            1
        ];
    },
    _clear: function(clearHTML){
        processQue = [];
        decayInterval = 2;
        decayExponent = 2;
        entityCount = 0;
        probability = Number(document.getElementById("Probability").value);
        decay = Number(document.getElementById("Decay").value);
        size = Number(document.getElementById("Size").value);
        decayInterval = Number(document.getElementById("DecayInterval").value);
        decayExponent = Number(document.getElementById("DecayExponent").value);
        if(clearHTML){
            gridElem.innerHTML = '';
        }
    }

}
