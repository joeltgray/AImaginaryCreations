require("dotenv").config();
const fs = require('fs')
const https = require('https')
const path = require('path')
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
var randomWords = require("random-words");

const { IgApiClient } = require('instagram-private-api')
const { get } = require('request-promise') 
const username = process.env.username
const password = process.env.password


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
    max_tokens: 30,
  });

  res = response.data.choices[0].text;
  console.log(res);
  return res;
};

const getImage = async (caption) => {
  const response = await openai.createImage({
    prompt: caption,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json"
  });
  imageUrl = response.data.data[0].b64_json
  console.log(imageUrl)
  return imageUrl

};

const saveImage = (url) => {
  // const fileName = 'image.png';
  // return new Promise((resolve, reject) => {
  //     const file = fs.createWriteStream(fileName);
  //     https.get(url, (response) => {
  //         response.pipe(file);
  //         file.on('finish', () => {
  //             file.close();
  //             resolve();
  //         });
  //     }).on('error', (error) => {
  //         fs.unlink(fileName, () => {});
  //         reject(error);
  //     });
  // });
  const jsonData = JSON.parse(url.toString());
  const img = new Image();
  img.src = jsonData.data;
  return img
}


const postImage = async (image, caption) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  await ig.account.login(username, password);

//   const imgPath = path.join(process.cwd(), 'image.png')
//   const image = await readFileAsync(imgPath)
//   console.log(image)
//   const imageBuffer = await get({
//     url: imgPath,
//     encoding: null, 
// });
  const publishRes = await ig.publish.photo({
    file: image,
    caption: caption + "#AI #AIArt #AIArtwork #AIArtCommunity"
  });

  return publishRes
};

const main = async () => {
  const words = await getRandomWords();
  const caption = await getImageCaption(words);
  const img = await getImage(caption);
  const image = await saveImage(img)
  .then(() => console.log('Image saved successfully'))
  .catch((error) => console.error(`Error saving image: ${error}`))
  const res = await postImage(image, '"Eight Knowledge Reflected in a Fresh Mirror" #AbstractArt');
  console.log(res)
};

main();

