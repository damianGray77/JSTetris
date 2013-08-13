var _BLOCK_SIZE = 4;
var _NUM_ROTATIONS = 4;
var _NUM_BLOCKS = 7;
var _BOARD_SIZE_X = 10;
var _BOARD_SIZE_Y = 22;

var BLOCKS = [
	  0x0
	, [0x4444, 0x0F00, 0x4444, 0x0F00]
	, [0x0660, 0x0660, 0x0660, 0x0660]
	, [0x04E0, 0x4640, 0x0E40, 0x2620]
	, [0x4620, 0x06C0, 0x4620, 0x06C0]
	, [0x2640, 0x0C60, 0x2640, 0x0C60]
	, [0x4460, 0x0740, 0x0622, 0x02E0]
	, [0x2260, 0x0470, 0x0644, 0x0E20]
];

var KEYS = {
	esc: 27
	, left: 37
	, right: 39
	, down: 40
	, up: 38
	, ctrl: 17
	, alt: 18
	, space: 32
};

var running = true;
var board = null;
var nextBlock = null;
var blocks = null;
var nBlock = null;
var nBlockI = null;
var cBlock = null;
var cBlockI = null;
var cBlockRot = null;
var cBlockX = null;
var cBlockY = null;
var dropHandle = null;
var dropRate = 750;
var speedyDropRate = 10;
var hardDropping = true;
var score = 0;

function EndGame() {
	running = false;

	clearTimeout(dropHandle);

	var gameOverEl = window.document.getElementById('game_over');

	gameOverEl.style.display = '';
}

function Run() {
	InitBoard();
	InitBlocks();
	GetNextBlock();
	DropBlock();
}

function PauseGame() {
	running = false === running;

	var pauseEl = window.document.getElementById('pause');
	if (true === running) {
		DropBlock();

		pauseEl.style.display = 'none';
	} else {
		clearTimeout(dropHandle);
		dropHandle = null;

		pauseEl.style.display = '';
	}
}

function DropBlock() {
	if (false === running) {
		return;
	}

	if (null !== dropHandle) {
		clearTimeout(dropHandle);
		dropHandle = null;
	}

	var currentDropRate = hardDropping ? speedyDropRate : dropRate;

	dropHandle = setTimeout(function () {
		MoveBlock(0, 1);
		DropBlock();
	}, currentDropRate);
}

function GetNextBlock() {
	if (null === nBlock) {
		cBlockI = parseInt(Math.random() * 7) + 1;
		cBlock = blocks[cBlockI][0];
	} else {
		cBlockI = nBlockI;
		cBlock = nBlock;
	}

	nBlockI = parseInt(Math.random() * 7) + 1;
	nBlock = blocks[nBlockI][0];

	for (var y = 0; y < _BLOCK_SIZE; ++y) {
		for (var x = 0; x < _BLOCK_SIZE; ++x) {
			nextBlock[y][x].className = 'block' + (0 === nBlock[y][x] ? '' : ' b' + nBlockI);
		}
	}

	cBlockRot = 0;
	cBlockX = parseInt((_BOARD_SIZE_X - _BLOCK_SIZE) / 2);
	cBlockY = -_BLOCK_SIZE;
	hardDropping = false;
}

function Clamp(num, min, max) {
	if (num < min) {
		return max;
	}

	if (num > max) {
		return min;
	}

	return num;
}

function ReleaseBlock() {
	for (var y = 0; y < _BLOCK_SIZE; ++y) {
		for (var x = 0; x < _BLOCK_SIZE; ++x) {
			if (0 === cBlock[y][x]) {
				continue;
			}

			var cY = y + cBlockY;
			var cX = x + cBlockX;

			if (cY >= 0) {
				board[cY][cX].className = 'block b' + cBlockI;
			} else {
				if (y === _BLOCK_SIZE - 1) {
					EndGame();

					return;
				}
			}
		}
	}

	CheckLines();
}

function AddScore(s) {
	score += 10 * Math.pow(2, s - 1);

	var scoreEl = window.document.getElementById('score');
	scoreEl.innerHTML = 'Score: ' + score;
}

function SpeedUp(amount) {
	dropRate -= amount;

	if (dropRate < speedyDropRate) {
		dropRate = speedyDropRate;
	}
}

function CheckLines() {
	var toRemove = [];
	var removeNum = 0;

	var clear = false;
	for (var y = _BOARD_SIZE_Y - 1; y >= 0; --y) {
		var flag = true;

		for (var x = 0; x < _BOARD_SIZE_X; ++x) {
			if ('block' === board[y][x].className) {
				flag = false;
				break;
			}
		}

		if (true === flag) {
			clear = true;
			++removeNum;
		}

		toRemove[y] = flag;
	}

	if (true === clear) {
		ClearRows(toRemove);
		AddScore(removeNum);
		SpeedUp(removeNum * 2);
	}
}

function ClearRows(arr) {
	var i = _BOARD_SIZE_Y - 1;
	for (var y = _BOARD_SIZE_Y - 1; y >= 0; --y) {
		if (true === arr[y]) {
			continue;
		}

		for (var x = 0; x < _BOARD_SIZE_X; ++x) {
			board[i][x].className = board[y][x].className;
		}

		--i;
	}

	for (var x = 0; x < _BOARD_SIZE_X; ++x) {
		board[i][x].className = 'block';
	}
}

function MoveBlock(xDir, yDir) {
	ToggleBlock(false);

	cBlockX += xDir;
	cBlockY += yDir;

	var validMove = ValidMove();

	if (false === validMove) {
		cBlockX -= xDir;
		cBlockY -= yDir;
	}

	if (1 === yDir && false === validMove) {
		ReleaseBlock();
		GetNextBlock();
	} else {
		ToggleBlock(true);
	}
}

function RotateBlock(dir) {
	ToggleBlock(false);

	cBlockRot = Clamp(cBlockRot + dir, 0, _NUM_ROTATIONS - 1);
	cBlock = blocks[cBlockI][cBlockRot];

	if (false === ValidMove()) {
		cBlockRot = Clamp(cBlockRot - dir, 0, _NUM_ROTATIONS - 1);
		cBlock = blocks[cBlockI][cBlockRot];
	}

	ToggleBlock(true);
}

function IsInBounds(x, y, top) {
	var inBounds = (false === top
		|| y >= 0)
		&& x >= 0
		&& x < _BOARD_SIZE_X
		&& y < _BOARD_SIZE_Y
	;

	return inBounds;
}

function ValidMove() {
	for (var y = 0; y < _BLOCK_SIZE; ++y) {
		for (var x = 0; x < _BLOCK_SIZE; ++x) {
			if (0 === cBlock[y][x]) {
				continue;
			}

			var cY = y + cBlockY;
			var cX = x + cBlockX;

			if (false === IsInBounds(cX, cY, false)) {
				return false;
			}

			if (false === IsInBounds(cX, cY, true)) {
				continue;
			}

			var block = board[cY][cX];

			if ('block' !== block.className) {
				return false;
			}
		}
	}

	return true;
}

function ToggleBlock(show) {
	for (var y = 0; y < _BLOCK_SIZE; ++y) {
		for (var x = 0; x < _BLOCK_SIZE; ++x) {
			if (0 === cBlock[y][x]) {
				continue;
			}

			var cY = y + cBlockY;
			var cX = x + cBlockX;

			if (false === IsInBounds(cX, cY, true)) {
				continue;
			}

			board[cY][cX].className = true === show
				? 'block b' + cBlockI
				: 'block'
			;
		}
	}
}

function InitBoard() {
	var boardEl = window.document.getElementById('board');
	board = [];
	for (var y = 0; y < _BOARD_SIZE_Y; ++y) {
		board[y] = [];

		for (var x = 0; x < _BOARD_SIZE_X; ++x) {
			var div = document.createElement('div');
			div.className = 'block';
			div.id = 'b_' + x + '_' + y;

			board[y][x] = div;

			boardEl.appendChild(board[y][x]);
		}
	}

	var nextBlockEl = window.document.getElementById('next_block');
	nextBlock = [];
	for (var y = 0; y < _BLOCK_SIZE; ++y) {
		nextBlock[y] = [];

		for (var x = 0; x < _BLOCK_SIZE; ++x) {
			var div = document.createElement('div');
			div.className = 'block';
			div.id = 'n_' + x + '_' + y;

			nextBlock[y][x] = div;

			nextBlockEl.appendChild(nextBlock[y][x]);
		}
	}
}

function InitBlocks() {
	blocks = [];

	for (var i = 1; i <= _NUM_BLOCKS; ++i) {
		var blocksI = [];

		for (var r = 0; r < _NUM_ROTATIONS; ++r) {
			var blockArr = BLOCKS[i][r].toString(2).split('');
			var j = blockArr.length - 1;
			var blocksR = [];

			for (var y = 0; y < _BLOCK_SIZE; ++y) {
				var blocksY = [];

				for (var x = 0; x < _BLOCK_SIZE; ++x) {
					blocksY[x] = j < 0 ? 0 : parseInt(blockArr[j]);

					--j;
				}

				blocksR[y] = blocksY;
			}

			blocksI[r] = blocksR;
		}

		blocks[i] = blocksI;
	}
}

function InitEvents() {
	document.onkeydown = KeyDown;
}

function KeyDown(e) {
	if (undefined === e) {
		e = window.event;
	}

	var key = undefined == e.which ? e.keyCode : e.which;

	if (undefined === e.stopPropagation) {
		e.cancelBubble = true;
		e.returnValue = false;
	} else {
		e.stopPropagation();
		e.preventDefault();
	}

	if (false === running) {
		if (KEYS.space === key) {
			PauseGame();
		}

		return;
	}

	switch (key) {
		case KEYS.esc:
			EndGame();
			break;
		case KEYS.left:
			MoveBlock(-1, 0);
			break;
		case KEYS.right:
			MoveBlock(1, 0);
			break;
		case KEYS.up:
			hardDropping = true;
			DropBlock();
			break;
		case KEYS.down:
			MoveBlock(0, 1);
			break;
		case KEYS.ctrl:
			RotateBlock(-1);
			break;
		case KEYS.alt:
			RotateBlock(1);
			break;
		case KEYS.space:
			PauseGame();
			break;
	}
}

function Main() {
	InitEvents();

	Run();
}

window.onload = Main;
