let gridSize = 7;
let xInaRow = 4;
let players = 2;
let board;
let playerTurn = 0;
let tileHistory = [];
let gameoverState = false;

const bodyElement = document.querySelector("body");
const gameElement = document.querySelector(".game");
const modalElement = document.querySelector(".modal");
const currentPlayerElement = document.querySelector(".current-player");
const gameoverTextElement = document.querySelector("#gameover-text");

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyZ" && event.metaKey) {
    undo();
  }
});

gameElement.addEventListener("click", (event) => {
  const tile = event.target;
  if (tile.classList.contains("tile")) {
    const index = parseInt(tile.id.substring(5), 10);
    const column = index % gridSize;

    play(playerTurn, column);
  } else {
    const x = event.offsetX;
    const tiles = Array.from(gameElement.querySelectorAll(".tile"))
      .slice(0, gridSize)
      .map((element) => element.offsetLeft + element.offsetWidth / 2);
    const closest = tiles.reduce((prev, curr) =>
      Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev
    );
    const column = tiles.indexOf(closest);
    play(playerTurn, column);
  }
});

function getTileId(row, column) {
  return "#tile-" + (row * gridSize + column);
}

function restart() {
  if (playerTurn > players || playerTurn === 0) {
    nextTurn();
  }
  gameoverState = false;
  tileHistory = [];
  gameElement.querySelectorAll(".tile").forEach((child) => {
    gameElement.removeChild(child);
  });

  board = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  );

  gameElement.style.gridTemplate = `repeat(${gridSize}, 1fr) / repeat(${gridSize}, 1fr)`;

  for (let index = 0; index < gridSize * gridSize; index++) {
    const tileElement = document.createElement("div");
    tileElement.classList.add("tile");
    tileElement.id = "tile-" + index;
    gameElement.append(tileElement);
  }
}

function play(player, column) {
  if (!gameoverState && canPlayColumn(column)) {
    dropAt(player, column);

    const winningTiles = checkWin(playerTurn);
    if (winningTiles) {
      gameover(winningTiles);
    }

    nextTurn();
  }
}

function nextTurn() {
  currentPlayerElement.classList.toggle("player" + playerTurn);
  playerTurn += 1;
  if (playerTurn > players) {
    playerTurn = 1;
  }
  currentPlayerElement.classList.toggle("player" + playerTurn);
}

function previousTurn() {
  currentPlayerElement.classList.toggle("player" + playerTurn);
  playerTurn -= 1;
  if (playerTurn === 0) {
    playerTurn = players;
  }
  currentPlayerElement.classList.toggle("player" + playerTurn);
}

function undo() {
  const id = tileHistory.pop();
  if (id >= 0) {
    const tile = document.querySelector("#tile-" + id);

    const column = id % gridSize;
    const row = (id - column) / gridSize;
    board[row][column] = 0;

    previousTurn();
    tile.classList.remove("player" + playerTurn);
  }
}

function gameover(winningTiles) {
  gameoverState = true;

  bodyElement.classList.add("gameover");
  gameoverTextElement.textContent = winningTiles
    ? `Player ${playerTurn} won!`
    : `Game over`;

  winningTiles?.forEach((id) => {
    document.querySelector(id).classList.add("winner-tile");
  });

  setTimeout(() => {
    modalElement.classList.add("show");
  }, 1000);
}

function dropAt(player, column) {
  let firstEmptyRow;
  for (let row = gridSize - 1; row >= 0; row--) {
    if (board[row][column] === 0) {
      firstEmptyRow = row;
      break;
    }
  }

  if (firstEmptyRow === undefined) throw new Error("No empty spot in row");

  board[firstEmptyRow][column] = player;
  const id = getTileId(firstEmptyRow, column);
  const tile = document.querySelector(id);
  tile.classList.add("player" + playerTurn);

  tileHistory.push(firstEmptyRow * gridSize + column);
  if (tileHistory.length >= gridSize * gridSize) {
    gameover(undefined);
  }
}

function canPlayColumn(column) {
  return board[0][column] === 0;
}

function checkWin(player) {
  const checkRow = (row, column) => {
    for (let i = 0; i < xInaRow; i++) {
      if (board[row(i)][column(i)] !== player) {
        return false;
      }
    }

    return true;
  };

  const getWinningTiles = (row, column) => {
    const winningTiles = [];
    for (let i = 0; i < xInaRow; i++) {
      winningTiles.push(getTileId(row(i), column(i)));
    }
    return winningTiles;
  };

  // row check
  for (let column = 0; column <= gridSize - xInaRow; column++) {
    for (let row = 0; row < gridSize; row++) {
      const funcs = [(_) => row, (i) => column + i];
      const isWin = checkRow(...funcs);

      if (isWin) {
        return getWinningTiles(...funcs);
      }
    }
  }

  //column check
  for (let row = 0; row <= gridSize - xInaRow; row++) {
    for (let column = 0; column < gridSize; column++) {
      const funcs = [(i) => row + i, (_) => column];
      const isWin = checkRow(...funcs);

      if (isWin) {
        return getWinningTiles(...funcs);
      }
    }
  }

  //ascending diangonal
  for (let row = xInaRow - 1; row < gridSize; row++) {
    for (let column = 0; column <= gridSize - xInaRow; column++) {
      const funcs = [(i) => row - i, (i) => column + i];
      const isWin = checkRow(...funcs);

      if (isWin) {
        return getWinningTiles(...funcs);
      }
    }
  }

  //decending diangonal
  for (let row = xInaRow - 1; row < gridSize; row++) {
    for (let column = xInaRow - 1; column < gridSize; column++) {
      const funcs = [(i) => row - i, (i) => column - i];
      const isWin = checkRow(...funcs);

      if (isWin) {
        return getWinningTiles(...funcs);
      }
    }
  }
}

function setupGui() {
  const onClick = (event) => {
    if (event.target.nodeName !== "LI") return undefined;

    try {
      const number = parseInt(event.target.textContent?.substring(0, 1), 10);
      event.currentTarget
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      event.target.classList.add("selected");

      return number;
    } catch {
      return undefined;
    }
  };

  const createOptions = (parent, values, initial) => {
    values.forEach((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      if (x === initial) li.classList.add("selected");
      parent.appendChild(li);
    });
  };

  const settingsPlayer = document.querySelector("#settings-players");
  createOptions(settingsPlayer, [2, 3, 4], players);
  settingsPlayer.addEventListener("click", (event) => {
    players = onClick(event) ?? players;
  });

  const settingsSize = document.querySelector("#settings-size");
  createOptions(settingsSize, [3, 4, 5, 6, 7, 8, 9], gridSize);
  settingsSize.addEventListener("click", (event) => {
    gridSize = onClick(event) ?? gridSize;
  });

  const settingsConnect = document.querySelector("#settings-connect");
  createOptions(settingsConnect, [3, 4, 5], xInaRow);
  settingsConnect.addEventListener("click", (event) => {
    xInaRow = onClick(event) ?? xInaRow;
  });

  const startButton = document.querySelector("#menu button");
  startButton.addEventListener("click", (event) => {
    restart();
    bodyElement.classList.remove("gameover");
    modalElement.classList.remove("show");
  });
}

setupGui();
restart();
