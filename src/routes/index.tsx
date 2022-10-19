import {
    component$,
    useClientEffect$,
    useSignal,
    useStore,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import game from "~/components/game";
import styles from "../../styles/game.module.css";

export default component$(() => {
    const mycanvas = useSignal<HTMLCanvasElement>();
    const size = useStore({
        width: 0,
        height: 0,
    });
    useClientEffect$(() => {
        size.width = window.innerWidth;
        size.height = window.innerHeight;
        return mycanvas.value ? game(mycanvas.value) : void 0;
    });
    return (
        <canvas
            className={styles.canvas}
            width={size.width}
            height={size.height}
            ref={mycanvas}
        ></canvas>
    );
});

export const head: DocumentHead = {
    title: "Welcome to Qwik",
};
