'use strict'

//  Elements

const elSticks      = document.querySelector('.stick__container'); 
const elConsoleBox  = document.querySelector('.console__inner');
const elBoardBox    = document.querySelector('.board');

let cells;              // Array che conterrà tutte le celle
let pawns = [];         // Array che conterrà tutte le pedine

let currentPlayer = 'white';
let currentScore;

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
    createPawns(7);
    newRound();
} 


//  Crea le 30 celle che compongono la scacchiera e restituisce un array che le contiene tutte


function createCells() {

    // Per ogni cella esiste un oggetto e tutti gli oggetti saranno elementi di un array

    class Cell {
        constructor(index){
            this.index = index;
        }

        get prev() { return cells[this.index - 1 ] ?? null; }
        get next() { return cells[this.index + 1 ] ?? null; }
        
        empty() { 
            this.pawn = null;
        }

    }

    const cellObj = [];

    for(let i = 0; i < 30; i++) {
        cellObj.push(new Cell(i));
    }
    
    // Creazione di tutte le caselle nel DOM

    cellObj.forEach( (cell , i) => {
        
        let el = document.createElement('div');
        el.classList.add(`cell` , `cell--${i}` , `cell--${i % 2 === 0 ? 'black' : 'white'}`);
        
        cell.el = el;   // aggiunge elemento all'oggetto cella

        if(i < 10 || i >= 20)   elBoardBox.appendChild(el);
        // Nella fila centrale le caselle devono essere invertite
        else    document.querySelector('.cell--9').insertAdjacentElement('afterend' , el);
        
    });

    cellObj.push({ index : 30});    // Casella finale invisibile: le pedine che la raggiungono escono dal gioco
    
    return(cellObj);

}

//  Crea pedine all'inizio del gioco (pawnsN == numero di pedine per ogni giocatore)

function createPawns(pawnsN = 7) {

    class Pawn {
        constructor(color , index){

            const el = document.createElement('div');
            el.classList.add(`pawn` , `pawn--${color}` , `pawn--${index}`);            

            this.index = index;
            this.color = color;
            this.el    = el;

            addPawn(this , cells[index]);

        }

        setMoveability( {moveable = false, msg = 'Non puoi muovere questa pedina adesso'} ) {

            this.isMoveable = moveable;
            
            if(moveable) {
                this.el.classList.add('pawn--moveable');
                this.msg = '';
                return;
            }

            this.el.classList.remove('pawn--moveable');
            this.msg = msg;
            
        }
    }

    for(let i = 0; i < pawnsN; i++) {

        pawns.push( new Pawn('white' , i * 2) );
        pawns.push( new Pawn('black' , i * 2 + 1) );

    };

}


/*
//
//  Funzioni relative allo 
//  spostamento
//  delle pedine
//
*/


//  Al click sulla scacchiera...

elBoardBox.addEventListener('click' , function(e) {

    //  Se il click NON avviene su una pedina
    if(!e.target.classList.contains('pawn')) return;
    
    //  Ricavo oggetto pedina corrispondente
    const clickedPawn = pawns.find( pawn => pawn.el === e.target);

    //  Se la pedina selezionata può muoversi
    if(clickedPawn.isMoveable){
        const targetCell = cells[clickedPawn.cell.index + currentScore]
        selectPawn(clickedPawn , targetCell); // sposta pedina
    } 
    //  Se la pedina non può muoversi
    else showMessage(clickedPawn.msg);       // mostra errore
    
});


//  Controlla se una pedina può essere spostata in base alla sua posizione ed al lancio

function checkIfMoveable(pawn , cell){
        
    //  È il turno dell'avversario
    if(pawn.color !== currentPlayer){
        pawn.setMoveability( {msg : `Non puoi muovere questa pedina: è il turno di ${currentPlayer}.`});
        return;
    }

    //  La cella di destinazione è successiva alla 25 
    if(cell?.index > 25 || !cell) {

        //  la pedina non si trova sulla casella 25, quindi non può superarla
        if(pawn.cell.index < 25){
            pawn.setMoveability( {msg : `Non puoi superare la casella 26 senza prima stazionarci.`});
            return;
        }

        if( !cell || (pawn.cell.index > 25 && cell.index !== 30)) {
            pawn.setMoveability( {msg : `Per completare il gioco hai adesso bisogno di un tiro esatto da ${30 - pawn.cell.index}.`});
            return;
        }

    }
    
    //  La cella è già occupata da una pedina dello stesso colore. Non si procede
    if(cell.pawn?.color === pawn.color){
        pawn.setMoveability( {msg : `Non puoi spostare pedina in una casella già occupata da una pedina dello stesso colore.`});
        return;
    }

    //  La cella è occupata da una pedina avversaria
    if(cell.pawn?.color) {

        //  Due (o più) pedine avversarie formano un muro che le rende inattaccabili (regola valida solo prima della casella 25)
        if(cell.index <= 25 && (cell.prevpawn?.color === cell.pawn.color || cell.next?.pawn?.color === cell.pawn.color)){            
            pawn.setMoveability( {msg : `Due o più pedine nella casella di destinazione formano un muro che le rende inattaccabili.`});
            return;
        }
    }

    // Nessuna Eccezione (Casella raggiungibile)

    pawn.setMoveability( {moveable : true , cell : cell });

}

//  Operazioni preliminare da eseguire quando una pedina viene selezionata per lo spostamento

function selectPawn(pawn , cell){

    //  rimuove mobilità da tutti i pawn (qui sappiamo già quale/i si muoverà/anno)
    pawns.forEach( pawn => pawn.setMoveability( {moveable : false}) );

    console.log(`Bisogna spostare la pedina ${pawn.index} dalla casella ${pawn.cell?.index} alla casella ${cell.index}`);

    //  Le pedine da spostare possono essere 1 o 2 (in caso di scambio). Creo un oggetto 'spostamento' con proprietà pawn e cell e lo inserisco in un array. In seguito potrò eventualmente pushare un secondo oggetto.
    const pawnsToMove = [ { pawn : pawn , cell : cell } ];

    //  Se sulla cella di destinazione è già presente una pedina avversaria    
    if(cell.pawn) {

        //  In questo caso le pedine vanno scambiate. Se la casella è precendete alla 26 le pedine prendono semplicemente il posto l'una dell'altra
        //  Se invece la pendina viene raggiunta su una delle ultime 3 celle finirà sulla cella 26 (dalla quale in seguito sarà automaticamente trasferita alla 14)
        //  Pusho un secondo oggetto contenente queste informazioni nell'array degli spostamenti     
        pawnsToMove.push( { pawn : cell.pawn , cell : cell.index > 25 ? cells[26] : pawn.cell } );
        
    }
    
    movePawns(pawnsToMove);
   
    newRound();
    
}
    
function movePawns(pawnsToMove){
    
    pawnsToMove.forEach( mov => animatePawn(mov.pawn , mov.cell) ); // animazione pedina/e
    
    //  Le operazioni partono con un secondo di ritardo per consentire all'animazione CSS di concludersi
    setTimeout(() => {        
        
        pawnsToMove.forEach( mov => mov.pawn.el.style = '' );               // resetta stile
    
        if(pawnsToMove[0].cell.index === 30) pawnOut(pawnsToMove[0].pawn);  // la pedina esce dal gioco
        
        else {
            pawnsToMove.forEach( mov => mov.pawn.cell.empty() );             // rimuove pedina/e da oggetto cella
            pawnsToMove.forEach( mov => addPawn(mov.pawn , mov.cell) );     // ricrea pedina/e
        }
        
    }, 1000);
    
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

    pawn.el.remove();
    pawn.cell.empty();

    pawns.splice(pawn.index , 1);                   // rimozione della pedina dall'array
    pawns.forEach((pawn , i) => pawn.index = i);    // Riassegna index a tutte le pedine (soluzione momentanea)
    
    if(pawns.some(pawn => pawn.color === color) ) return;   // Se ci sono ancora pedine dello stesso colore si continua
    
    gameOver(color);    // altrimenti il gioco finisce
}


// Operazioni da compiere quando una pedina finisce sulla cella 26

function pawnRebirth(pawn) {
    
    let rebirtCell = cells[14]; // casa della rinascita di base

    while(rebirtCell.pawn)  rebirtCell = rebirtCell.prev; // se la casella è occupata la pedina dovrà essere spostata sulla prima casella libera precedente

    selectPawn(pawn , rebirtCell);  // !!! qui dovrebbe richiamare direttamente movePawns !!!

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
    
    setTimeout(() => {        
        pawn.el.style = `transition: all 1s; ${backward ? '' : 'z-index: 100;'} left: ${xOffsetPerc}%; top: ${yOffsetPerc}%; opacity: ${gameOver ? '0' : '1'};`;  // assegnazione finale dello style (solo spostamento o spostamento e scomparsa)
    }, 20);
    
}

/*
***
***     Funzioni relative
***     al ciclo di gioco
***
*/


// Riporta tutti i bastoncini alla posizione iniziale (mostrano lato bianco)

function resetSticks(){
    Array.from(document.querySelectorAll('.stick__single__side--black')).forEach(el => el.style.transform = `rotateY(-180deg)`);
    Array.from(document.querySelectorAll('.stick__single__side--white')).forEach(el => el.style.transform = `rotateY(0deg)`);
}


//  Muove i 4 bastoncini per generare (casualmente) un punteggio

function flipSticks() {

    elSticks.removeEventListener('click' , flipSticks);
    
    let sticksPoints = [];

    for (let i = 0; i < 4; i++){
        
        const elBlack = document.querySelector(`.stick__single--${i} > .stick__single__side--black`);
        const elWhite = document.querySelector(`.stick__single--${i} > .stick__single__side--white`);
                            
        let n = getRandom(3,4); // numero casuale di rotazioni per ciascun bastoncino
        
        // numero di rotazioni dispari  === bastoncino nero   === 0 punti
        // numero di rotazioni pari     === bastoncino bianco === 1 punto

        let points = 1;
        
        if (n % 2 !== 0) {
            n--;
            points = 0;
        }

        let speed = 0.5;   // velocità per ogni animazione (in secondi)

        const delay = i / 10 * 1000;    // ogni bastoncino inizierà l'animazione con un lieve ritardo (delay) rispetto a quello precedente

        setTimeout(() => {  // delay
                        
            elBlack.style.animation = `flip-sticks-black ${speed}s forwards ${n} linear`;
            elWhite.style.animation = `flip-sticks-white ${speed}s forwards ${n} linear`;
            
            // quando il bastoncino terminerà l'animazione
            setTimeout(() => {  // 1000 * speed * n
                
                elBlack.style.animation = `none`;
                elWhite.style.animation = `none`;
                
                setTimeout(() => {
                    
                    if(points === 0) {
                        
                        elWhite.style.transition = `all ${speed}s ease-out`;
                        elBlack.style.transition = `all ${speed}s ease-out`;
                        
                        setTimeout(() => {
                            
                            elWhite.style.transform = `rotateY(180deg)`;
                            elBlack.style.transform = `rotateY(0deg)`;
                            
                        }, 50);
                        
                    }

                    setTimeout(() => {
                        calculateScore(points);
                    }, speed);
                    
                    
                }, 10);
                
            },1000 * speed * n);                
        }, delay);
    }


    //  Calcola il punteggio come somma dei risultati dei singoli bastoncini

    function calculateScore(point){
        
        sticksPoints.push(point);

        if(sticksPoints.length ===  4){
            
            currentScore = sticksPoints.reduce( (acc , point) => acc + point  , 0);

            if (currentScore === 0) currentScore = 5;
            
            console.log(`Hai totalizzato ${currentScore} punti`);
            checkScore(currentScore);
        }
    }    
}


//  In base al punteggio ottenuto dall'ultimo lancio, stabilisce quali operazioni compiere

function checkScore(score){
    
    showMessage(`È uscito ${score}${score !== 2 && score !== 3 ? '. Hai diritto ad un turno extra!' : '.'}`);
    
    //  Controlla quali pedine possono spostarsi in base al punteggio corrente
    pawns.forEach( pawn =>  checkIfMoveable(pawn , cells[pawn.cell.index + score] || null) );    // se la casella di destinazione non esiste (> 29) passa null
    
    //  Se non ci sono mosse disponibili stampa errore e passa al turno successivo
    if (!pawns.some( pawn => pawn.isMoveable)) {
        showMessage(`Nessuna pedina può spostarsi di ${score} caselle. Si passa al turno successivo.`);
        newRound();
        return;
    }
}

//  Prepara il turno successivo

function newRound(){

    resetSticks();

    // Se è uscito 2 o 3 si cambia giocatore
    if(currentScore === 2 || currentScore === 3)  changePlayer();
    
    // riattiva bastoncini
    elSticks.addEventListener('click' , flipSticks);
      
    showMessage(`È il turno di ${currentPlayer}. Ruota i bastoncini!`);
}

function changePlayer(){
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
}

//  Operazioni da compiere alla conclusione del gioco (quando un giocatore fa uscire tutte le sue pedine dalla scacchiera)

function gameOver(winner){
    showMessage(`Gioco finito. Ha vinto ${winner}!`);
}


//  Stampa messaggi di gioco

function showMessage(newMsg) {

    const now = new Date();

    let msg = document.createElement('p');
    msg.textContent = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - ${newMsg}`;
    msg.classList.add('console__msg');
    
    elConsoleBox.insertAdjacentElement('afterbegin' , msg);

    setTimeout( function(){
        elConsoleBox.children[1]?.remove();
    } , 10000);

}

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