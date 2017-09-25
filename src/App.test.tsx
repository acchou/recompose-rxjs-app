import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Rx from "rxjs";
import * as Recompose from "recompose";
import rxjsConfig from "recompose/rxjsObservableConfig";
import App from "./App";
import { MoveIndexType, SquareIndexType, GameViewModel } from "./TicTacToeViewModel";

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
    const stop$ = new Rx.Subject<void>();
    const game$ = GameViewModel({ clickSquare$, clickMove$ });
    return { clickSquare$, clickMove$, game$, stop$ };
}

const emptyBoard = new Array(9).fill(undefined);

describe("TicTacToe view model", () => {
    // Test with TestScheduler
    it("starts with an empty board, no winner, and player 'X' next", () => {
        const testScheduler = new Rx.TestScheduler(deepEquals);
        const clickSquare$ = testScheduler.createHotObservable<SquareIndexType>("");
        const clickMove$ = testScheduler.createHotObservable<MoveIndexType>("");
        const game$ = GameViewModel({ clickSquare$, clickMove$ });

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

    it("starts with an empty board, no winner, and player 'X' next (using promises)", async () => {
        const { game$, stop$ } = setupTest();

        function input() {
            stop$.next();
        }
        setTimeout(input, 0);

        const result = await game$.takeUntil(stop$).toPromise();

        function validate() {
            expect(result.currentBoard).toEqual(emptyBoard);
            expect(result.history).toEqual([emptyBoard]);
            expect(result.winner).toBeUndefined();
            expect(result.nextPlayer).toEqual("X");
        }
        validate();
    });

    // Test using marble diagrams and TestScheduler.
    it("places an 'X' on the first square clicked", () => {
        const testScheduler = new Rx.TestScheduler(deepEquals);
        const clickSquare$ = testScheduler.createHotObservable<SquareIndexType>("-5");
        const clickMove$ = testScheduler.createHotObservable<MoveIndexType>("");
        const game$ = GameViewModel({ clickSquare$, clickMove$ });

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

    it("places an 'X' on the first square clicked (using promises)", async () => {
        const { clickSquare$, game$, stop$ } = setupTest();

        const square = 5;
        function input() {
            clickSquare$.next(square);
            stop$.next();
        }
        setTimeout(input, 0);

        const result = await game$.takeUntil(stop$).toPromise();

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
    it("places an 'X' on the first square clicked - for all squares", async () => {
        async function testFirstClick(square: SquareIndexType) {
            const { clickSquare$, game$, stop$ } = setupTest();

            function input() {
                clickSquare$.next(square);
                stop$.next();
            }
            setTimeout(input, 0);

            const result = await game$.takeUntil(stop$).toPromise();

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
            testFirstClick(idx as SquareIndexType);
        }
    });

    it("detects a winner", async () => {
        const { clickSquare$, game$, stop$ } = setupTest();

        function input() {
            const moves = [0, 3, 1, 4, 2];
            moves.forEach((square: SquareIndexType) => clickSquare$.next(square));
            stop$.next();
        }
        setTimeout(input, 0);

        const result = await game$.takeUntil(stop$).toPromise();

        expect(result.winner).toBe("X");
    });

    it("moves back to empty board when move 0 is clicked", async () => {
        const { clickSquare$, clickMove$, game$, stop$ } = setupTest();

        function input() {
            const moves = [0, 3, 1, 4, 2];
            moves.forEach((square: SquareIndexType) => clickSquare$.next(square));
            clickMove$.next(0);
            stop$.next();
        }
        setTimeout(input, 0);

        const result = await game$.takeUntil(stop$).toPromise();

        function validate() {
            expect(result.currentBoard).toEqual(emptyBoard);
            expect(result.winner).toBeUndefined();
            expect(result.history).toEqual([emptyBoard]);
            expect(result.nextPlayer).toBe("X");
        }
        validate();
    });

    it("moves back to empty board when move 0 is clicked", async () => {
        const { clickSquare$, clickMove$, game$, stop$ } = setupTest();

        function input() {
            const moves = [0, 3, 1, 4, 2];
            moves.forEach((square: SquareIndexType) => clickSquare$.next(square));
            clickMove$.next(0);
            stop$.next();
        }
        setTimeout(input, 0);

        const result = await game$.takeUntil(stop$).toPromise();

        function validate() {
            expect(result.currentBoard).toEqual(emptyBoard);
            expect(result.winner).toBeUndefined();
            expect(result.history).toEqual([emptyBoard]);
            expect(result.nextPlayer).toBe("X");
        }
        validate();
    });

    // Return a promise for the game state after processing `moves` up to `step`.
    function simulateStepForward(moves: SquareIndexType[], step: number) {
        const { clickSquare$, game$, stop$ } = setupTest();
        function input() {
            moves.slice(0, step).forEach((square: SquareIndexType) => clickSquare$.next(square));
            stop$.next();
        }
        setTimeout(input, 0);
        return game$.takeUntil(stop$).toPromise();
    }

    // Return a promise for the game state after processing all of the moves, then
    // clicking on `step` in the move history to return to that step.
    function simulateMoveHistory(moves: SquareIndexType[], step: number) {
        const { clickSquare$, clickMove$, game$, stop$ } = setupTest();
        function input() {
            moves.forEach((square: SquareIndexType) => clickSquare$.next(square));
            clickMove$.next(moves.length - 1);
            stop$.next();
        }
        setTimeout(input, 0);
        return game$.takeUntil(stop$).toPromise();
    }

    it("clicking on move history is equivalent to stepping forward to the same move", () => {
        // Validate that the game state moving forwards or backwards is equivalent at
        // each step of the move history
        function checkEquivalence(moves: SquareIndexType[]) {
            moves.forEach(async (_, step) => {
                const resultFromMoveHistory = await simulateMoveHistory(moves, step);
                const resultSteppingForwards = await simulateStepForward(moves, step);
                expect(resultFromMoveHistory).toEqual(resultSteppingForwards);
            });
        }
        checkEquivalence([0, 3, 1, 4, 2]);
        checkEquivalence([4, 5, 7, 8, 1]);
    });
});
