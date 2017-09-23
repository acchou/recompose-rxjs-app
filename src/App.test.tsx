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

function setupTest() {
    const clickSquare$ = new Rx.Subject<SquareIndexType>();
    const clickMove$ = new Rx.Subject<MoveIndexType>();
    const game$ = GameViewModel({ clickSquare$, clickMove$ });
    return { clickSquare$, clickMove$, game$ };
}

describe("TicTacToe view model", () => {
    // Test with TestScheduler
    it("starts with an empty board, no winner, and player 'X' next", () => {
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

    // Test using toPromise()
    it("starts with an empty board", async () => {
        const { game$ } = setupTest();
        const result = await game$.take(1).toPromise();
        const emptyBoard = new Array(9).fill(undefined);
        expect(result.currentBoard).toEqual(emptyBoard);
    });

    // Test using marble diagrams and TestScheduler.
    it("places the 'X' on the first square clicked", () => {
        const testScheduler = new Rx.TestScheduler(deepEquals);
        const clickSquare$ = testScheduler.createHotObservable<SquareIndexType>("-5");
        const clickMove$ = testScheduler.createHotObservable<MoveIndexType>("");
        const game$ = GameViewModel({ clickSquare$, clickMove$ });

        const emptyBoard = new Array(9).fill(undefined);
        let firstMove = emptyBoard.slice();
        firstMove[5] = "X";

        const expected = {
            0: {
                currentBoard: emptyBoard,
                history: [emptyBoard],
                winner: undefined,
                nextPlayer: "X"
            },
            1: {
                currentBoard: firstMove,
                history: [emptyBoard, firstMove],
                winner: undefined,
                nextPlayer: "O"
            }
        };

        testScheduler.expectObservable(game$).toBe("01", expected);
        testScheduler.flush();
    });

    // Async test using toPromise and setTimeout to defer hot observable events
    // until game$ is subscribed.
    it("places an 'X' on the first square clicked 2", async () => {
        const { clickSquare$, game$ } = setupTest();

        const square = 5;
        function input() {
            clickSquare$.next(square);
        }
        setTimeout(input, 0);

        const result = await game$.take(2).toPromise();

        function validate() {
            const board = result.currentBoard;
            expect(board[square]).toEqual("X");
            board.forEach((value, index) => {
                if (square !== index) {
                    expect(board[index]).toBeUndefined();
                }
            });
        }
        validate();
    });

    // Advanced test that loops an async function call
    it("places an 'X' on the first square clicked 2", async () => {
        async function testFirstClick(square: SquareIndexType) {
            const { clickSquare$, game$ } = setupTest();

            function input() {
                clickSquare$.next(square);
            }
            setTimeout(input, 0);

            const result = await game$.take(2).toPromise();

            function validate() {
                const board = result.currentBoard;
                expect(board[square]).toEqual("X");
                board.forEach((value, index) => {
                    if (square !== index) {
                        expect(board[index]).toBeUndefined();
                    }
                });
            }
            validate();
        }

        for (let idx = 0; idx < 9; idx++) {
            await testFirstClick(idx as SquareIndexType);
        }
    });

    it("detects a winner", async () => {
        const { clickSquare$, game$ } = setupTest();

        const moves = [0, 3, 1, 4, 2];
        function input() {
            moves.forEach((square: SquareIndexType) => clickSquare$.next(square));
        }
        setTimeout(input, 0);

        const result = await game$.take(moves.length).toPromise();

        function validate() {
            expect(result.winner).toBe("X");
            console.log(result);
        }
        validate();
    });
});
