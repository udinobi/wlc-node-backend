import * as dotenv from "dotenv";

dotenv.config({ path : loadConfig() });

function loadConfig() {
    let arg = Object.values(process.argv).find(a => a.endsWith(".env"));
    if (typeof arg === "undefined") arg = "on-host.env";
    const path = `${process.cwd()}/assets/${arg}`;
    console.log(`Configuration loaded from "${path}"`);
    return path;
}
