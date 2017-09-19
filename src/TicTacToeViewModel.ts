import * as Rx from "rxjs/Rx";

export type SquareValueType = "X" | "O" | undefined;
export type BoardType = SquareValueType[];
export type HistoryType = BoardType[];
export type SquareIndexType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type MoveIndexType = number;

export interface GamewViewModelInputs {
    clickSquare$: Rx.Subject<SquareIndexType>;
    clickMove$: Rx.Subject<MoveIndexType>;
}

export interface GameState {
    history: HistoryType;
    currentBoard: BoardType;
    winner: SquareValueType;
    nextPlayer: "X" | "O";
}

export type GameViewModelOutputs = Rx.Observable<GameState>;

function nextMovePlayer(history: HistoryType) {
    return history.length % 2 === 1 ? "X" : "O";
}

function calculateWinner(board: SquareValueType[]) {
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

export function GameViewModel(input: GamewViewModelInputs): GameViewModelOutputs {
    const { clickSquare$, clickMove$ } = input;

    function makeClickSquareReducer(squareNum: SquareIndexType) {
        return function(history: HistoryType): HistoryType {
            const board = history[history.length - 1];
            if (board[squareNum] || calculateWinner(board)) {
                return history;
            }
            const newBoard = board.slice();
            newBoard[squareNum] = nextMovePlayer(history);
            return [...history, newBoard];
        };
    }

    function makeClickMoveReducer(move: MoveIndexType) {
        return function(history: HistoryType): HistoryType {
            return history.slice(0, move + 1);
        };
    }

    const clickSquareReducer = clickSquare$.map(makeClickSquareReducer);
    const clickMoveReducer = clickMove$.map(makeClickMoveReducer);
    const initialState = [new Array(9).fill(undefined)] as HistoryType;
    const initialReducer = (x: HistoryType) => x;

    const history$ = Rx.Observable
        .merge(clickSquareReducer, clickMoveReducer)
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
