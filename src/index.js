//IMPORTS
require("dotenv").config();
const fs = require("fs");
const request = require("request");
const sharp = require("sharp");
const path = require("path");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const { IgApiClient } = require("instagram-private-api");
const { get } = require("request-promise");
const randomWords = require("random-words");

//CONFIG
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const username = process.env.username;
const password = process.env.password;
const imgur_token = process.env.imgur_token;
const imgPath = path.join(process.cwd(), "image.png");

const getRandomWords = async () => {
  return randomWords({ min: 2, max: 5, join: " " });
};

const getImageCaption = async (words) => {
  const prompt =
    "Use the following words as the object of an image, to create a caption that would make an image AI generate an amazing image, include a random style within the prompt: " +
    words;
  console.log("Prompt: " + prompt);

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0,
    max_tokens: 50,
  });

  const res = response.data.choices[0].text;
  console.log("Caption " + res);
  return res;
};

const getImage = async (caption) => {
  const response = await openai.createImage({
    prompt: caption,
    n: 1,
    size: "1024x1024",
  });
  imageData = response.data.data[0].url;
  return imageData;
};

const saveImage = async (imageData) => {
  const fileName = "image.png";

  return new Promise((resolve, reject) => {
    request(imageData)
      .pipe(fs.createWriteStream(fileName))
      .on("finish", resolve)
      .on("error", reject);
  });
};

const convertToJPEG = async () => {
  await sharp(imgPath)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile("image.jpg")
    .then(() => {
      console.log("image converted successfully");
    })
    .catch((err) => {
      console.log("error converting image:", err);
    });
};

const imgurUpload = async (caption) => {
  const newImgPath = path.join(process.cwd(), "image.jpg");
  const image = await readFileAsync(newImgPath, (encoding = null));

  var options = {
    method: "POST",
    url: "https://api.imgur.com/3/image",
    headers: {
      Authorization: "Bearer " + imgur_token,
      "Content-Type": "image/jpeg",
    },
    formData: {
      image: image,
      name: caption,
      type: "file",
      title: caption,
      description: "AI Image - @AImaginary_Creations Instagram",
    },
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) {
        reject(new Error(error));
      } else {
        console.log(response.body);
        const json = JSON.parse(response.body);
        // remove escape chars from link string
        const link = json.data.link.replace(/\\/g, "");
        console.log(link);
        resolve(link);
        return link;
      }
    });
  });
};

const postImage = async (imageUrl, caption) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  await ig.account.login(username, password);
  console.log("Logged in");
  const imageBuffer = await get({
    url: imageUrl,
    encoding: null,
  });

  console.log("Image Buffer Created");
  const publishRes = await ig.publish.photo({
    file: imageBuffer,
    caption: `${caption}\n#AI #AIArt #AIArtwork #AIArtCommunity`,
  });
};

const main = async () => {
  const words = await getRandomWords();
  const caption = await getImageCaption(words);
  const imgData = await getImage(caption);
  await saveImage(imgData);
  await convertToJPEG();
  const imgUrl = await imgurUpload(caption);
  await postImage(imgUrl, caption);
  console.log("Completed");
};

main();
