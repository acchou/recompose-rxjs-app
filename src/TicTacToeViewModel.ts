import * as Rx from "rxjs/Rx";

export type Player = "X" | "O";
export type SquareValueType = Player | undefined;
export type BoardType = SquareValueType[];
export type HistoryType = BoardType[];
export type SquareIndexType = number;
export type MoveIndexType = number;

export interface GameViewModelInputs {
    clickSquare$: Rx.Observable<SquareIndexType>;
    clickMove$: Rx.Observable<MoveIndexType>;
}

export interface GameState {
    history: HistoryType;
    currentBoard: BoardType;
    winner: SquareValueType;
    nextPlayer: Player;
}

export type GameViewModelOutputs = Rx.Observable<GameState>;

function nextMovePlayer(history: HistoryType) {
    return history.length % 2 === 1 ? "X" : "O";
}

export function calculateWinner(board: SquareValueType[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return undefined;
}

export function clickSquare(
    board: BoardType,
    nextPlayer: Player,
    square: SquareIndexType
): BoardType {
    if (board[square] || calculateWinner(board)) {
        return board;
    }
    const newBoard = board.slice();
    newBoard[square] = nextPlayer;
    return newBoard;
}

export function clickMoveReducer(history: HistoryType, move: number): HistoryType {
    return history.slice(0, move + 1);
}

export function clickSquareReducer(history: HistoryType, square: number): HistoryType {
    const board = history[history.length - 1];
    const newBoard = clickSquare(board, nextMovePlayer(history), square);
    if (newBoard === board) {
        return history;
    }
    return [...history, newBoard];
}

export function GameViewModel(input: GameViewModelInputs): GameViewModelOutputs {
    const { clickSquare$, clickMove$ } = input;

    function makeClickSquareReducer(squareNum: SquareIndexType) {
        return (history: HistoryType) => clickSquareReducer(history, squareNum);
    }

    function makeClickMoveReducer(move: MoveIndexType) {
        return (history: HistoryType) => clickMoveReducer(history, move);
    }

    const clickSquareReducer$ = clickSquare$.map(makeClickSquareReducer);
    const clickMoveReducer$ = clickMove$.map(makeClickMoveReducer);
    const initialState = [new Array(9).fill(undefined)] as HistoryType;
    const initialReducer = (x: HistoryType) => x;

    const history$ = Rx.Observable
        .merge(clickSquareReducer$, clickMoveReducer$)
        .startWith(initialReducer)
        .scan((history, reducer) => reducer(history), initialState);

    const state$ = history$.map(history => {
        const currentBoard = history[history.length - 1];
        const winner = calculateWinner(currentBoard);
        return {
            history: history,
            currentBoard: currentBoard,
            winner: winner,
            nextPlayer: nextMovePlayer(history)
        } as GameState;
    });

    return state$;
}
