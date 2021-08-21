'use strict'

//  Elements

const elSticks      = document.querySelector('.stick__container'); 
const elConsoleBox  = document.querySelector('.console');
const elBoardBox    = document.querySelector('.board');

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

            prev()  { return cells[this.index - 1 ] ?? null; } ,
            next()  { return cells[this.index + 1 ] ?? null; } ,            
            empty() { this.pawn = null; } ,

        });
    });

    cellObj.push({ index : 30});    // Cella finale invisibile: quando una pedina la raggiunge esce dal gioco.
    
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
        el.innerHTML=index;     // debug

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

/*
//
//  Funzioni allo spostamento
//  delle pedine
//
*/


//  Controlla se una pedina può essere spostata in base alla sua posizione ed al lancio

function checkIfMoveable(pawn , cell){
    
    
    //  È il turno dell'avversario
    if(pawn.color !== currentPlayer){
        pawn.setMoveability( {message : `Non puoi muovere questa pedina: è il turno di ${currentPlayer}.`});
        return;
    }

    //  La cella di destinazione è successiva alla 25 
    if(cell?.index > 25 || !cell) {

        //  la pedina non si trova sulla casella 25, quindi non può superarla
        if(pawn.cell.index < 25){
            pawn.setMoveability( {message : `Non puoi superare la casella 26 senza prima stazionarci.`});
            return;
        }

        if( !cell || (pawn.cell.index > 25 && cell.index !== 30)) {
            pawn.setMoveability( {message : `Per completare il gioco hai adesso bisogno di un tiro esatto da ${30 - pawn.cell.index}.`});
            return;
        }

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

    // Nessuna Eccezione (Casella raggiungibile)

    pawn.setMoveability( {moveable : true , cell : cell });

}


//  Sposta la pedina

function movePawn(pawn , cell){

    //  rimuove mobilità da tutti i pawn (qui so già quale/i si muoverà/anno)
    pawns.forEach( pawn => pawn.setMoveability( {moveable : false}) );

    const pownMovements = [{pawn : pawn , cell : cell}];

    console.log(`Devo Spostare la pedina ${pawn.index} dalla casella ${pawn.cell?.index} alla casella ${cell.index}`);
        
    //  Se sulla cella di destinazione è già presente una pedina avversaria
    if(cell.pawn) {
        
        //  In questo caso le pedine vanno scambiate. Se la casella è precendete alla 26 le pedine prendono semplicemente il posto l'una dell'altra
        //  Se invece la pendina viene raggiunta su una delle ultime 3 celle finirà sulla cella 26 (dalla quale in seguito sarà automaticamente trasferita alla 14)
        pownMovements.push({pawn : cell.pawn , cell : cell.index > 25? cells[26] : pawn.cell });
    }
        
    pownMovements.forEach(mov => {  animatePawn(mov.pawn , mov.cell); }); // animazione pedina/e
    
    //  Le operazioni partiranno con un secondo di ritardo per consentire all'animazione CSS di concludersi
    setTimeout(() => {
                
        //  Se la pedina deve uscire dal gioco
        if(cell.index === 30 ) {          
            pawnOut(pawn);
        }   else {
            pownMovements.forEach(mov => {  mov.pawn.el.style = ''; });
            pownMovements.forEach(mov => {  removePawn(mov.pawn); });
            pownMovements.forEach(mov => {  addPawn(mov.pawn , mov.cell); });
        }

    }, 1000);

}


//  Rimuove Pedina da una cella

function removePawn(pawn){    
    pawn.cell.empty();
    pawn.el.remove();        
}


//  Aggiunge Pedina ad una cella

function addPawn(pawn , cell){
    
    pawn.cell = cell;
    cell.pawn = pawn;
    cell.el.appendChild(pawn.el);

    //  Se la pedina finisce sulla cella 26 (acqua)
    if(cell.index === 26) {
        setTimeout(() => {pawnRebirth(pawn);}, 50);
    }
}


//  Azioni da compiere quando una pedina raggiunge la casella 30 (ed esce quindi dal gioco)

function pawnOut(pawn){

    let color = pawn.color;

    removePawn(pawn);

    pawns.splice(pawn.index , 1);                   // rimozione della pedina dall'array
    pawns.forEach((pawn , i) => pawn.index = i);    // Riassegna index a tutte le pedine (soluzione momentanea)
    
    if(pawns.some(pawn => pawn.color === color) ) return;   // Se ci sono ancora pedine dello stesso colore si continua
    
    gameOver(color);    // altrimenti il gioco finisce
}


// Operazioni da compiere quando una pedina finisce sulla cella 26

function pawnRebirth(pawn) {
    
    let rebirtCell = cells[14]; // casa della rinascita di base

    while(rebirtCell.pawn)  rebirtCell = rebirtCell.prev(); // se la casella è occupata la pedina dovrà essere spostata sulla prima casella libera precedente

    movePawn(pawn , rebirtCell);

}


//  Animazione della pedina durante lo spostamento

function animatePawn(pawn , cell) {
    
    let backward = false;
    let gameOver = false;

    // Se la cella di destinazione è la 30 (che non esiste, ma indica l'uscita della pedina dal gioco)
    if(cell.index === 30) {
        gameOver = true;
        //  Effettuo tutti i calcoli come se la pedina si dovesse spostare verso l'ultima casella esistente (29). Alla fine modificherò l'animazione di conseguenza
        cell = cells[29];
    }
        
    let currentCell = pawn.cell.index;  // indice cella di partenza
    let targetCell =  cell.index;       // indice cella di arrivo
    
    // Se la pedina si deve spostare all'indietro
    if(currentCell > targetCell) {
        backward = true;
        // Scambio cella di partenza e cella di arrivo effettuando i calcoli come se la pedina si spostasse normalmente in avanti. Alla fine invertirò il risultato
        [currentCell , targetCell] = [targetCell , currentCell];    
    }

    let currentRow = Math.trunc(currentCell / 10);  //  Row di partenza
    let targetRow  = Math.trunc(targetCell / 10);   //  Row di destinazione

    let yOffsetCells = targetRow - currentRow;    // celle di differenza in verticale (0 se sullo stesso row / 1 se si cambia row)

    //  Calcolo dell'offset sull'asse delle x. Il numero di celle di differenza è dato da (targetCell - currentCell). 
    //  Nel caso di un cambiamento di row ci serve però sapere di quante celle avanzerà la pedina sul row successivo e di quante su quello di partenza

    let cellsToRowEnd = (9 + (10 * currentRow) - currentCell );                         // distanza (misurata in caselle) fra la casella di partenza e l'ultima dello stesso row
    let cellsOnNewRow = (targetCell - currentCell) - cellsToRowEnd - yOffsetCells;      // numero di celle da coprire sul row successivo (si sottrae yOffsetCells perché l'eventuale cambio di raw corrisponde di per sé ad un movimento)

    let xOffsetCells = targetRow === currentRow ? targetCell - currentCell : cellsOnNewRow -  cellsToRowEnd;    // numero di celle di differenza sull'asse x

    //  Se la pedina si stava muovendo all'indietro
    if(backward) {
        //  Posso a questo punto invertire i risultati
        xOffsetCells*= -1;
        yOffsetCells*= -1;
    }

    //  Nel DOM, le pedine sono elementi con 'position: absolute' ancorati alle celle. In partenza, presentano 50% come valore di left e top (ciò, associato al 'transform: translate', le centra rispetto alla casella)
    //  Ogni incremento di +100% di left o top le sposterà esattamente di una casella verso destra o verso il basso.
    //  L'effettivo valore da assegnare a left e top sarà quindi, a questo punto, 100 * xOffsetCells e 100 * yOffsetCells +/- 50% di partenza.

    let xOffsetPerc = xOffsetCells * 100 + (targetRow === 1 ? - 50 : 50);   // percentuale di spostamento orizzontale (left). Si aggiunge (o sottrae se nel raw centrale) il 50% di partenza.
    let yOffsetPerc = yOffsetCells * 100 + 50;                              // percentuale di spostamento in verticare da assegnare a top: nello style inline 
    
    if(targetRow === 1) xOffsetPerc*= -1;   // se il row di destinazione è quello centrale, sul quale ci si muove al contrario, imverto il valore
    
    console.log(`la pedina deve spostarsi di ${xOffsetCells} caselle (del ${xOffsetPerc}%) in orizzontale e di ${yOffsetCells} caselle (del ${yOffsetPerc}%)  in verticale`);
    
    pawn.el.style = `transition: all 1s; left: ${xOffsetPerc}%; top: ${yOffsetPerc}%; opacity: ${gameOver ? '0' : '1'};`;  // assegnazione finale dello style (solo spostamento o spostamento e scomparsa)
    
}

/*
***
***     Funzioni relative
***     al ciclo di gioco
***
*/

flipSticks();


//  Muove i 4 bastoncini per generare (casualmente) un punteggio

function flipSticks() {

    /*
    riorganizza tutto come dio comanda (ovvero in funzioni...)
    */
    let points = [];

    for (let i = 0; i < 4; i++){
        
        const elBlack = document.querySelector(`.stick__single--${i} > .stick__single__side--black`);
        const elWhite = document.querySelector(`.stick__single--${i} > .stick__single__side--white`);

        function newFlip(){

            elBlack.style.animation = `none`;
            elWhite.style.animation = `none`;

            n--;

            setTimeout(() => {  // 1000 + 10

                elBlack.style.animation = `flip-sticks-black 1s forwards 1 linear`;
                elWhite.style.animation = `flip-sticks-white 1s forwards 1 linear`;

                setTimeout(() => {

                    if(n)   newFlip();
                    else    getSticksPoints(n % 2);

                },1000 + 10);

            },10);

        }

        let n = getRandom(1,4);

        newFlip();

    }

    function getSticksPoints(point){
        
        points.push(point);

        if(points.length ===  4){
            console.log(`hai totalizzato ${points.reduce( (acc , point) => acc + point  , 0)} punti`);
        }
    }    

    newRound();
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

    pawns.forEach( pawn =>  checkIfMoveable(pawn , cells[pawn.cell.index + currentScore] || null) );    // se la casella di destinazione non esiste (> 29) passa null

    if (!pawns.some( pawn => pawn.isMoveable)) {
        showMessage(`ATTENZIONE: NON CI SONO MOSSE DISPONIBILI!`);
    };

}




//  Operazioni da compiere alla conclusione del gioco (quando un giocatore fa uscire tutte le sue pedine dalla scacchiera)

function gameOver(winner){
    alert(`Gioco finito. Vince ${winner}`);
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


elSticks.addEventListener('click' , flipSticks);
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