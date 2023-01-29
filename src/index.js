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
const artStyles = require('./artStyles.json');

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
  // Select a random index from the array
  const randomIndex = Math.floor(Math.random() * artStyles.length);
  // Select the "name" attribute from the random option
  const randomArtStyle = artStyles[randomIndex].name;
  console.log(`Art Style: ${randomArtStyle}`)
  let response;
  const prompt =
    `Use the following words as the object of an image: ${words}. Create a caption that would make an image AI generate an amazing picture. Include the following art type #${randomArtStyle} at the end of the caption`;
  console.log("Prompt: " + prompt);

  try{
    response = await createPrompt(prompt);
  } catch {
    console.error("Creation of prompt failed, retrying");
    sleep(10000);
    response = await createPrompt(prompt);
  }

  const res = response.data.choices[0].text;
  console.log(`Caption: ${res}`);
  return res;
};

const createPrompt = async (prompt) => {
  return await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0,
    max_tokens: 50,
  });
};

const getImage = async (caption) => {
  let response;
  try {
    response = await genImage(caption);
    console.log(`Image generation response: ${response.status}, ${response.statusText}`)
  } catch (error) {
    console.log(`Image generation response: ${error.response.status}, ${error.response.statusText}`)
    console.error("Creation of image failed, retrying");
    sleep(10000);
    response = await getImage(caption);
  }
  imageData = response.data.data[0].url;
  return imageData;
};

const genImage = async (caption) => {
  return await openai.createImage({
    prompt: caption,
    n: 1,
    size: "1024x1024",
  });
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
      console.log("Image converted to .JPG successfully");
    })
    .catch((err) => {
      console.error("Error converting image:", err);
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
  await ig.publish.photo({
    file: imageBuffer,
    caption: `${caption}\n#AI #AIArt #AIArtwork #AIArtCommunity`,
  });
};

async function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}


const main = async () => {
  const words = await getRandomWords();
  console.log(`Words generated: ${words}`)
  const caption = await getImageCaption(words);
  const imgData = await getImage(caption);
  await saveImage(imgData);
  await convertToJPEG();

  let imgUrl;

  try {
    imgUrl = await imgurUpload(caption);
    console.log("Uploaded to Imgur Successfully")
  } catch {
    console.error("Upload image to Imgur failed, retrying");
    sleep(10000);
    imgUrl = await imgurUpload(caption);
  }

  try {
    await postImage(imgUrl, caption);
    console.log("Uploaded to Instagram Successfully")
  } catch {
    console.error("Upload image to Instagram failed, retrying");
    sleep(10000);
    await postImage(imgUrl, caption);
  }
  
  console.log("Completed");
};

main();
