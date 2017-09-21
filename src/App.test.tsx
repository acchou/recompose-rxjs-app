import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Rx from "rxjs";
import * as Recompose from "recompose";
import rxjsConfig from "recompose/rxjsObservableConfig";
import App from "./App";
import {
    SquareValueType,
    MoveIndexType,
    BoardType,
    SquareIndexType,
    GameViewModel,
    GameState
} from "./TicTacToeViewModel";

it("renders without crashing", () => {
    const div = document.createElement("div");
    ReactDOM.render(<App />, div);
});

beforeAll(() => {
    // Use RxJS for Recompose's observable interface by default.
    Recompose.setObservableConfig(rxjsConfig);
});

function deepEquals(x: {}, y: {}): boolean {
    expect(x).toEqual(y);
    // This looks odd, but we use Jest to report errors on the line above
    // and don't rely on TestScheduler's internal check.
    return true;
}

describe("TicTacToe view model", () => {
    it("starts with an empty board", () => {
        const testScheduler = new Rx.TestScheduler(deepEquals);
        const clickSquare$ = testScheduler.createHotObservable<SquareIndexType>("");
        const clickMove$ = testScheduler.createHotObservable<MoveIndexType>("");

        const game$ = GameViewModel({ clickSquare$, clickMove$ });

        const emptyBoard = new Array(9).fill(undefined);
        const expected = {
            0: {
                currentBoard: emptyBoard,
                history: [emptyBoard],
                winner: undefined,
                nextPlayer: "X"
            }
        };

        testScheduler.expectObservable(game$).toBe("0", expected);
        testScheduler.flush();
    });
});
