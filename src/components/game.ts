const UI: Record<string, (ctx: CanvasRenderingContext2D) => void> = {};
const camera = { x: 0, y: 0 };
let board: Record<number, Record<number, true>> = {};
let frames = 0;
let zoom = 15;
let fps = 0;
let tps = 5;
const snooze = (ms: number) =>
    new Promise((resolver) => setTimeout(resolver, ms));

board[-1] = {};
board[1] = {};
board[0] = {};
let running = true;
let paused = true;

UI["coords"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(
        `xy: ${Math.round(camera.x)}, ${Math.round(camera.y)}`,
        10,
        100
    );
};

UI["fps"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText("fps: " + fps, 10, 50);
};
UI["tps"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`tps: ${tps}`, 10, 150);
};
UI["zoom"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`zoom: ${zoom.toFixed(1)}`, 10, 200);
};
UI["paused"] = (ctx) => {
    ctx.font = "30px Arial";
    paused ? ctx.fillText(`paused`, 10, ctx.canvas.height - 25) : null;
};

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
            if (!board[x][y]) continue;
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
            const amount = Math.abs(e.deltaY) / 100 + 1;
            if (e.deltaY > 0) {
                zoom /= amount;
            } else {
                zoom *= amount;
            }
        }
    });
    window.addEventListener("resize", resize);
    let down = false;
    let last = { x: 0, y: 0 };
    let drag = false;

    document.addEventListener("mousedown", (e) => {
        down = true;
        drag = false;
        last = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener("keydown", (e) => {
        if (e.key == "r") {
            camera.x = 0;
            camera.y = 0;
            zoom = 15;
            board = {};
            paused = true;
            tps = 5;
        } else if (e.key == " ") {
            paused = !paused;
        } else if (e.code == "ArrowUp") {
            tps += Math.round(e.shiftKey ? tps : 1);
        } else if (e.code == "ArrowDown" && tps > 0) {
            tps -= Math.round(e.shiftKey ? tps / 2 : 1);
        }
        if (tps < 0) tps = 0;
    });
    document.addEventListener("mousemove", (e) => {
        drag = true;
        if (down) {
            const difference = { x: last.x - e.clientX, y: last.y - e.clientY };
            camera.x -= difference.x / zoom;
            camera.y -= difference.y / zoom;
            last = { x: e.clientX, y: e.clientY };
        }
    });
    document.addEventListener("mouseup", (e) => {
        down = false;
        if (!drag) {
            const { x, y } = e;
            const blockx = Math.floor(
                x / zoom - canvas.width / zoom / 2 - camera.x
            );
            const blocky = Math.floor(
                y / zoom - canvas.height / zoom / 2 - camera.y
            );
            if (!board[blockx]) {
                board[blockx] = {};
            }
            if (!board[blockx][blocky]) {
                board[blockx][blocky] = true;
            } else {
                delete board[blockx][blocky];
            }
        }
    });
    const interval = setInterval(() => {
        render(ctx);
    }, (1 / 60) * 1000);
    const fpsinterval = setInterval(() => {
        fps = frames;
        frames = 0;
    }, 1000);
    (async () => {
        while (running) {
            if (!paused) {
                tick();
            }
            await snooze(1000 / tps);
        }
    })();
    return () => {
        window.removeEventListener("resize", resize);
        clearInterval(interval);
        clearInterval(fpsinterval);
        running = false;
    };
}

export default game;
