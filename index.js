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

// Also used for decay...
let newEntityCount = 0;

// The color of the lil' boxes
let markColor;

// How likely a square is to inherit a resource
let probability;

// Square grid size
let size;

// List of items to be processed
let processQue = [];


var grid = {

    /** Init the grid */
    generate: () => {        
        grid._clear(true);
        grid._build();
    },
    /** Create the grid */
    _build: () => {
        // Grid is composed of 'rows' and 'columns'
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
    /** Setup click events on cells */
    _createEvents: () =>{
        let all = document.querySelectorAll('.cell');

        for (let i = 0; i < all.length; i++) {
            all[i].addEventListener("click", (e) => {
                grid._seed(e);
            });
        }
    },
    /**
     * Executes behavior on origin cell, "seed"
     * @param {object} e - Event object of clicked item
     */
    _seed: (e) => {
        let index = e.target.getAttribute('data-pos').split('-');
        grid._clear();
        grid._createMarkColor();
    
        index[0] = Number(index[0]);
        index[1] = Number(index[1]);

        grid._addEntity(e.target, index, 100);
        grid._setNeighbors(index);
        grid._runProcessQue();

    },
    /**
     * Iterate through qued cells to determine their viability
     * @param {array} index - array index of target element
     */
    _setNeighbors: (index) => {
        
        let pos = {
            y: lc(index[0]),
            x: lc(index[1]),
            top: lc(index[0] - 1),
            bottom: lc(index[0] + 1),
            right: lc(index[1] + 1),
            left: lc(index[1] - 1),
        }

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

        /**
         * filters out values outside of grid
         * @param {number} v - value of a position
         * @return {number} value should be within appropriate range according to grid size, or returns null.
         * * This keeps us from queing up cells that don't exist on the grid
         */
        const lc = (v) => {
            return (v <= (size - 1)) && (v >= 0) ? v : null;
        }
    },
    /** Iterate through qued cells to determine their viability */
    _runProcessQue: () => {
        for (let index = 0; index < processQue.length; index++) {

            if (typeof (processQue[index][0]) === 'number' && typeof (processQue[index][1]) === 'number'){
                
                let elem = document.querySelectorAll(`[data-pos='${processQue[index][0]}-${processQue[index][1]}']`)[0];

                grid._processCell(processQue[index], elem);
            }
        }
        console.log('entity count: ', newEntityCount);
        processQue = [];
    },
    /**
     * Determine viability of a cell
     * @param {array} index - XY of element
     * @param {object} elem - DOM object, row to attach to
     */
    _processCell: (index, elem) => {

        // Chance to process cell
        let ran = Math.random() * (100 - 0);

        if(decay !== 0 && (newEntityCount === decayInterval ** decayExponent)){
            decayExponent++
            probability = probability - decay;
            markColor[3] = markColor[3] - .1;
            newEntityCount = 0;
            //debugger;
            
        }

        if (ran <= probability){
            newEntityCount++
            grid._addEntity(elem, index, probability);
            grid._setNeighbors(index);
        }
    },
    /**
    * Create HTML marker node
     * @param {object} parent - DOM object to append to
     * @param {array} index - XY of element
     * @param {string} value - contents of marker label
     */
    _addEntity: (parent, index, value) => {
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
    /** Generates random rgba color (array) */
    _createMarkColor: () =>{
        markColor = [
            Math.floor(Math.random() * (255 - 0)),
            Math.floor(Math.random() * (255 - 0)),
            Math.floor(Math.random() * (255 - 0)),
            1
        ];
    },

    /**
     * Clears grid data
     * @param {boolean} clearHtml - Destroy grid element
     */
    _clear: (clearHTML) => {
        processQue = [];
        decayInterval = 2;
        decayExponent = 2;
        newEntityCount = 0;
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
