import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Rx from "rxjs";
import * as Recompose from "recompose";
import rxjsConfig from "recompose/rxjsObservableConfig";
import App from "./App";
import {
    MoveIndexType,
    SquareIndexType,
    GameViewModel,
    clickSquare,
    clickMoveReducer,
    calculateWinner
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
    const stop$ = new Rx.Subject<void>();
    const game$ = GameViewModel({ clickSquare$, clickMove$ });
    return { clickSquare$, clickMove$, game$, stop$ };
}

const emptyBoard = new Array(9).fill(undefined);
const squares = emptyBoard.map((_, i) => i);

describe("Unit tests for TicTacToe reducers", () => {
    describe("clickSquare()", () => {
        it("modifies the board to indicate a click on the square", () => {
            squares.forEach(square => {
                const board = clickSquare(emptyBoard, "X", square);
                board.forEach((content, idx) => {
                    if (idx === square) {
                        expect(content).toEqual("X");
                    } else {
                        expect(content).toBeUndefined();
                    }
                });
            });
        });

        it("returns the same board if there's already a winner", () => {
            const board = emptyBoard.slice();
            board[0] = board[1] = board[2] = "X";
            squares.forEach(square => {
                expect(clickSquare(board, "O", square)).toBe(board);
                expect(clickSquare(board, "X", square)).toBe(board);
            });
        });
    });

    describe("clickMoveReducer()", () => {
        it("does nothing when the clicked move is the current move", () => {
            let emptyHistory = [emptyBoard];
            let board = emptyBoard.slice();
            board[0] = "X";
            let oneMove = [...emptyHistory, board];

            expect(clickMoveReducer(emptyHistory, emptyHistory.length)).toEqual(emptyHistory);
            expect(clickMoveReducer(oneMove, oneMove.length)).toEqual(oneMove);
        });

        it("returns to an empty history if the 0th move is clicked", () => {
            let emptyHistory = [emptyBoard];
            let board = emptyBoard.slice();
            board[0] = "X";
            let oneMove = [...emptyHistory, board];

            expect(clickMoveReducer(oneMove, 0)).toEqual(emptyHistory);
        });
    });

    describe("winner detector", () => {
        it("detects horizontal winners", () => {
            ["X", "O"].forEach(player => {
                [0, 1, 2].forEach(row => {
                    const board = emptyBoard.slice();
                    board[3 * row + 0] = board[3 * row + 1] = board[3 * row + 2] = player;
                    expect(calculateWinner(board)).toEqual(player);
                });
            });
        });

        it("detects vertical winners", () => {
            ["X", "O"].forEach(player => {
                [0, 1, 2].forEach(column => {
                    const board = emptyBoard.slice();
                    board[column] = board[3 + column] = board[6 + column] = player;
                    expect(calculateWinner(board)).toEqual(player);
                });
            });
        });

        it("detects diagonal winners", () => {
            ["X", "O"].forEach(player => {
                let board = emptyBoard.slice();
                board[0] = board[4] = board[8] = player;
                expect(calculateWinner(board)).toEqual(player);

                board = emptyBoard.slice();
                board[2] = board[4] = board[6] = player;
                expect(calculateWinner(board)).toEqual(player);
            });
        });

        it("detects when there is no winner", () => {
            expect(calculateWinner(emptyBoard)).toBeUndefined();
            const board = emptyBoard.slice();
            board[0] = board[1] = "X";
            expect(calculateWinner(board)).toBeUndefined();
        });
    });
});

describe("TicTacToe view model", () => {
    // Test with TestScheduler
    it("starts with an empty board, no winner, and player 'X' next (using marbles)", () => {
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
    it("places an 'X' on the first square clicked (using marbles)", () => {
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

        const promises = [];
        for (let idx = 0; idx < 9; idx++) {
            promises[idx] = testFirstClick(idx);
        }
        await Promise.all(promises);
    });

    it("detects a winner", async () => {
        const { clickSquare$, game$, stop$ } = setupTest();

        function input() {
            const moves = [0, 3, 1, 4, 2];
            moves.forEach(square => clickSquare$.next(square));
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
            moves.forEach(square => clickSquare$.next(square));
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
            moves.slice(0, step).forEach(square => clickSquare$.next(square));
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
            moves.forEach(square => clickSquare$.next(square));
            clickMove$.next(step);
            stop$.next();
        }
        setTimeout(input, 0);
        return game$.takeUntil(stop$).toPromise();
    }

    it("moves game state backward when a previous move is clicked (promises)", async () => {
        // Validate that the game state moving forwards or backwards is equivalent at
        // each step of the move history
        async function checkEquivalence(moves: SquareIndexType[]) {
            for (let step = 0; step < moves.length + 1; step++) {
                const backward = simulateMoveHistory(moves, step);
                const forward = simulateStepForward(moves, step);
                expect(await backward).toEqual(await forward);
            }
        }

        // Run these tests in parallel.
        const tests = [
            checkEquivalence([]),
            checkEquivalence([0, 3, 1, 4, 2]),
            checkEquivalence([4, 5, 7, 8, 1]),
            checkEquivalence([8, 4, 7, 2, 0, 1])
        ];
        await Promise.all(tests);
    });

    it("ignores clicks on already occupied squares", async () => {
        function clickTwice(square: SquareIndexType) {
            const { game$, clickSquare$, stop$ } = setupTest();
            function input() {
                clickSquare$.next(square);
                clickSquare$.next(square);
                stop$.next();
            }
            setTimeout(input, 0);
            return game$.takeUntil(stop$).toPromise();
        }

        function clickOnce(square: SquareIndexType) {
            const { game$, clickSquare$, stop$ } = setupTest();
            function input() {
                clickSquare$.next(square);
                stop$.next();
            }
            setTimeout(input, 0);
            return game$.takeUntil(stop$).toPromise();
        }

        for (let n = 0; n < 9; n++) {
            let resultClickOnce = clickOnce(n);
            let resultClickTwice = clickTwice(n);
            expect(await resultClickTwice).toEqual(await resultClickOnce);
        }
    });
});
