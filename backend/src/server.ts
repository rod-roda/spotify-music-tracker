import { requireEnv } from "./config/env";
import { buildApp } from "./app";

const app = buildApp();
const PORT = Number(requireEnv("PORT")) || 3333;

app.listen({ port: PORT }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});