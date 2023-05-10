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
const artists = require('./artists.json');

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
let randomArtStyle = null
let randomArtist = null
const current_time = new Date().getHours();

const getRandomWords = async () => {
  return randomWords({ min: 1, max: 3, join: " " });
};

const getImageCaption = async (words) => {
  let response;
  const prompt = `Use the following words: ${words}. Create a caption for an image that would make an image AI generator create an amazing picture.`;
  console.log("Prompt: " + prompt);

  try{
    response = await createPrompt(prompt);
  } catch {
    console.error("Creation of prompt failed, retrying");
    sleep(10000);
    response = await createPrompt(prompt);
  }

  const res = response.data.choices[0].message.content;
  console.log(`Caption: ${res}`);
  return res;
};

const createPrompt = async (prompt) => {
  return await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{"role":"user", "content": prompt}],
    temperature: 0
  });
};

const getImage = async (caption) => {
  let response;
  try {
    response = await genImage(caption);
    console.log(`\nImage generation response: ${response.status}, ${response.statusText}`)
  } catch (error) {
    console.log(`\nImage generation response: ${error.response.status}, ${error.response.statusText}`)
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
  await ig.simulate.preLoginFlow();
  console.log("\nInstagram logged in");
  const imageBuffer = await get({
    url: imageUrl,
    encoding: null,
  });

  console.log("Image Buffer Created");
  await ig.publish.photo({
    file: imageBuffer,
    caption: `${caption}\n#AI #AIArt #AIArtwork #AIArtCommunity #Dalle #Dalle2 #OpenAI`,
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
  let words = null
  let postDetails = null
  if (!!process.argv[2]) {
    words = process.argv[2];
  } else {
    words = await getRandomWords();
  }
  
  console.log(`Words generated: ${words}`)
  const caption = await getImageCaption(words);

  if (current_time % 2 === 0) {
    const randomIndex = Math.floor(Math.random() * artStyles.length);
    randomArtStyle = artStyles[randomIndex].name;
    console.log(`Art Style: ${randomArtStyle}`)
    imageCaption = caption + ` #${randomArtStyle.replace(/\s/g, "")}`
    postDetails = imageCaption + `\n\nThis piece is completed in the art style of ${artStyles[randomIndex].name}, ${artStyles[randomIndex].description}\n`
  } else {
    const randomIndex = Math.floor(Math.random() * artists.length);
    randomArtist = artists[randomIndex].name;
    console.log(`Artist Style: ${randomArtist}`)
    imageCaption = caption + ` #${randomArtist.replace(/\s/g, "")}`
    postDetails = imageCaption + `\n\nThis piece is completed in the style of artist ${artists[randomIndex].name}, ${artists[randomIndex].description}\n`
  }
  
  const imgData = await getImage(imageCaption);
  await saveImage(imgData);
  await convertToJPEG();

  let imgUrl;

  try {
    imgUrl = await imgurUpload(postDetails);
    console.log("Uploaded to Imgur Successfully")
  } catch {
    console.error("Upload image to Imgur failed, retrying");
    sleep(10000);
    imgUrl = await imgurUpload(postDetails);
  }

  try {
    await postImage(imgUrl, postDetails);
    console.log("Uploaded to Instagram Successfully")
  } catch {
    console.error("Upload image to Instagram failed, retrying");
    sleep(10000);
    await postImage(imgUrl, postDetails);
  }
  
  console.log("Completed");
};

main();
