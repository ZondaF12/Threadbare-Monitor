require("dotenv").config();
const got = require("got");

let previouslyInStock = [];

function delay(delayInms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}

async function sendPingNotification(product, size, wasAvailable) {
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
        url: `https://www.33-mm.com/products/${product.handle}`,
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
    while (true) {
        await checkAvaliable(8999808401620, 47293250928852);
        await delay(8000);
        await checkAvaliable(8999808401620, 47293250961620);
        await delay(300000);
    }
}

async function checkAvaliable(productID, sizeID) {
    const randomNumber = Math.floor(Math.random() * 100000);

    try {
        const res = await got.get(
            `https://www.33-mm.com/collections/knitwear/products.json?limit=${randomNumber}`,
        );

        const obj = JSON.parse(res.body);
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
            await sendPingNotification(product, size, wasAvailable);
        }
    } catch (err) {
        console.log(err);
    }
}

main().catch(console.error);
