'use strict'

//  Elements

const elConsoleBox = document.querySelector('.console');
const elBoardBox = document.querySelector('.board');

let cells;              // Array che conterrà tutte le celle
let pawns = [];         // Array che conterrà tutte le pedine

let currentPlayer = 'white';

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
    createPawns(7);

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

            prev()  { return cells[this.index - 1 ] ?? null; } ,
            next()  { return cells[this.index + 1 ] ?? null; } ,            
            empty() { this.pawn = null; } ,

        });
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

            setMoveability( {moveable = false, cell = null, message = ''}) {

                this.isMoveable = moveable;

                if(moveable) {
                    const thisPawn = this;
                    this.el.classList.add('pawn--moveable');
                    this.el.onclick = function() { movePawn(thisPawn , cell) };
                    return;
                }

                this.el.classList.remove('pawn--moveable');
                this.el.onclick = function() { showMessage(message) };
                
            } ,
        }

        pawns.push(newPawn);    // Aggiunge all'array

        addPawn(newPawn , cells[index]);

    }

}


//  Controlla se una pedina può essere spostata in base alla sua posizione ed al lancio

function checkIfMoveable(pawn , cell){

    if(!cell) { pawn.setMoveability( {message : `Stai andando troppo avanti: non ci sono più celle!`}); return}; // Soluzione momentanea

    //  È il turno dell'avversario
    if(pawn.color !== currentPlayer){
        pawn.setMoveability( {message : `Non puoi muovere questa pedina: è il turno di ${currentPlayer}.`});
        return;
    }

    //  La cella è successiva alla 25 la pedina non è attualmente sulla cella 25
    if(cell.index > 25 && pawn.cell.index !== 25){
        pawn.setMoveability( {message : `Non puoi superare la casella 26 senza prima stazionarci.`})
        return;
    }
    
    //  La cella è già occupata da una pedina dello stesso colore. Non si procede    
    if(cell.pawn?.color === pawn.color){
        pawn.setMoveability( {message : `Non puoi spostare pedina in una casella già occupata da una pedina dello stesso colore.`});
        return;
    }

    //  La cella è occupata da una pedina avversaria
    if(cell.pawn?.color) {

        //  Due (o più) pedine avversarie formano un muro che le rende inattaccabili
        if(cell.prev()?.pawn?.color === cell.pawn.color || cell.next()?.pawn?.color === cell.pawn.color){            
            pawn.setMoveability( {message : `Due o più pedine nella casella di destinazione formano un muro che le rende inattaccabili.`});
            return;
        }
    }

    // Nessuna Eccezione (Casella Vuota)

    pawn.setMoveability( {moveable : true , cell : cell });

}

//  Sposta la pedina

function movePawn(pawn , cell){

    const pownMovements = [{pawn : pawn , cell : cell}];

    console.log(`Devo Spostare la pedina ${pawn.index} dalla casella ${pawn.cell?.index} alla casella ${cell.index}`);
        
    //  Se sulla cella di destinazione è presente una pedina avversaria binsoga scambiarle
    if(cell.pawn)   pownMovements.push({pawn : cell.pawn , cell : pawn.cell}) ;

    pownMovements.forEach(mov => {  animatePawn(mov.pawn , mov.cell); }); // animazione pedine

    setTimeout(() => {
        pownMovements.forEach(mov => {  mov.pawn.el.style = ''; });
        pownMovements.forEach(mov => {  removePawn(mov.pawn); });
        pownMovements.forEach(mov => {  addPawn(mov.pawn , mov.cell); });
    }, 1000);

}

//  Rimuove Pedina

function removePawn(pawn){    

    pawn.cell.empty();
    pawn.el.remove();        
               
}

//  Aggiunge Pedina

function addPawn(pawn , cell){
    
    pawn.cell = cell;
    cell.pawn = pawn;
    cell.el.appendChild(pawn.el);

    pawns.forEach( pawn => {    // Questo foreach deve trovare una migliore collocazione
        pawn.setMoveability( {moveable : false});
    } );

}


//  Gestisce l'animazione della pedina durante lo spostamento

function animatePawn(pawn , cell) {
    
    let backward = false;
        
    let currentCell = pawn.cell.index;  // indice cella di partenza
    let targetCell =  cell.index;       // indice cella di arrivo
    
    // Se la pedina si deve spostare all'indietro
    if(currentCell > targetCell) {
        backward = true;
        // Scambio cella di partenza e cella di arrivo (effettuerò i calcoli come se la pedina si spostasse normalmente in avanti ed alla fine invertirò il risultato)
        [currentCell , targetCell] = [targetCell , currentCell];    
    }

    let currentRow = Math.trunc(currentCell / 10);  //  Riga di partenza
    let targetRow  = Math.trunc(targetCell / 10);   //  Riga di arrivo

    let yOffsetCells = targetRow - currentRow;    // celle di differenza in verticale

    let cellsToRowEnd = (9 + (10 * currentRow) - currentCell );                         // celle mancanti da quella di partenza alla fine del row
    let cellsOnNewRow = (targetCell - currentCell) - cellsToRowEnd - yOffsetCells;      // numero di celle da coprire sul row successivo (si sottrae yOffsetCells perché l'eventuale cambio di raw corrisponde di per sé ad un passo)


    let xOffsetCells = targetRow === currentRow ? targetCell - currentCell : cellsOnNewRow -  cellsToRowEnd;    // numero di celle di differenza sull'asse x

    if(backward) {
        //  Se la pedina si stava muovendo all'indietro, inverto il risultato
        xOffsetCells*= -1;
        yOffsetCells*= -1;
    }

    let xOffsetPerc = xOffsetCells * 100 + (targetRow === 1 ? - 50 : 50);   // calcola la percentuale di spostamento dell'elemento, ossia il valore della proprietà left: nello style inline. Si aggiunge (o si sottrae se nel raw centrale) il 50% perchè era il valore di partenza)
    let yOffsetPerc = yOffsetCells * 100 + 50;  // percentuale di spostamento in verticare da assegnare a top: nello style inline

    if(targetRow === 1) xOffsetPerc*= -1;   // se il row di destinazione è quello centrale, sul quale ci si muove al contrario, imverto il valore


    console.log(`la pedina deve spostarsi di ${xOffsetCells} caselle (del ${xOffsetPerc}%) in orizzontale e di ${yOffsetCells} caselle (del ${yOffsetPerc}%)  in verticale`);

    pawn.el.style = `transition: all 1s; left: ${xOffsetPerc}%; top: ${yOffsetPerc}%`;  // assegnazione finale dello style

}



//  Nuovo turno

function newRound(){

    //  Se è uscito un 2 o un 3 si cambia giocatore 
    if(currentScore === 2 || currentScore === 3){
        // questo if si trova qui momentaneamente
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    }

    console.log(`È il turno di ${currentPlayer}`);

    currentScore = getRandom(1 , 5);

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

//  Stampa messaggi di gioco

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