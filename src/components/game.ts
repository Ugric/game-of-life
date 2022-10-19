const UI: Record<string, (ctx: CanvasRenderingContext2D) => void> = {};
const camera = { x: 20, y: -20 };
let board: Record<number, Record<number, true>> = {};
let frames = 0;
let zoom = 15;

board[-1] = {};
board[1] = {};
board[0] = {};
board[-1][-1] = true;
board[-1][0] = true;
board[-1][1] = true;
board[0][1] = true;
board[1][0] = true;

const render = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // ctx.beginPath();
    // ctx.rect(0, 0, width / 10, width / 10);
    // ctx.fillStyle = "white";
    // ctx.fill();

    ctx.fillStyle = "white";

    for (const xstr of Object.keys(board)) {
        const x: number = Number(xstr);
        for (const ystr of Object.keys(board[x])) {
            const y: number = Number(ystr);
            ctx.beginPath();
            ctx.rect(
                x * zoom + width / 2 + camera.x * zoom,
                y * zoom + height / 2 + camera.y * zoom,
                zoom,
                zoom
            );
            ctx.fill();
        }
    }

    Object.keys(UI).map((key) => UI[key](ctx));
    frames++;
};

function tick() {
    const newboard: Record<number, Record<number, true>> = {};
    const empty: Array<[number, number]> = [];
    for (const xstr of Object.keys(board)) {
        const x: number = Number(xstr);
        for (const ystr of Object.keys(board[x])) {
            const y: number = Number(ystr);
            let naubours = 0;
            for (let nx = -1; nx <= 1; nx++) {
                for (let ny = -1; ny <= 1; ny++) {
                    if (nx != 0 || ny != 0) {
                        if (board?.[x + nx]?.[y + ny]) naubours++;
                        else {
                            empty.push([x + nx, y + ny]);
                        }
                    }
                }
            }
            if (naubours == 2 || naubours == 3) {
                if (!newboard[x]) {
                    newboard[x] = {};
                }
                newboard[x][y] = true;
            }
        }
    }
    for (const [x, y] of empty) {
        let naubours = 0;
        for (let nx = -1; nx <= 1; nx++) {
            for (let ny = -1; ny <= 1; ny++) {
                if (nx != 0 || ny != 0) {
                    if (board?.[x + nx]?.[y + ny]) naubours++;
                }
            }
        }
        if (naubours == 3) {
            if (!newboard[x]) {
                newboard[x] = {};
            }
            newboard[x][y] = true;
        }
    }
    board = newboard;
}

function game(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render(ctx);
    };
    window.addEventListener("wheel", (e) => {
        if (e.deltaY != 0) {
            if (e.deltaY > 0) {
                zoom /= 2;
            } else {
                zoom *= 2;
            }
        }
    });
    window.addEventListener("resize", resize);
    let down = false;
    let last = { x: 0, y: 0 };

    document.addEventListener("mousedown", (e) => {
        down = true;
        last = { x: e.clientX, y: e.clientY };
    });
    document.addEventListener("mousemove", (e) => {
        if (down) {
            const difference = { x: last.x - e.clientX, y: last.y - e.clientY };
            camera.x -= difference.x / zoom;
            camera.y -= difference.y / zoom;
            last = { x: e.clientX, y: e.clientY };
        }
    });
    document.addEventListener("mouseup", () => (down = false));
    const interval = setInterval(() => {
        render(ctx);
    }, (1 / 60) * 1000);
    const fpsinterval = setInterval(() => {
        const fps = frames;
        frames = 0;
        UI["fps"] = (ctx) => {
            ctx.font = "30px Arial";
            ctx.fillText("fps: " + fps, 10, 50);
        };
    }, 1000);
    const tickinterval = setInterval(() => {
        tick();
    }, 100);
    return () => {
        window.removeEventListener("resize", resize);
        clearInterval(interval);
        clearInterval(tickinterval);
        clearInterval(fpsinterval);
    };
}

export default game;
