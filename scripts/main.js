'use strict';
function randomize(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Морской бой !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Описание типов и переменных
function Ship(shipname, decksNum, orientation) {
  this.case = document.getElementById(shipname);
  this.decksNum = decksNum;
  this.decks = [];
  this.orientation = orientation || "vertical";
  this.isPlased = false;
  this.start = {
    parent: this.case.parentNode,
    nextSibling: this.case.nextSibling,
    position: this.case.position || "",
    left: this.case.left || "",
    top: this.case.top || "",
    zIndex: this.case.zIndex || ""
  };
}

//  var dragObject = {}; // Запоминает позицию переносимого объекта
var pcRandomAttackCount = 0;
var lastDamagedShipCoords = undefined;;
var lastDamagedShipDecks = [];
var playerLinkors = 1;
var playerCruisers = 2;
var playerDestroyers = 3;
var playerBoars = 4;
var pcShipsForPlase = 10;
var p1ShipsForPlase = 10;
var pcShipsInFight = 10;
var p1ShipsInFight = 10;
var p1Turn;

let infoBox = document.getElementById("gameEndInformer");
let ifoMsg = document.getElementById("endMessage");

Ship.prototype = {
  createDecks: function (decksNum) {
    for (var i = 0; i < this.decksNum; i++) {
      this.decks[i] = {
        cell: undefined,
        isDamaged: false
      };
    }
  },
  rollBack: function () {
    this.start.parent.insertBefore(this.case, this.start.nextSibling);
    this.case.style.position = this.start.position;
    this.case.style.left = this.start.left;
    this.case.style.top = this.start.top;
    this.case.style.zIndex = this.start.zIndex;
  }
};

var phase = 0; // 0 - iniciation, 1 - gaming

const gameStartButt = document.getElementById("gameStartButt");
const gameEndButt = document.getElementById("gameEndButt");

gameStartButt.onclick = function () {
  reInitializeGame();
};

gameEndButt.onclick = function () {

};

// Отрисовка полей
const seaFightP1 = document.getElementById("seaFightP1");
const seaFightP2 = document.getElementById("seaFightP2");
const seaFightGamefield = document.getElementById("seaFightGamefield");

var table1 = document.createElement("table");
var table2 = document.createElement("table");

table1.id = "sfP1";
table1.className = "sf_gamefield";
seaFightP1.appendChild(table1);
var sfP1Arr = [];

table2.id = "sfP2";
table2.className = "sf_gamefield";
seaFightP2.appendChild(table2);
var sfP2Arr = [];

function createField(currentField, fieldArr) {
  if (currentField.id === "sfP1") {
    var idid = "p1";
  } else if (currentField.id === "sfP2") {
    var idid = "p2";
  }
  for (var i = 0; i < 10; i++) {
    var line = document.createElement("div");
    line.className = "line";
    let currentRow = line;
    currentField.appendChild(line);
    fieldArr[i] = [];

    for (var j = 0; j < 10; j++) {
      var column = document.createElement("div");
      column.id = idid + "_cell_" + i + j;
      column.className = "sf_cell";

      var cr = currentRow.appendChild(column);
      fieldArr[i][j] = [[], {}];
      fieldArr[i][j][0] = cr;
      fieldArr[i][j][1].decks = null;
      fieldArr[i][j][1].ship = false;
    }
  }
}

var gameField = document.getElementById("seaFightLogickalField");
gameField.oncontextmenu = function (event) {
  event.preventDefault();
};


//Корабли игрока

var fleet = {};
fleet.Arabella = new Ship("Arabella", 4);
fleet.QueenAnnesRevenge = new Ship("QueenAnnesRevenge", 3);
fleet.AdventureGalley = new Ship("AdventureGalley", 3);
fleet.Whydah = new Ship("Whydah", 2);
fleet.RoyalFortune = new Ship("RoyalFortune", 2);
fleet.Fancy = new Ship("Fancy", 2);
fleet.HappyDelivery = new Ship("HappyDelivery", 1);
fleet.RisingSun = new Ship("RisingSun", 1);
fleet.Speaker = new Ship("Speaker", 1);
fleet.Revenge = new Ship("Revenge", 1);

for (var kay in fleet) {
  fleet[kay].createDecks();
}

var movedShip;

//Корабли компьютера
//    placePcShips();

// Реализация отслеживания и определения места клика
// Функция отслеживания курсора мыщки и вешаем листенер отслеживания мышки
function cursoreCoords(event) {
  event = event || window.event;
  let hoverCell;
  let coordX;
  let coordY;
  hoverCell = event.target.id;
  coordX = event.pageX;
  coordY = event.pageY;
//    console.log( hoverCell+ " hovered" + " " + coordX + " " + coordY );
  return hoverCell;
}

function initMouseHoverListener( field ) {
  var hoveredCell = document.getElementById( field );
  if (hoveredCell.addEventListener) {                    // For all major browsers, except IE 8 and earlier
    hoveredCell.addEventListener("mousemove", cursoreCoords);
  } else if (hoveredCell.attachEvent) {                  // For IE 8 and earlier versions
    hoveredCell.attachEvent("onmousemove", cursoreCoords);
  }
}

//function removeMouseHoverListener( field ) {
//  var hoveredCell = document.getElementById( field );
//  if (hoveredCell.removeEventListener) {                    // For all major browsers, except IE 8 and earlier
//    hoveredCell.removeEventListener("mousemove", cursoreCoords);
//  } else if (hoveredCell.detachEvent) {                  // For IE 8 and earlier versions
//    hoveredCell.detachEvent("onmousemove", cursoreCoords);
//  }
//}

function findCell(event, clickedCell, arrCellDirectly) {
//  movedShip.style.pointerEvents = "none";
  movedShip.hidden = true;
  var elem = arrCellDirectly || (document.elementFromPoint(event.clientX, event.clientY));
  movedShip.hidden = false;
//  movedShip.style.pointerEvents = "auto";

  if (elem === null) {
    return;
  }

  var sttr = elem.closest(".sf_cell", "seaFightLogickalField");
  if (sttr === null) {
    fleet[ clickedCell ].rollBack();
    seaFightGamefield.onmousemove = null;
    return;
  }

  var sttr = sttr.id;
  return sttr;
}

// Расстановка кораблей на поле игрока
// Функция проверки дропа в клетку поля
function insertShip(event, sfPArr, currentFleet, clickedCell) {
  var arrCell = findCell(event, clickedCell);

  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {

      if (sfPArr[i] === undefined) {
        continue;
      }
      ;
      if (sfPArr[i][j][0].id === arrCell) {
        let shipLength = currentFleet[ clickedCell ].decksNum;

        if (currentFleet[ clickedCell ].orientation === "vertical" && (shipLength + j <= 10)) {
          if (!chackSea(i, j, shipLength)) {
            currentFleet[ clickedCell ].rollBack();
            seaFightGamefield.onmousemove = null;
            return;
          }
          ;
          for (let k = 0; k < shipLength; k++) {
            sfPArr[i][j][0].className = "sf_cell_with_ship";
            sfPArr[i][j][1].decks = 1;
            currentFleet[ clickedCell ].decks[k].cell = sfPArr[i][j][0];
            j++;
          }
          p1ShipsForPlase--;
          currentFleet[ clickedCell ].isPlased = true;
          currentFleet[ clickedCell ].case.className = currentFleet[ clickedCell ].case.className + " " + "plased";
        } else if (currentFleet[ clickedCell ].orientation === "horisontal" && (shipLength + i <= 10)) {
          if (!chackSea(i, j, shipLength)) {
            currentFleet[ clickedCell ].rollBack();
            seaFightGamefield.onmousemove = null;
            return false;
          }
          ;
          for (var k = 0; k < shipLength; k++) {
            sfPArr[i][j][0].className = "sf_cell_with_ship";
            sfPArr[i][j][1].decks = 1;
            currentFleet[ clickedCell ].decks[k].cell = sfPArr[i][j][0];
            i++;
          }
          p1ShipsForPlase--;
          currentFleet[ clickedCell ].isPlased = true;
          currentFleet[ clickedCell ].case.className = fleet[ clickedCell ].case.className + " " + "plased";
        }
      }
    }
    if (p1ShipsForPlase === 0) {
      document.getElementById("seaFightGameStart").innerHTML = "START GAME";
      document.getElementById("seaFightGameStart").disabled = false;
    }
  }
  // Функция проверки валидности(незанятости и удаленности) дропа в клетку поля
  function chackSea(i, j, shipLength) {
    let flag = true;
    if (currentFleet[ clickedCell ].orientation === "vertical") {
      for (var v = i - 1; v <= i + 1; v++) {
        for (var h = j - 1; h <= j + shipLength; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          if (sfPArr[v][h][1].decks === 1) {
            flag = false;
          }
        }
      }
      if (flag) {
        for (var v = i - 1; v <= i + 1; v++) {
          for (var h = j - 1; h <= j + shipLength; h++) {
            if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
              continue;
            }
            sfPArr[v][h][0].className = "sf_cell_disabled";
          }
        }
        return true;
      } else if (!flag) {
        currentFleet[ clickedCell ].rollBack();
        seaFightGamefield.onmousemove = null;
        return false;
      }
    } else if (currentFleet[ clickedCell ].orientation === "horisontal") {
      for (var v = i - 1; v <= i + shipLength; v++) {
        for (var h = j - 1; h <= j + 1; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          if (sfPArr[v][h][1].decks === 1) {
            flag = false;
          }
        }
      }
    }
    if (flag) {
      for (var v = i - 1; v <= i + shipLength; v++) {
        for (var h = j - 1; h <= j + 1; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          sfPArr[v][h][0].className = "sf_cell_disabled";
        }
      }
      return true;
    } else if (!flag) {
      currentFleet[ clickedCell ].rollBack();
      seaFightGamefield.onmousemove = null;
      return false;
    }
  }
  currentFleet[ clickedCell ].rollBack();
  seaFightGamefield.onmousemove = null;
  return false;
}

function pcAttacks() {
  let attackCell;
  attackCell = chouseTactics();

  return attackCell;

  function chouseTactics() {
    if (lastDamagedShipCoords !== undefined) {
      return destroyDamaged();
    } else if (pcRandomAttackCount <= 7) {
      return randomCellAttack();
    } else if (playerLinkors > 0) {
      return lookForShip(4);
    } else if (playerCruisers > 0) {
      return lookForShip(3);
    } else if (playerDestroyers > 0) {
      return lookForShip(2);
    }

    var chousenCell = randomCellAttack();
    return chousenCell;
  }

  function destroyDamaged() {
    let textCell = lastDamagedShipCoords.toString();
    let i = parseInt(textCell.slice(8, 9));
    let j = parseInt(textCell.slice(9, 10));
    var shift = 1;

    var variants = [];

    variants[0] = [i, j - shift, true];
    variants[1] = [i, j + shift, true];
    variants[2] = [i + shift, j, true];
    variants[3] = [i - shift, j, true];

    let mayShip = chackAround(i, j);
    return mayShip;

    function chackAround(i, j) {
      for (; shift <= 3; shift++) {
        variants[0][0] = i;
        variants[0][1] = j - shift;
        variants[1][0] = i;
        variants[1][1] = j + shift;
        variants[2][0] = i + shift;
        variants[2][1] = j;
        variants[3][0] = i - shift;
        variants[3][1] = j;
        var possibleShips = [];
        for (var vrl = 0; vrl < 4; vrl++) {
          let arg1 = variants[ vrl ][ 0 ];
          let arg2 = variants[ vrl ][ 1 ];
          let stoper = variants[ vrl ][2];

          if ((arg1 < 0 || arg2 < 0) || (arg1 > 9 || arg2 > 9)) {
            continue;
          }
          if (sfP1Arr[ arg1 ][ arg2][ 0 ].className === "empty_cell") {
            variants[ vrl ][2] = false;
          }
          if (variants[ vrl ][2] === false) {
            continue;
          }
          if (sfP1Arr[ arg1 ][ arg2][ 0 ].className === "destroyed_cell") {
            continue;
          }
          if ((sfP1Arr[ arg1 ][ arg2][ 0 ].className === "destroyed_cell")
              && (sfP1Arr[ arg1 ][ arg2][ 0 ].id === lastDamagedShipCoords)) {
            shift++;
            possibleShips = [];
            break;
          }
          if (variants[ vrl - 1 ] !== undefined) {
            variants[ vrl - 1 ][2] = false;
          }
          if (variants[ vrl + 1 ] !== undefined) {
            variants[ vrl + 1 ][2] = false;
          }
          possibleShips.push([sfP1Arr[ arg1 ][ arg2][ 0 ].id]);
        }
        if (possibleShips.length > 0) {
          var chack = randomize(0, possibleShips.length - 1);
          var chacked = possibleShips.splice(chack, 1);
          chacked = chacked.toString();
          return chacked;
        }
      }
      return false;
    }
  }

  function lookForShip(maxDecks) {
    let i = randomize(0, 9);
    let offsetI = randomize(0, 9);
    let isReverse = randomize(0, 1);

    if (isReverse === 0) {
      if (offsetI < i) {
        offsetI = 9;
      }
      for (i; i <= offsetI; i++) {
        for (let j = 0; j <= 9; j++) {

          if (sfP1Arr[i][j][0].className === "empty_cell"
              || sfP1Arr[i][j][0].className === "destroyed_cell") {
            var mayLinkor = guessLinkor(i, j);
            if (mayLinkor === undefined) {
              return randomCellAttack();
              continue;
            } else {
              var cellToAttack = mayLinkor;
              return cellToAttack;
            }
            console.log("guessed cell " + cellToAttack + " = " + sfP1Arr[i][j][0].id);
          }

        }
      }
      return cellToAttack;
    } else if (isReverse === 1) {
      if (offsetI >= i) {
        offsetI = 0;
      }
      for (i; i >= offsetI; i--) {
        for (let j = 9; j >= 0; j--) {
          if (sfP1Arr[i][j][0].className === "empty_cell"
              || sfP1Arr[i][j][0].className === "destroyed_cell") {
            var mayLinkor = guessLinkor(i, j);
            if (mayLinkor === undefined) {
              return randomCellAttack();
              continue;
            } else {
              var cellToAttack = mayLinkor;
              return cellToAttack;
            }
            console.log("guessed cell " + cellToAttack + " = " + sfP1Arr[i][j][0].id + "ЗДЕСЬ РАБОТАЕТ");
          }

        }
      }
      return cellToAttack;
    }

    function guessLinkor(i, j) {
      let variants = [];
      let counter = maxDecks;

      variants[0] = [i, j - maxDecks, true];
      variants[1] = [i, j + maxDecks, true];
      variants[2] = [i + maxDecks, j, true];
      variants[3] = [i - maxDecks, j, true];

      while (counter > 0) {
        var rnd = randomize(0, 3);
        if (variants[rnd][2] === false) {
          continue;
        }

        let iClone = variants[rnd][0];
        let jClone = variants[rnd][1];

        if ((iClone < 0) || (iClone > 9)) {
          variants[rnd][2] = false;
          counter--;
          continue;
        }
        if ((jClone < 0) || (jClone > 9)) {
          variants[rnd][2] = false;
          counter--;
          continue;
        }


        if (sfP1Arr[iClone][jClone][0].className === "empty_cell"
            || sfP1Arr[iClone][jClone][0].className === "destroyed_cell") {
          variants[rnd][2] = false;
          counter--;
          continue;
        }
        if (sfP1Arr[iClone][jClone][0].className !== "empty_cell"
            || sfP1Arr[iClone][jClone][0].className !== "destroyed_cell") {
          let guessedCell = "p1_cell_" + iClone + jClone;
          variants[rnd][2] = false;
          counter--;
          return guessedCell;
        }
      }
      return;
    }
  }

  function randomCellAttack() {
    let v = randomize(0, 9);
    let h = randomize(0, 9);
    let randomCell = "p1_cell_" + v + h;
    while (sfP1Arr[v][h][0].className === "empty_cell"
        || sfP1Arr[v][h][0].className === "destroyed_cell") {
      return randomCellAttack();
    }
    pcRandomAttackCount++;
    return randomCell;
  }
}

function markAround(lastDamagedShipDecks) {
  let shipLength = lastDamagedShipDecks.length;

  for (var cd = 0; cd < shipLength; cd++) {
    let currentDeck = lastDamagedShipDecks[ cd ].toString();
    let i = parseInt(currentDeck.slice(8, 9));
    let j = parseInt(currentDeck.slice(9, 10));

    for (let k = i - 1; k < i + 2; k++) {
      for (let l = j - 1; l < j + 2; l++) {
        if ((k < 0 || l < 0) || (k > 9 || l > 9)) {
          continue;
        }
        if (sfP1Arr[k][l][0].className === "sf_cell"
            || sfP1Arr[k][l][0].className === "sf_cell_disabled") {
          sfP1Arr[k][l][0].className = "empty_cell";
        }
      }
    }

  }

}

function allredyClicked(attackedCell, currentArr) {
  if ( currentArr === undefined ) {
    return false;
  }
  if ( phase === 0 ) {
    return false;
  }
  if ( attackedCell === undefined ) {
    return false;
  }
  let textCell = attackedCell.toString();
  let i = textCell.slice(8, 9);
  let j = textCell.slice(9, 10);
  if ((currentArr[i][j][0].className === "empty_cell")
      || (currentArr[i][j][0].className === "destroyed_cell")) {
    return true;
  }
  return false;
}

var rightMessage = document.getElementById("shipyardP1");
var leftMessage = document.getElementById("shipyardP2");

function findAndDestrooyShip(attackedCell, currentArr) {
  var newMessage1 = document.createElement("p");
  var newMessage2 = document.createElement("p");
  var newMessage3 = document.createElement("p");

  newMessage1.className = "message1_class";
  newMessage2.className = "message1_class";
  newMessage3.className = "message1_class";


  leftMessage.style.display = "block";
  leftMessage.style.overflow = "auto";
  rightMessage.style.display = "block";
  rightMessage.style.overflow = "auto";

  if (allredyClicked(attackedCell, currentArr)) {
    return;
  }

  var currentFleet;
  let fieldNumId = attackedCell.slice(1, 2);
  if (currentArr === sfP2Arr && fieldNumId === "2") {
    currentFleet = pcFleet;
  } else if (currentArr === sfP1Arr && fieldNumId === "1") {
    currentFleet = fleet;
  } else {
    return;
  }
  for (var key in currentFleet) {
    let decksNum = currentFleet[ key ].decksNum;
    for (var i = 0; i < decksNum; i++) {
      if (attackedCell === currentFleet[ key ].decks[i].cell.id) {
        var focusedShip = currentFleet[ key ];

        if (focusedShip.decks[ i ].isDamaged === false) {
          focusedShip.decks[ i ].isDamaged = true;
          if (currentFleet === pcFleet) {
            newMessage2.style.color = "#000000";
            newMessage2.innerHTML = "Попадание" + "\r\n";
          } else {
            newMessage2.style.color = "#330000";
            newMessage2.innerHTML = "Ваш корабль подбит" + "\r\n";
            if (lastDamagedShipCoords === undefined
                && currentFleet === fleet) {
              lastDamagedShipCoords = attackedCell;
            }
            if (lastDamagedShipCoords !== undefined
                && currentFleet === fleet) {
              lastDamagedShipDecks.push(attackedCell);
            }
          }

          if (shipDestoyed(focusedShip)) {
            if (currentFleet === pcFleet) {
              pcShipsInFight -= 1;
              if (pcShipsInFight > 4) {
                var message = "у противника осталось: " + pcShipsInFight
                    + " кораблей" + "\r\n";
              } else if (pcShipsInFight <= 4 && pcShipsInFight > 1) {
                var message = "у противника осталось: " + pcShipsInFight
                    + " корабля" + "\r\n";
              } else if (pcShipsInFight === 1) {
                var message = "у противника остался 1 корабль. " + "\r\n";
              } else {
                var message = "все корабли противника уничтожены: " + "\r\n";
                win();
              }
              var msgFirstPath = "Вы уничтожили ";
              newMessage3.style.color = "#000000";

            } else if (currentFleet === fleet) {
              p1ShipsInFight -= 1;
              markAround(lastDamagedShipDecks);
              lastDamagedShipDecks = [];
              lastDamagedShipCoords = undefined;
              ;
              if (p1ShipsInFight > 4) {
                var message = "у вас осталось: " + p1ShipsInFight
                    + " кораблей" + "\r\n";
              } else if (p1ShipsInFight <= 4 && p1ShipsInFight > 1) {
                var message = "у вас осталось: " + p1ShipsInFight
                    + " корабля" + "\r\n";
              } else if (p1ShipsInFight === 1) {
                var message = "у вас осталcz: " + p1ShipsInFight
                    + " корабль" + "\r\n";
              } else {
                var message = "все ваши корабли уничтожены." + "\r\n";
                gameOver();
              }
              newMessage3.style.color = "#330000";
              var msgFirstPath = "Противник уничтожил ваш ";
            }
            var damagedShipClass;
            switch (focusedShip.decksNum) {
              case 1:
                damagedShipClass = "Катер!";
                break;
              case 2:
                damagedShipClass = "Эсминец!";
                break;
              case 3:
                damagedShipClass = "Крейсер!";
                break;
              case 4:
                damagedShipClass = "Линкор!";
                break;
            }
            newMessage1.innerHTML = message;
            newMessage3.innerHTML = msgFirstPath + damagedShipClass + "\r\n";
          }

          var leftMessageField = getCoords("shipyardP2");
          var rihtMessageField = getCoords("shipyardP1");

          leftMessage.appendChild(newMessage2);
          leftMessageField = getCoords("shipyardP2");
          leftMessage.scrollTop += 75;

          rightMessage.appendChild(newMessage1);
          leftMessageField = getCoords("shipyardP2");
          rightMessage.scrollTop += 75;

          leftMessage.appendChild(newMessage3);
          rihtMessageField = getCoords("shipyardP1");
          leftMessage.scrollTop += 75;

        } else if (focusedShip.decks[ i ].isDamaged === true) {
          return;
        }
        focusedShip.decks[ i ].cell.className = "destroyed_cell";
      }
    }
  }
  markAsMiss(attackedCell);

  function markAsMiss(attackedCell) {
    let textCell = attackedCell.toString();
    let i = textCell.slice(8, 9);
    let j = textCell.slice(9, 10);
    if ((currentArr[i][j][0].className === "empty_cell")
        || (currentArr[i][j][0].className === "destroyed_cell")) {
      return;
    }
    currentArr[i][j][0].className = "empty_cell";
    return;
  }

  function shipDestoyed(focusedShip) {
    let shipLength = focusedShip.decksNum;
    for (var i = 0; i < shipLength; i++) {
      if (focusedShip.decks[i].isDamaged === false) {
        return false;
      }
    }
    return true;
  }
  p1Turn = !p1Turn;
}

function gameOver() {
  infoBox.style.display = "block";
  ifoMsg.innerHTML = "ВЫ ПРОИГРАЛИ";

  scrollPrevent();
}

function win() {
  infoBox.style.display = "block";
  ifoMsg.innerHTML = "ВЫ ПОБЕДИЛИ";

  scrollPrevent();
}

function scrollPrevent() {
  document.onmousewheel = document.onwheel = function () {
    return false;
  };
  document.addEventListener("MozMousePixelScroll", function () {
    return false;
  }, false);
  document.onkeydown = function (e) {
    if (e.keyCode >= 33 && e.keyCode <= 40)
      return false;
  };
}

function scrollEnable() {
  document.onmousewheel = document.onwheel = function () {
    return true;
  };
  document.addEventListener("MozMousePixelScroll", function () {
    return true;
  }, true);
  document.onkeydown = function (e) {
    if (e.keyCode >= 33 && e.keyCode <= 40)
      return true;
  };
}

// Функция определения ID клика и вешаем лисенер с функцией определения ID клика
function getCell(event) {
  event.preventDefault();
  let clickedCell;
  clickedCell = event.target.id;

  if (phase === 1) {
    if (p1Turn) {
      var clickedPlayerField = findAndDestrooyShip(clickedCell, sfP2Arr);
    }
    if (!p1Turn) {
      var clickedPlayerField = findAndDestrooyShip(pcAttacks(), sfP1Arr);
    }
  }

  //  console.log(clickedCell);
  //  console.log(fleet[ clickedCell ]);

  if (fleet[ clickedCell ] === undefined) {
    return;
  } else {
    movedShip = fleet[ clickedCell ].case;
  }

  var shipLeftClicked = ((clickedCell === "Arabella"
      || clickedCell === "QueenAnnesRevenge"
      || clickedCell === "AdventureGalley"
      || clickedCell === "Whydah"
      || clickedCell === "RoyalFortune"
      || clickedCell === "Fancy"
      || clickedCell === "HappyDelivery"
      || clickedCell === "RisingSun"
      || clickedCell === "Speaker"
      || clickedCell === "Revenge")
      && (phase === 0 && event.button === 0));

  var shipRightClicked = ((clickedCell === "Arabella"
      || clickedCell === "QueenAnnesRevenge"
      || clickedCell === "AdventureGalley"
      || clickedCell === "Whydah"
      || clickedCell === "RoyalFortune"
      || clickedCell === "Fancy"
      || clickedCell === "HappyDelivery"
      || clickedCell === "RisingSun"
      || clickedCell === "Speaker"
      || clickedCell === "Revenge")
      && (phase === 0 && event.button === 2));

  movedShip.oncontextmenu = function (event) {
    event.preventDefault();
    let msp = movedShip.style.position;
    if (shipRightClicked && msp !== "absolute") {
      rotateShip(movedShip, event);
    }
  };

//    console.log( clickedCell + " clicked" );
  if (shipLeftClicked) {
    let coords = getCoords(clickedCell);
    var shiftX = event.pageX - coords.left;
    var shiftY = event.pageY - coords.top;

    movedShip.style.position = "absolute";
    seaFightGamefield.appendChild(movedShip);
    moveAt(event);
    movedShip.style.zIndex = 1000;
  }

  function moveAt(event) {
    movedShip.style.left = event.pageX - shiftX - 1 + "px";
    movedShip.style.top = event.pageY - shiftY - 1 + "px";
  }

  seaFightGamefield.onmousemove = function (e) {
    moveAt(e);
  };

  movedShip.onmouseup = function () {
    movedShip.style.position = "absolute";
    movedShip.style.zIndex = 1000;
    seaFightGamefield.onmousemove = null;
    movedShip.onmouseup = null;
  };

  function rotateShip(movedShip, event) {
    let temp = movedShip.offsetWidth;
    console.log(movedShip.style.width);
    console.log(movedShip.offsetHeight + "px");
    movedShip.style.width = movedShip.offsetHeight + "px";
    movedShip.style.height = temp + "px";
    if (movedShip.style.position === "absolute") {
      movedShip.style.left = event.pageX - movedShip.offsetWidth / 2 + "px";
      movedShip.style.top = event.pageY - movedShip.offsetHeight / 2 + "px";
    }
//        var orientation = fleet[ clickedCell ].orientation;
    if (fleet[ clickedCell ].orientation === "vertical") {
      fleet[ clickedCell ].orientation = "horisontal";
    } else if (fleet[ clickedCell ].orientation === "horisontal") {
      fleet[ clickedCell ].orientation = "vertical";
    }
  }

  movedShip.onmouseup = function (event) {
    if (!movedShip) {
      return;
    }
    if (movedShip) {
      insertShip(event, sfP1Arr, fleet, clickedCell, movedShip);
    }
    movedShip.style.zIndex = 1000;
    seaFightGamefield.onmousemove = null;
    movedShip.onmouseup = null;
  };

  movedShip.ondragstart = function () {
    return false;
  };
  return clickedCell;
}

//  Функция определения координат объекта
function getCoords(clickedCell) {
  var elem = document.getElementById(clickedCell);
  var box = elem.getBoundingClientRect();

  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  };
}

function initMouseClickListener( field ) {
  var clickedCell = document.getElementById( field );
  if ( clickedCell.addEventListener ) {                    // For all major browsers, except IE 8 and earlier
    clickedCell.addEventListener( "mousedown", getCell );
  } else if (clickedCell.attachEvent) {                  // For IE 8 and earlier versions
    clickedCell.attachEvent( "onmousedown", getCell );
  }
}

//function removeMouseClickListener( field ) {
//  var clickedCell = document.getElementById( field );
//  if ( clickedCell.removeEventListener ) {                    // For all major browsers, except IE 8 and earlier
//    clickedCell.removeEventListener( "mousedown", getCell );
//  } else if ( clickedCell.detachEvent ) {                  // For IE 8 and earlier versions
//    clickedCell.detachEvent( "onmousedown", getCell );
//  }
//}

// Функция инициализации начального состояния
function initialiseGame() {

  // Формирование игрового поля
  createField(sfP1, sfP1Arr);
  createField(sfP2, sfP2Arr);

  document.getElementById("seaFightGameStart").innerHTML = "PLASE SHIPS ON THE FIELD";
  document.getElementById("seaFightGameStart").disabled = true;

  // Вызываем следящие функции
  initMouseHoverListener("seaFightLogickalField");
  initMouseClickListener("seaFightLogickalField");
}

function reInitializeGame() {
  phase = 0;
  
  document.getElementById("seaFightGameStart").innerHTML = "PLASE SHIPS ON THE FIELD";
  document.getElementById("seaFightGameStart").disabled = true;
  
  recreateFields(sfP1Arr);
  recreateFields(sfP2Arr);

  leftMessage.style.display = "flex";
  leftMessage.style.overflow  = "auto";
  rightMessage.style.display = "flex";
  rightMessage.style.overflow  = "auto";
  
  var leftBar = leftMessage.querySelectorAll( "p" );
  var rightBar = rightMessage.querySelectorAll( "p" );
  
  eraseMessages( leftMessage, leftBar );
  eraseMessages( rightMessage, rightBar );
  
  pcRandomAttackCount = 0;
  lastDamagedShipCoords = undefined;
  lastDamagedShipDecks = [];
  playerLinkors = 1;
  playerCruisers = 2;
  playerDestroyers = 3;
  playerBoars = 4;
  pcShipsForPlase = 10;
  p1ShipsForPlase = 10;
  pcShipsInFight = 10;
  p1ShipsInFight = 10;

  recreateFleet(pcFleet);
  recreateFleet(fleet);

  infoBox.style.display = "none";
  scrollEnable();
  
//  removeMouseHoverListener( "seaFightLogickalField" );
//  removeMouseClickListener( "seaFightLogickalField" );

//  // Вызываем следящие функции
//  initMouseHoverListener( "seaFightLogickalField" );
//  initMouseClickListener( "seaFightLogickalField" );

  function recreateFields(currentField) {
    for (var i = 0; i <= 9; i++) {
      for (var j = 0; j <= 9; j++) {
        currentField[i][j][0].className = "sf_cell";
      }
    }
  }

  function recreateFleet(currentFleet) {
    for (var key in currentFleet) {
      currentFleet[key].rollBack();
      currentFleet[ key ].orientation = "vertical";
      currentFleet[ key ].isPlased = false;

      let originalClassNameLen = currentFleet[ key ].case.className.indexOf("plased");
      originalClassNameLen -= 1;
      let originalClassName = currentFleet[ key ].case.className.slice(0, originalClassNameLen);
      currentFleet[ key ].case.className = originalClassName;
      currentFleet[ key ].case.style.display = "block";
    }
  }
  
  function eraseMessages( messageField, bar ) {
    let barLen = bar.length;
    for ( var i = 0; i < barLen; i++ ) {
      messageField.removeChild( bar[i] );
    }
  }
}

// Заполненеие кораблями игрового поля ИИ
var pcFleet = {};
pcFleet.decks4ship1 = new Ship("decks4ship1", 4);
pcFleet.decks3ship1 = new Ship("decks3ship1", 3);
pcFleet.decks3ship2 = new Ship("decks3ship2", 3);
pcFleet.decks2ship1 = new Ship("decks2ship1", 2);
pcFleet.decks2ship2 = new Ship("decks2ship2", 2);
pcFleet.decks2ship3 = new Ship("decks2ship3", 2);
pcFleet.decks1ship1 = new Ship("decks1ship1", 1);
pcFleet.decks1ship2 = new Ship("decks1ship2", 1);
pcFleet.decks1ship3 = new Ship("decks1ship3", 1);
pcFleet.decks1ship4 = new Ship("decks1ship4", 1);

for (var key in pcFleet) {
  pcFleet[key].createDecks();
}

function insertPcShip(sfPArr, currentFleet, key, randomlyChoosenCell) {
  var currentShip = key;
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {

      if (sfPArr[i] === undefined) {
        continue;
      }
      ;
      if (sfPArr[i][j][0].id === randomlyChoosenCell) {
        let shipLength = currentFleet[ currentShip ].decksNum;

        if (currentFleet[ currentShip ].orientation === "vertical" && (shipLength + j <= 10)
            && currentFleet[ currentShip ].isPlased === false) {
          if (!chackSea(i, j, shipLength)) {
            currentFleet[ currentShip ].rollBack();
            return false;
          }
          ;
          for (let k = 0; k < shipLength; k++) {
            sfPArr[i][j][0].className = "sf_cell_with_pc_ship";
            sfPArr[i][j][1].decks = 1;
            currentFleet[ currentShip ].decks[k].cell = sfPArr[i][j][0];
            j++;
          }
          pcShipsForPlase--;
          currentFleet[ currentShip ].isPlased = true;
          currentFleet[ currentShip ].case.className = currentFleet[ currentShip ].case.className + " " + "plased";
        } else if (currentFleet[ currentShip ].orientation === "horisontal" && (shipLength + i <= 10)
            && currentFleet[ currentShip ].isPlased === false) {
          if (!chackSea(i, j, shipLength)) {
            currentFleet[ currentShip ].rollBack();
            return false;
          }
          ;
          for (var k = 0; k < shipLength; k++) {
            sfPArr[i][j][0].className = "sf_cell_with_pc_ship";
            sfPArr[i][j][1].decks = 1;
            currentFleet[ currentShip ].decks[k].cell = sfPArr[i][j][0];
            i++;
          }
          pcShipsForPlase--;
          currentFleet[ currentShip ].isPlased = true;
          currentFleet[ currentShip ].case.className = currentFleet[ currentShip ].case.className + " " + "plased";
        }
      }
    }
  }
  // Функция проверки валидности(незанятости и удаленности) дропа в клетку поля
  function chackSea(i, j, shipLength) {
    let flag = true;
    if (currentFleet[ currentShip ].orientation === "vertical") {
      for (var v = i - 1; v <= i + 1; v++) {
        for (var h = j - 1; h <= j + shipLength; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          if (sfPArr[v][h][1].decks === 1) {
            flag = false;
          }
        }
      }
      if (flag) {
        for (var v = i - 1; v <= i + 1; v++) {
          for (var h = j - 1; h <= j + shipLength; h++) {
            if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
              continue;
            }
            sfPArr[v][h][0].className = "sf_cell_pcfield_disabled";
          }
        }
        return true;
      } else if (!flag) {
        currentFleet[ currentShip ].rollBack();
        return false;
      }
    } else if (currentFleet[ currentShip ].orientation === "horisontal") {
      for (var v = i - 1; v <= i + shipLength; v++) {
        for (var h = j - 1; h <= j + 1; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          if (sfPArr[v][h][1].decks === 1) {
            flag = false;
          }
        }
      }
    }
    if (flag) {
      for (var v = i - 1; v <= i + shipLength; v++) {
        for (var h = j - 1; h <= j + 1; h++) {
          if ((v < 0 || h < 0) || (v > 9 || h > 9)) {
            continue;
          }
          sfPArr[v][h][0].className = "sf_cell_pcfield_disabled";
        }
      }
      return true;
    } else if (!flag) {
      currentFleet[ currentShip ].rollBack();
      return false;
    }
  }
  currentFleet[ currentShip ].rollBack();
  return false;
}

function placePCFleet() {
  while (pcShipsForPlase !== 0) {
    for (var key in pcFleet) {
      let rndOrientation = randomize(0, 1);
      if (rndOrientation) {
        rndOrientation = "vertical";
      } else {
        rndOrientation = "horisontal";
      }

      let h = randomize(0, 9);
      let v = randomize(0, 9);
      let currentShip = pcFleet[key];
      let randomlyChoosenCell = "p2_cell_" + h + v;
      let arrCellDirectly = sfP2Arr[h][v];

      pcFleet[key].orientation = rndOrientation;
      insertPcShip(sfP2Arr, pcFleet, key, randomlyChoosenCell, arrCellDirectly);
    }
  }
}

// Тело игры
initialiseGame();
var seaFightGameStart = document.getElementById("seaFightGameStart");
seaFightGameStart.onclick = function () {
  placePCFleet();
  phase = 1;
  p1Turn = true;
};

//// Ход игрока
// Проверка состоянимя игры

//// Ход компьютера
// Проверка состоянимя игры

// Калькулятор с обучением извне !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// DECLARATION
function Megacalc() {
  let a = 0;
  let b = 0;
  function prapareOperators() {
    let wordEntered = document.getElementById("calcInput").value;
    let operators = ["+", "-", "*", "/", "**"];
    let operator;
    let result;

    resultFinder:{
      for (var i = 0; i < operators.length; i++) {
        let searchedOp = new RegExp("\\" + operators[ i ] + "+");   /* /\+/ */

        result = wordEntered.match(searchedOp);
//          console.log( result.index );
        if (result !== (-1) && result !== null) {
          operator = operators[i];
          switch (operator) {
            case "+":
              break resultFinder;
            case "-":
              break resultFinder;
            case "*":
              break resultFinder;
            case "/":
              break resultFinder;
//                case "**":
//                  break resultFinder;
          }
        }
      }
    }

    a = wordEntered.slice(0, result.index);
    b = wordEntered.slice(result.index + 1, result.input.length);
    return operator;
  }

  var operation = {
    "+": function (a, b) {
      return a + b;
    },
    "-": function (a, b) {
      return a - b;
    },
    "*": function (a, b) {
      return a * b;
    },
    "/": function (a, b) {
      return a / b;
    }
//      "**": function(a, b) {
//        return Math.pow(a, b);
//      }
  };

// Функция добавления операций / Написание отложено из за невозможности добавить в одну строку    
//    this.addOperation = function (){};  

  this.read = function () {
    let operator = prapareOperators();
    this.a = +a;
    this.b = +b;
    const answerField = document.getElementById("calcAnswer");
    var calcRes = operation[ operator ](this.a, this.b);
    answerField.innerHTML = calcRes;
  };
}

const calcButton = document.getElementById("calcInputBut");
function initCalcButtonListener() {
  if (calcButton.addEventListener) {                    // For all major browsers, except IE 8 and earlier
    calcButton.addEventListener("click", calculator.read);
  } else if (calcButton.attachEvent) {                  // For IE 8 and earlier versions
    calcButton.addEventListener("click", calculator.read);
  }
}

var calcField = document.getElementById("calcInput");
if (calcField.addEventListener) {                    // For all major browsers, except IE 8 and earlier
  calcField.addEventListener("keyup", fieldFormatter);
  calcField.addEventListener("click", cursorFixer);
} else if (calcField.attachEvent) {                  // For IE 8 and earlier versions
  calcField.attachEvent("onkeyup", fieldFormatter);
  calcField.addEventListener("onclick", cursorFixer);
}

function cursorFixer() {
  var input = document.getElementById("calcInput");
  input.focus();
  input.selectionStart = input.value.length;
}

function fieldFormatter() {
  try {
    let char = document.getElementById("calcInput");
    let wordEntered = char.value;
    let wLen = wordEntered.length;

    let searchResult = wordEntered.match(/[\a-zа-яё]+/i);
    let isDuplicated = wordEntered.match(/[-+/*]/g);

    if ((wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) === "\D")
        || (wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) === " ")
        || (wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) !== "+")
        || (wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) !== "-")
        || (wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) !== "/")
        || (wordEntered.charAt(wLen - 1) === " " && wordEntered.charAt(wLen - 2) !== "*")
        || (searchResult[0] !== null)
        ) {

      char.value = wordEntered.slice(0, wLen - 1);
      cursorFixer();
    }
  }
  catch (err) {
  } //Убрал ошибку из консоли, так как она не мешает коду выполняться и просто мозолит глаза 
}

// Megacalc.prototype.

// EXECUTION

var calculator = new Megacalc();
initCalcButtonListener();
calculator.prototype;