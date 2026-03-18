require("dotenv").config();
const got = require("got");
const { Client, Intents, MessageEmbed } = require("discord.js");

let previouslyInStock = [];

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS, //adds server functionality
        Intents.FLAGS.GUILD_MESSAGES, //gets messages from our bot.
    ],
});

client.once("ready", async () => {
    console.log("Ready!");
    await main();
});

function delay(delayInms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
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
    let res;

    let randomNumber = Math.floor(Math.random() * 100000);

    try {
        res = await got.get(
            `https://www.33-mm.com/collections/knitwear/products.json?limit=${randomNumber}`,
        );

        const obj = JSON.parse(res.body);

        let product = await obj.products.find((el) => el.id === productID);

        let size = await product.variants.find((el) => el.id === sizeID);

        let index = previouslyInStock.findIndex((e) => e.id === sizeID);

        if (previouslyInStock.find((el) => el.id === sizeID)) {
            if (previouslyInStock[index].available != size.available) {
                previouslyInStock[index].available = size.available;
            } else {
                console.log("still out of stock");
            }
        } else {
            console.log("adding to object");

            previouslyInStock.push({ id: sizeID, available: size.available });
            index = previouslyInStock.findIndex((e) => e.id === sizeID);
        }

        if (size.available && !previouslyInStock[index].available) {
            await discordMessage();
        }
    } catch (err) {
        console.log(err);
    }
}

async function discordMessage() {
    const channel = client.channels.cache.get("891751964545781810");

    const embed = new MessageEmbed()
        .setColor("#fd2973")
        .setTitle("Product In Stock")
        .setURL(`https://www.33-mm.com/products/royce-jumper-light-grey`)
        .setTimestamp()
        .setFooter({
            text: "Made by Roo#7777",
            iconURL:
                "https://i.ibb.co/VDMp2Bx/0e58a19b5a24f0542691313ff5106e40-1.png",
        });

    channel.send({ content: "<@181094829500006400>", embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN);
