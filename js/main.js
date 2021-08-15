'use strict'

//  Elements

const elConsoleBox = document.querySelector('.console');
const elBoardBox = document.querySelector('.board');

let cells;              // Array che conterrà tutte le celle
let pawns = [];         // Array che conterrà tutte le pedine

let currentScore = 1;   

init();

/*
//
//  Funzioni relative 
//  all'inizio del gioco
//
*/

//  Inizializza il gioco

function init(){

    cells = createCells();    
    resizeCells(cells);

    createPawns(3);

} 


//  Crea le 30 celle che compongono la scacchiera e restituisce un array che le contiene tutte

function createCells() {
    
    //  Crea 30 div con classe 'cell'
    
    for(let i = 0; i < 30; i++){
        elBoardBox.insertAdjacentHTML( 'beforeend' , `<div class="cell"></div>`);
    }

    //  Inserisco tutte le celle in un array 
    const unsortedCells = [...document.querySelectorAll('.cell')];

    // Ordino l'array correttamente (gli elementi nella riga centrale devono essere invertiti)
    const sortedCells = [...unsortedCells.slice(0 , 10) , ...unsortedCells.slice(10 , 20).reverse() , ...unsortedCells.slice(20)];

    //  Assegna numero e colore alle celle
    sortedCells.forEach(function(cell , i) {
        cell.classList.add(`cell--${i}` , `cell--${i % 2 === 0 ? 'black' : 'white'}`);
    });
    
    const cellObj = [];
    
    //  Crea oggetto rappresentate una cella e lo inserisce nel relativo array    
    sortedCells.forEach( (cell , i) => { 
        cellObj.push({
            index : i , 
            el : cell , 
            pawn : null ,
            prev() {
                return cells[this.index - 1 ] ?? null;
            } ,
            next() {
                return cells[this.index + 1 ] ?? null;
            } ,            
            empty() {
                this.pawn = null;
            }

        })
    });
    
    return(cellObj);

}


//  Crea pedine all'inizio del gioco (pawnsN == numero di pedine per ogni giocatore)

function createPawns(pawnsN = 7) {

    for(let i = 0; i < pawnsN; i++) {
        newSinglePawn('white' , i * 2);
        newSinglePawn('black' , i * 2 + 1);
    };

    //  Crea singola pedina

    function newSinglePawn(color , index){

        const el = document.createElement('div');
        el.classList.add(`pawn` , `pawn--${color}` , `pawn--${index}`);
        el.style.color='red';   //debug
        el.innerHTML=index; // debug

        let newPawn = {
            index       : index ,
            el          : el ,
            color       : color , 
            cell        : null ,
            isMoveable  : false ,

            setMoveability({moveable = false, cell = null, message = ''}) {

                if(moveable) {
                    this.isMoveable = true;
                    const thisPawn = this;
                    this.el.classList.add('pawn--moveable');
                    this.el.onclick = function() { movePawn(thisPawn , cell) };                    
                } else {
                    this.isMoveable = false;
                    this.el.classList.remove('pawn--moveable');
                    this.el.onclick = function() { showMessage(message) };
                }
            } ,
        }

        pawns.push(newPawn);    // Aggiunge all'array

        addPawn(newPawn , cells[index]);

    }

}


//  Controlla se una pedina può essere spostata in base alla sua posizione ed al lancio

function checkIfMoveable(pawn , cell){

    if(!cell) { pawn.setMoveability({message : `Stai andando troppo avanti: non ci sono più celle!`}); return}; // Soluzione momentanea

    //  La cella è successiva alla 25 la pedina non è attualmente sulla cella 25
    if(cell.index > 25 && pawn.cell.index !== 25){
        pawn.setMoveability({message : `Non puoi superare la casella 26 senza prima stazionarci.`})
        return;
    }
    
    //  La cella è già occupata da una pedina dello stesso colore. Non si procede    
    if(cell.pawn?.color === pawn.color){
        pawn.setMoveability({message : `Non puoi spostare pedina in una casella già occupata da una pedina dello stesso colore.`});
        return;
    }

    //  La cella è occupata da una pedina di colore diverso.
    if(cell.pawn?.color) {

        //  Sulla cella di destinazione e su almeno una di quelle adiacenti è presente una pedina avversaria. Le pedine sono quindi inattaccabili.
        if(cell.prev()?.pawn?.color === cell.pawn.color || cell.next()?.pawn?.color === cell.pawn.color){            
            pawn.setMoveability({message : `Due o più pedine nella casella di destinazione formano un muro che le rende inattaccabili.`});
            return;
        }
    }

    // Nessuna Eccezione (Casella Vuota)

    pawn.setMoveability({moveable : true , cell : cell });

}

function movePawn(pawn , cell){

    console.log(`Devo Spostare la pedina ${pawn.index} dalla casella ${pawn.cell?.index} alla casella ${cell.index}`);

    //  !!! SE SIAMO ARRIVATI QUI LE VERIFICHE Son GIà STATE FATTE. NON BISOGNA FARE ALTRI CONTROLLI !!!

    if(cell.pawn){
        console.log(`La casella è occupara da una pedina di colore diverso, per cui le scambio`);
        swapPawns(pawn , cell.pawn);
        return;
    }    

    removePawn(pawn);
    addPawn(pawn , cell);

}

function removePawn(pawn){    
    pawn.cell.empty();
    pawn.el.remove();
}


function addPawn(pawn , cell){
    pawn.cell = cell;
    cell.pawn = pawn;
    cell.el.appendChild(pawn.el);

    pawns.forEach( pawn => pawn.el.onclick = null );

}


function swapPawns(pawn1 , pawn2){

    let cell1 = pawn2.cell;
    let cell2 = pawn1.cell;

    removePawn(pawn1);
    removePawn(pawn2);

    addPawn(pawn1 , cell1);
    addPawn(pawn2 , cell2);

}


function newRound(){

    currentScore = getRandom(8 , 10);

    console.log(`Tiro da ${currentScore} caselle`);
    showMessage(`Tiro da ${currentScore} caselle`);

    pawns.forEach( pawn =>  checkIfMoveable(pawn , cells[pawn.cell.index + currentScore]) );    // qui devi considerare che la cella di destinazione potrebbe non esistere (> 29)

    if (!pawns.some( pawn => pawn.isMoveable)) {
        showMessage(`ATTENZIONE: NON CI SONO MOSSE DISPONIBILI!`);
    };

}


//  Dimensiona le celle

function resizeCells(cells){
    const cellSize = elBoardBox.offsetWidth / 10;
    cells.forEach( cell => cell.el.style = `width: ${cellSize}px; height: ${cellSize}px;`);    
}

function showMessage(error) {

    elConsoleBox.textContent = error;
    
    setTimeout( function(){
        elConsoleBox.textContent = '';
    } , 4000)
}


/*
//
//
//  Event Handlers
//
*/

// Al ridimensionarsi della finestra ricalcola dimensioni delle celle

window.addEventListener('resize' , function(){
    resizeCells(cells);
});

elConsoleBox.addEventListener('click' , newRound);

/*
***
***     Funzioni
***     Generiche
***
*/

//  Restituisce numero casuale compreso fra min e max

function getRandom(min,max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}