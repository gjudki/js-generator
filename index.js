// SPLASH resource generator

// Ground paint
    // Dirt
    // Grass
    // Water
    // Sand
    // Snow
    // Rockysoil
// Altitude paint
// Asset Paint
    // Tree
    // Boulder
    // Asset with chest
    // Cactus
    // (man made assets)
        // Wall 
        // House
        // Farm
        // Fence
// River / path finding

"use strict";

// Data reference for future storage
//
let data = [];
let borderData = { north: [], east: [], south: [], west: [],};

const ground = [
    {
        label: 'D',
        bkgc: 'brown'
    },
    {
        label: 'G',
        bkgc: 'green'
    },
    {
        label: 'W',
        bkgc: 'blue'
    },
    {
        label: 'Sa',
        bkgc: 'yellow'
    },
    {
        label: 'Sn',
        bkgc: 'white'
    },
    {
        label: 'R',
        bkgc: 'silver'
    },
];

// Parent element of the grid
let gridElem = document.getElementById("Grid");

// The value of decay affects the probability of a resource based on the quantity
let decay;
let decayInterval;
let decayExponent;

// Also used for decay...
let newEntityCount = 0;

// border seed
let borderSeedVariability;
let stray;

// The color of the lil' boxes
let markColor;

// How likely a square is to inherit a resource
let probability;

// Square grid size
let size;

// List of items to be processed
let processQue = [];


const grid = {

    /** Init the grid */
    generate: () => {        
        grid._clear(true);
        grid._build();
    },
    /** Create the grid */
    _build: () => {
        
        let borderChecks = {
            north: document.getElementsByName('border-seed-n')[0].checked,
            east: document.getElementsByName('border-seed-e')[0].checked,
            south: document.getElementsByName('border-seed-s')[0].checked,
            west: document.getElementsByName('border-seed-w')[0].checked,
        }
  
        //let showNBorder = false;
        
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

        // Create borders
        for (const key in borderChecks) {
            if (borderChecks[key] === true){
                grid._generateBorder(key);
            }
        }       

        // Attach event handlers
        grid._createEvents();
    },
    _generateBorder: (key) => {
        let cellValueA = ground[0];
        let cellValueB = ground[1];

        for (let i = 0; i < size; i++) {
            // Create border cell elements
            let border = document.getElementById(`Grid${helpers.capitalize(key)}Border`);
            let c = document.createElement('span');

            let seedValue = grid._bsVariabilityValue() === true ? cellValueA : cellValueB;// function should create these
            borderData[key][i] = seedValue;
            c.classList.add('cell', 'cell-border');
            c.innerHTML = `${i} <br><bold>${seedValue.label}</bold>`;
            c.setAttribute('data-border-pos', `${i}}`);
            border.appendChild(c);
        }

        grid._borderSeed('north', cellValueA, cellValueB);
    },
    _borderSeed: (position, norm, variant) => {
        let ref = [];
        let behavior = {
            start: [],
            nextV: 0,
            nextH: 0,
            nextLineV: 0,
            nextLineH: 0,
            nextLineReturn: true
        }
        switch(position) {
            case 'north':
                ref = borderData.north;
                behavior = {
                    start: [0, 0],
                    nextV: 0,
                    nextH: 1,
                    nextLineV: 1,
                    nextLineH: 0,
                    nextLineReturn: true
                }
                break;
            case 'east':
                ref = borderData.east;
                behavior = {
                    start : [(size - 1), 0]
                };
                break;
                
            case 'south':
                ref = borderData.south;
                behavior = {
                    start: [(size - 1), 0],
                    nextV: 0,
                    nextH: 1,
                    nextLineV: -1,
                    nextLineH: 0,
                    nextLineReturn: true
                };
                break;
                
            case 'west':
                ref = borderData.west;
                behavior = {
                    start : [0, 0]
                };
                break;   
        }

        // Start assesing values by each row
        for (let r = 0; r < size; r++) {
           
            // Start assesing values by each cell in row
            for (let c = 0; c < size; c++) {
                let targetPos = [
                    behavior.start[0] + (behavior.nextV * c) + r,
                    behavior.start[1] + (behavior.nextH * c),
                ];
                let ran = Math.floor(Math.random() * (100 - 0));
                //debugger;
                let elem = document.querySelectorAll(`[data-pos='${targetPos[0]}-${targetPos[1]}']`)[0];
                
                let value = stray < ran ? ref[c].label : variant.label;
                let bkg = stray < ran ? ref[c].bkgc : variant.bkgc;

                grid._addEntity(elem, targetPos, value, bkg);

                //data[targetPos[0]][targetPos[1]] = stray < ran ? ref[i] : variant;

            }

        }
        
            
    },
    /** Setup click events on cells */
    _createEvents: () =>{
        // TODO: target only cells in GRID
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
            y: grid._lc(index[0]),
            x: grid._lc(index[1]),
            top: grid._lc(index[0] - 1),
            bottom: grid._lc(index[0] + 1),
            right: grid._lc(index[1] + 1),
            left: grid._lc(index[1] - 1),
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
    },
    /**
     * (LOCAL CONSTRAINT) filters out values outside of grid
     * @param {number} v - value of a position
     * @return {number} value should be within appropriate range according to grid size, or returns null.
     * * This keeps us from queing up cells that don't exist on the grid
     */
    _lc: (v) => {
        return (v <= (size - 1)) && (v >= 0) ? v : null;
    },
    _bsVariabilityValue: () => {
        let bsv = Math.floor(Math.random() * (100 - 0));
        return bsv >= borderSeedVariability ? true : false;
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
    _addEntity: (parent, index, value, bkg) => {
        let marker = document.createElement('span');

        index[0] = Number(index[0]);
        index[1] = Number(index[1]);

        marker.className = 'marker';
        if(!bkg){
            marker.style.backgroundColor = `rgba(${markColor[0]},${markColor[1]},${markColor[2]},${markColor[3]})`;
        } else {
            marker.style.backgroundColor = bkg;
        }
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
        
        borderSeedVariability = Number(document.getElementById("BorderSeedVariability").value);
        decay = Number(document.getElementById("Decay").value);
        size = Number(document.getElementById("Size").value);
        decayInterval = Number(document.getElementById("DecayInterval").value);
        decayExponent = Number(document.getElementById("DecayExponent").value);
        stray = Number(document.getElementById("Stray").value);
        if(clearHTML){
            gridElem.innerHTML = '';
            // REFACTOR
            document.getElementById("GridNorthBorder").innerHTML = '';
            document.getElementById("GridEastBorder").innerHTML = '';
            document.getElementById("GridSouthBorder").innerHTML = '';
            document.getElementById("GridWestBorder").innerHTML = '';
        }
    },
    ui: {
        _buttonColor: () => {
            const c = [
                Math.floor(Math.random() * (255 - 0)),
                Math.floor(Math.random() * (255 - 0)),
                Math.floor(Math.random() * (255 - 0)),
            ];
            document.getElementById('Generate').style.color = `rgb(${c[0]},${c[1]},${c[2]})`;
            document.getElementById('Generate').style.borderColor = `rgb(${c[0]},${c[1]},${c[2]})`;
            
        }
    },
}

const helpers = {
    capitalize: (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
};

const init = () => {
    grid.ui._buttonColor();
}

init();
