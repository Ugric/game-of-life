const UI: Record<string, (ctx: CanvasRenderingContext2D) => void> = {};
const camera = { x: 0, y: 0 };
let board: Record<number, Record<number, true>> = {};
let frames = 0;
let zoom = 15;
let fps = 0;
let tps = 5;
let blocks = 0;
let gen = 0;
let currenttps = 0;
const defaultsave = `{
    "g": {
        "0": { "-5": true, "-9": true },
        "2": { "-9": true, "-10": true, "-5": true, "-4": true },
        "3": {},
        "4": {},
        "5": {},
        "6": {},
        "7": {},
        "8": {},
        "9": {},
        "10": {},
        "11": {},
        "12": { "-8": true, "-7": true },
        "13": { "-8": true, "-7": true },
        "-22": { "-6": true, "-5": true },
        "-21": { "-5": true, "-6": true },
        "-20": {},
        "-19": {},
        "-18": {},
        "-17": {},
        "-16": {},
        "-15": {},
        "-14": {},
        "-13": {},
        "-12": { "-6": true, "-5": true, "-4": true },
        "-11": { "-3": true, "-7": true },
        "-10": { "-2": true, "-8": true },
        "-8": { "-5": true },
        "-9": { "-2": true, "-8": true },
        "-6": { "-6": true, "-5": true, "-4": true },
        "-7": { "-3": true, "-7": true },
        "-5": { "-5": true },
        "-3": {},
        "-2": { "-6": true, "-7": true, "-8": true },
        "-1": { "-6": true, "-7": true, "-8": true }
    }
}`;
const snooze = (ms: number) =>
    new Promise((resolver) => setTimeout(resolver, ms));
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
    ctx.fillText(`tps (0 = ∞): ${tps}`, 10, 150);
};
UI["zoom"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`zoom: ${zoom.toFixed(1)}`, 10, 200);
};
UI["currenttps"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`current tps: ${currenttps}`, 10, 250);
};
UI["blocks"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`blocks: ${blocks}`, 10, 300);
};

UI["gen"] = (ctx) => {
    ctx.font = "30px Arial";
    ctx.fillText(`gen: ${gen}`, 10, 350);
};

UI["paused"] = (ctx) => {
    ctx.font = "30px Arial";
    paused ? ctx.fillText(`paused`, 10, ctx.canvas.height - 25) : null;
};

const render = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "white";
    const visable = Math.max(zoom, 1);
    blocks = 0;
    for (const xstr of Object.keys(board)) {
        const x: number = Number(xstr);
        blocks += Object.keys(board[x]).length;
        for (const ystr of Object.keys(board[x])) {
            const y: number = Number(ystr);
            ctx.beginPath();
            ctx.rect(
                x * zoom + width / 2 + camera.x * zoom,
                y * zoom + height / 2 + camera.y * zoom,
                visable,
                visable
            );
            ctx.fill();
        }
    }
    // if (zoom > 10) {
    //     ctx.strokeStyle = "#1f1f1f";
    //     const scrollX = (camera.x % 1) * zoom;
    //     const scrollY = (camera.y % 1) * zoom;
    //     for (let x = 0; x < width / zoom; x++) {
    //         const coord = x * zoom + width / 2 + camera.x * zoom;
    //         ctx.beginPath();
    //         ctx.moveTo(coord, 0);
    //         ctx.lineTo(coord, height);
    //         ctx.stroke();
    //     }
    //     for (let y = 0; y < height / zoom; y++) {
    //         const coord = y * zoom;
    //         ctx.beginPath();
    //         ctx.moveTo(0, coord + 1);
    //         ctx.lineTo(width, coord + 1);
    //         ctx.stroke();
    //     }
    // }

    Object.keys(UI).map((key) => UI[key](ctx));
    frames++;
};

function tick() {
    const newboard: Record<number, Record<number, true>> = {};
    const empty: Record<string, { n: number; coord: [number, number] }> = {};
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
                            const coord = `${x + nx}x${y + ny}`;
                            if (!empty[coord])
                                empty[coord] = {
                                    n: 0,
                                    coord: [x + nx, y + ny],
                                };
                            empty[coord].n++;
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
    for (const key of Object.keys(empty)) {
        if (empty[key].n == 3) {
            const [x, y] = empty[key].coord;
            if (!newboard[x]) {
                newboard[x] = {};
            }
            newboard[x][y] = true;
        }
    }
    board = newboard;
    gen++;
}

function load(char: string) {
    const loaded = JSON.parse(localStorage.getItem("save") || defaultsave);
    if (!loaded[char]) return alert("cant load!");
    board = loaded[char];
}
function save(char: string) {
    const loaded = JSON.parse(localStorage.getItem("save") || defaultsave);
    loaded[char] = board;
    localStorage.setItem("save", JSON.stringify(loaded));
    alert("saved!");
}

function game(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let ticks = 0;
    let down = false;
    let last = { x: 0, y: 0 };
    let drag = false;
    let saving = false;
    let loading = false;
    let autohidecursor: NodeJS.Timer | null = null;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render(ctx);
    };
    const wheel = (e: WheelEvent) => {
        if (e.deltaY != 0) {
            const amount = Math.abs(e.deltaY) / 100 + 1;
            if (e.deltaY > 0) {
                zoom /= amount;
            } else {
                zoom *= amount;
            }
        }
    };
    const mousedown = (e: MouseEvent) => {
        if (e.button == 0) {
            down = true;
            drag = false;
            last = { x: e.clientX, y: e.clientY };
        }
    };
    const keydown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "l") {
            e.preventDefault();
            loading = true;
        } else if (e.ctrlKey && e.key === "i") {
            e.preventDefault();
            const width = Math.min(canvas.width / zoom, 500);
            const height = Math.min(canvas.height / zoom, 500);
            const xnow = Math.round(camera.x + width / 2);
            const ynow = Math.round(camera.y + height / 2);
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (!board[x - xnow]) {
                        board[x - xnow] = {};
                    }
                    if (Math.random() > 0.5) {
                        board[x - xnow][y - ynow] = true;
                    } else {
                        delete board[x - xnow][y - ynow];
                    }
                }
            }
        } else if (e.ctrlKey && e.key === "m") {
            e.preventDefault();
            const width = Math.min(canvas.width / zoom, 500);
            const height = Math.min(canvas.height / zoom, 500);
            const xnow = Math.round(camera.x + width / 2);
            const ynow = Math.round(camera.y + height / 2);
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (!board[x - xnow]) {
                        board[x - xnow] = {};
                    }
                    board[x - xnow][y - ynow] = true;
                }
            }
        } else if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
            saving = true;
        } else if (e.ctrlKey && e.key === "r") {
            e.preventDefault();
            camera.x = 0;
            camera.y = 0;
            zoom = 15;
            board = {};
            paused = true;
            tps = 5;
            gen = 0;
        } else if (saving) {
            saving = false;
            save(e.key);
        } else if (loading) {
            loading = false;
            load(e.key);
        } else if (e.key == " ") {
            paused = !paused;
            canvas.style.cursor = paused ? "" : "none";
        } else if (e.code == "ArrowUp") {
            tps += Math.round(e.shiftKey ? tps : 1);
        } else if (e.code == "ArrowDown" && tps > 0) {
            tps -= Math.round(e.shiftKey ? tps / 2 : 1);
        }
        if (tps < 0) tps = 0;
    };
    const mousemove = (e: MouseEvent) => {
        drag = true;
        if (autohidecursor) {
            clearTimeout(autohidecursor);
        }
        canvas.style.cursor = "";
        if (!paused)
            autohidecursor = setTimeout(
                () => (canvas.style.cursor = "none"),
                5000
            );
        if (down) {
            canvas.style.cursor = "move";
            const difference = {
                x: last.x - e.clientX,
                y: last.y - e.clientY,
            };
            camera.x -= difference.x / zoom;
            camera.y -= difference.y / zoom;
            last = { x: e.clientX, y: e.clientY };
        }
    };
    const mouseup = (e: MouseEvent) => {
        down = false;
        canvas.style.cursor = "";
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
    };
    (async () => {
        while (running) {
            let delta = 0;
            if (!paused) {
                const start = Date.now();
                tick();
                ticks++;
                delta = Date.now() - start;
            }
            await snooze(Math.max(1000 / tps - delta, 0));
        }
    })();
    const interval = setInterval(() => {
        render(ctx);
    }, (1 / 60) * 1000);
    const fpsinterval = setInterval(() => {
        fps = frames;
        frames = 0;
    }, 1000);
    const tpsinterval = setInterval(() => {
        currenttps = ticks;
        ticks = 0;
    }, 1000);
    window.addEventListener("resize", resize);
    window.addEventListener("wheel", wheel);
    document.addEventListener("keydown", keydown);
    document.addEventListener("mousedown", mousedown);
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
    return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("wheel", wheel);
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("mousedown", mousedown);
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
        clearInterval(interval);
        clearInterval(fpsinterval);
        clearInterval(tpsinterval);
        running = false;
    };
}

export default game;
