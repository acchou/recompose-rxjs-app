import * as React from "react";
import "./App.css";
import * as Rx from "rxjs/Rx";
import * as Recompose from "recompose";
import rxjsConfig from "recompose/rxjsObservableConfig";

import {
    SquareValueType,
    MoveIndexType,
    BoardType,
    SquareIndexType,
    GameViewModel
} from "./TicTacToeViewModel";

// Use RxJS as the Observable library
Recompose.setObservableConfig(rxjsConfig);

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

function createHandler<T>(): Recompose.EventHandlerOf<T, Rx.Subject<T>> {
    return Recompose.createEventHandler();
}

const Game = Recompose.componentFromStream(props$ => {
    const { handler: clickSquare, stream: clickSquare$ } = createHandler<SquareIndexType>();
    const { handler: clickMove, stream: clickMove$ } = createHandler<MoveIndexType>();
    const state$ = GameViewModel({ clickSquare$, clickMove$ });

    return state$.map(state => {
        const { history, currentBoard, winner, nextPlayer } = state;
        const moveList = history.map((_, move) => (
            <MoveHistoryItem key={move} move={move} onClick={() => clickMove(move)} />
        ));
        const status = winner ? "Winner: " + winner : "Next player: " + nextPlayer;

        return (
            <div key="none" className="game">
                <div className="game-board">
                    <Board key="none" board={currentBoard} onClick={clickSquare} />
                </div>
                <div className="game-info">
                    <div className="status">{status}</div>
                    <ol>{moveList}</ol>
                </div>
            </div>
        );
    });
});

export default Game;
