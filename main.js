const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const Chess = require('chess.js').Chess;
const Stockfish = require('stockfish');

// Create the pocketsphinx stream
const pocketsphinxProcess = spawn('pocketsphinx_continuous', ['-inmic', 'yes']);
const pocketsphinxStream = pocketsphinxProcess.stdout;

// Pipe the pocketsphinx output to the standard output
pocketsphinxStream.pipe(process.stdout);

// Process the pocketsphinx output
let pocketsphinxOutput = '';
pocketsphinxStream.on('data', (data) => {
  pocketsphinxOutput += data.toString();
  if (pocketsphinxOutput.indexOf('\n') !== -1) {
    const speechInput = pocketsphinxOutput.trim();
    processSpeech(speechInput);
    pocketsphinxOutput = '';
  }
});

// Process user speech input
function processSpeech(text) {
  if (typeof text !== 'string') {
    console.error('Invalid speech input:', text);
    return;
  }
  
  console.log('Heard:', text);
  // Parse the user's input to extract the relevant information
  const [piece, targetSquare, action] = text.split(' ');

  // Convert the target square to chess notation (e.g., "e4")
  const targetSquareChessNotation = convertToChessNotation(targetSquare);

  // Determine the current board state
  const currentBoardState = getCurrentBoardState();

  // Calculate the move based on the current board state and user input
  calculateMove(currentBoardState, piece, targetSquareChessNotation, action).then((move) => {
    // Draw arrows on the board to represent the move
    drawArrows(move);
  });
}


function getCurrentBoardState() {
  const game = new Chess();
  const fen = game.fen();
  return fen;
}


function calculateMove(gameState, piece, targetSquare, action) {
  const game = new Chess(gameState);
  const engine = new Stockfish();

  return new Promise((resolve) => {
    engine.onmessage = (event) => {
      const message = event.data;
      if (message.startsWith('bestmove')) {
        const bestMove = message.split(' ')[1];
        resolve(bestMove);
      }
    };

    engine.postMessage(`position fen ${game}`);
    engine.postMessage('go depth 15');
  });
}

function drawArrows(move) {
  const [fromSquare, toSquare] = [move.slice(0, 2), move.slice(2, 4)];
  const game = new Chess();
  game.move({from: fromSquare, to: toSquare});
  const position = game.fen().split(' ')[0];
  const board = Chessboard('board', {position: position});
  board.arrow(fromSquare, toSquare, {color: 'red'});
}


function convertToChessNotation(square) {
  // Convert a square in algebraic notation (e.g., "e4") to
  // chess notation (e.g., "e2e4")
  const file = square.charAt(0).toLowerCase();
  const rank = square.charAt(1);
  return file + (8 - rank) + file + (8 - (rank - 1));
}

