import "dotenv/config";
import { buildApp } from "./app";

const app = buildApp();
const PORT = Number(process.env.PORT) || 3333;

app.listen({ port: PORT }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});