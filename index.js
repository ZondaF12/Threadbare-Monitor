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
    await checkAvaliable(6720326140036, 40013517029508);
    await delay(8000);
    await checkAvaliable(6720326140036, 40013517062276);
    await delay(8000);
    await checkAvaliable(5141773779076, 34519185686660);
    await delay(8000);
    await checkAvaliable(5141773779076, 34519185719428);
    await delay(300000);
  }
}

async function checkAvaliable(productID, sizeID) {
  let res, index;

  let randomNumber = Math.floor(Math.random() * 100000);

  try {
    res = await got.get(
      `https://threadbare.com/collections/mens-trousers/products.json?limit=${randomNumber}`
    );

    const obj = JSON.parse(res.body);
    let product = await obj.products.find((el) => el.id === productID);

    let size = await product.variants.find((el) => el.id === sizeID);
    let test = await previouslyInStock.find((el) => el.id === sizeID);
    // console.log(test);

    if (test != "undefined") {
      index = previouslyInStock.findIndex((el) => el.id === sizeID);
    }

    // console.log(previouslyInStock);

    if (previouslyInStock === [] || test === undefined) {
      console.log("NEW");
      previouslyInStock.push({ id: sizeID, available: false });
      index = previouslyInStock.findIndex((e) => e.id === sizeID);
      // console.log(index);
    }

    if (size.available) {
      if (!previouslyInStock[index].available) {
        console.log("INSTOCK");
        await discordMessage();
        previouslyInStock[index].available = size.available;
      }
    } else {
      console.log("OOS");
      if (previouslyInStock[index].available === false) {
        previouslyInStock[index].available = size.available;
      }
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
    .setURL(
      `https://threadbare.com/products/mens-bloomfield-black-plain-cargo-trousers`
    )
    .setTimestamp()
    .setFooter({
      text: "Made by Roo#7777",
      iconURL:
        "https://i.ibb.co/VDMp2Bx/0e58a19b5a24f0542691313ff5106e40-1.png",
    });

  channel.send({ content: "<@181094829500006400>", embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN);
