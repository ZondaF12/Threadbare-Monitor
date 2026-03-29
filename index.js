require("dotenv").config();
const got = require("got");

const DEFAULT_PRODUCTS_JSON_URL =
    "https://www.33-mm.com/collections/t-shirts-and-tank-tops/products.json";

const WATCHES = [
    {
        productId: 8226544943316,
        variantId: 44686354940116,
        productsUrl: DEFAULT_PRODUCTS_JSON_URL,
        delayAfterMs: 5000,
    },
    {
        productId: 8226544943316,
        variantId: 44907197006036,
        productsUrl: DEFAULT_PRODUCTS_JSON_URL,
        delayAfterMs: 5000,
    },
    {
        productId: 8999808401620,
        variantId: 47293250961620,
        productsUrl: "https://www.33-mm.com/collections/knitwear/products.json",
        delayAfterMs: 300000,
    },
];

let previouslyInStock = [];
let shouldExit = false;

function requestShutdown() {
    shouldExit = true;
}

process.once("SIGINT", requestShutdown);
process.once("SIGTERM", requestShutdown);

function delayChunk(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function delay(delayMs) {
    const chunkMs = 1000;
    let remaining = delayMs;
    while (remaining > 0 && !shouldExit) {
        const step = Math.min(chunkMs, remaining);
        await delayChunk(step);
        remaining -= step;
    }
}

async function sendPingNotification(product, size, wasAvailable, storeOrigin) {
    const url = process.env.PING_URL;
    if (!url) {
        console.error("PING_URL is not set");
        return;
    }

    const message =
        wasAvailable === false
            ? `${product.title} (${size.title}) is back in stock.`
            : `${product.title} (${size.title}) is in stock.`;

    const body = {
        message,
        title: `In stock: ${product.title}`,
        subtitle: size.title,
        url: `${storeOrigin}/products/${product.handle}`,
        image_url: product.images?.[0]?.src ?? "",
    };

    try {
        await got.post(url, {
            json: body,
            responseType: "json",
        });
    } catch (err) {
        console.error("Ping request failed:", err.message);
    }
}

async function main() {
    while (!shouldExit) {
        for (const watch of WATCHES) {
            if (shouldExit) break;
            await checkAvailable(
                watch.productId,
                watch.variantId,
                watch.productsUrl,
            );
            if (shouldExit) break;
            await delay(watch.delayAfterMs);
        }
    }
}

async function checkAvailable(
    productID,
    sizeID,
    productsUrl = DEFAULT_PRODUCTS_JSON_URL,
) {
    const storeOrigin = new URL(productsUrl).origin;
    const randomNumber = Math.floor(Math.random() * 100000);
    const fetchUrl = new URL(productsUrl);
    fetchUrl.searchParams.set("limit", String(randomNumber));

    try {
        const res = await got.get(fetchUrl.toString(), {
            responseType: "json",
        });

        const obj = res.body;
        const product = obj.products.find((el) => el.id === productID);
        if (!product) return;

        const size = product.variants.find((el) => el.id === sizeID);
        if (!size) return;

        const prev = previouslyInStock.find((el) => el.id === sizeID);
        const wasAvailable = prev?.available;

        let index = previouslyInStock.findIndex((e) => e.id === sizeID);

        if (prev) {
            if (prev.available !== size.available) {
                previouslyInStock[index].available = size.available;
            } else {
                console.log("still out of stock");
            }
        } else {
            console.log("adding to object");
            previouslyInStock.push({ id: sizeID, available: size.available });
            index = previouslyInStock.findIndex((e) => e.id === sizeID);
        }

        const shouldNotify =
            size.available === true &&
            (wasAvailable === false || wasAvailable === undefined);

        if (shouldNotify) {
            await sendPingNotification(
                product,
                size,
                wasAvailable,
                storeOrigin,
            );
        }
    } catch (err) {
        console.error("Check failed:", err.message);
    }
}

main().catch(console.error);
