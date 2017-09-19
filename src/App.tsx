import * as React from "react";
import "./App.css";
import * as Rx from "rxjs/Rx";
import * as Recompose from "recompose";
import rxjsConfig from "recompose/rxjsObservableConfig";

// Use RxJS as the Observable library
Recompose.setObservableConfig(rxjsConfig);

type SquareValueType = "X" | "O" | undefined;
type BoardType = SquareValueType[];
type HistoryType = BoardType[];
type SquareIndexType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Moves are indexed and displayed; this is the type of the move index.
type MoveIndexType = number;

interface SquareProps {
    value: SquareValueType;
    onClick: () => void;
}

function Square(props: SquareProps) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}

interface BoardProps {
    board: BoardType;
    onClick: (squareNum: SquareIndexType) => void;
}

function Board(props: BoardProps) {
    function renderSquare(i: SquareIndexType) {
        return <Square value={props.board[i]} onClick={() => props.onClick(i)} />;
    }

    return (
        <div>
            <div className="board-row">
                {renderSquare(0)}
                {renderSquare(1)}
                {renderSquare(2)}
            </div>
            <div className="board-row">
                {renderSquare(3)}
                {renderSquare(4)}
                {renderSquare(5)}
            </div>
            <div className="board-row">
                {renderSquare(6)}
                {renderSquare(7)}
                {renderSquare(8)}
            </div>
        </div>
    );
}

interface MoveHistoryItemProps {
    move: MoveIndexType;
    onClick: () => void;
}

function MoveHistoryItem(props: MoveHistoryItemProps) {
    const move = props.move;
    const desc = move ? "Move #" + move : "Game start";

    return (
        <li>
            <a href="#" onClick={props.onClick}>
                {desc}
            </a>
        </li>
    );
}

interface GamewViewModelInputs {
    clickSquare$: Rx.Subject<SquareIndexType>;
    clickMove$: Rx.Subject<MoveIndexType>;
}

interface GameViewModelOutputs {
    history$: Rx.Observable<HistoryType>;
}

function nextMovePlayer(history: HistoryType) {
    return history.length % 2 === 1 ? "X" : "O";
}

function GameViewModel(input: GamewViewModelInputs): GameViewModelOutputs {
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

    return { history$ };
}

function createHandler<T>(): Recompose.EventHandlerOf<T, Rx.Subject<T>> {
    return Recompose.createEventHandler();
}

const Game = Recompose.componentFromStream((props$: Rx.Observable<{}>) => {
    const { handler: clickSquare, stream: clickSquare$ } = createHandler<SquareIndexType>();
    const { handler: clickMove, stream: clickMove$ } = createHandler<MoveIndexType>();
    const { history$ } = GameViewModel({ clickSquare$, clickMove$ });

    return history$.map(history => {
        const board = history[history.length - 1];

        const moves = history.map((steps, move) => {
            return <MoveHistoryItem key={move} move={move} onClick={() => clickMove(move)} />;
        });

        const winner = calculateWinner(board);
        let status;
        if (winner) {
            status = "Winner: " + winner;
        } else {
            status = "Next player: " + nextMovePlayer(history);
        }

        return (
            <div key="none" className="game">
                <div className="game-board">
                    <Board board={history[history.length - 1]} onClick={clickSquare} />
                </div>
                <div className="game-info">
                    <div className="status">{status}</div>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    });
});

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

export default Game;
