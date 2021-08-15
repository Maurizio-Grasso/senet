'use strict';

const elConsole = document.querySelector('.console');

const elArr = [];

for(let i = 0; i < 10; i++) {
    let newItem = document.createElement('div');
    newItem.innerHTML = i;
    elArr.push({el : newItem});
}

console.log(elArr);

for(let i = 0; i<10; i++){
    elConsole.appendChild(elArr[i].el);
}

elArr[5].el.remove();
