require("dotenv").config();

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
var randomWords = require("random-words");
const Instagram = require('instagram-web-api')
//const FileCookieStore = require('tough-cookie-filestore2')
const username = process.env.username
const password = process.env.password

//const cookieStore = new FileCookieStore('./cookies.json')
const client = new Instagram({ username, password })

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

const getImages = async (caption) => {
  const response = await openai.createImage({
    prompt: caption,
    n: 3,
    size: "1024x1024",
  });

  res = response.data.data
  console.log(res);
  return res;
};

// const postImages = async () => {
//     const photo =
//       'https://cdn.openai.com/dall-e-now-available-without-waitlist/draft-20220927a/running-at-the-edge-of-space.jpeg'
   
//     const user = await client.login();
//     console.log(user)
   
//     //Upload Photo to feed or story, just configure 'post' to 'feed' or 'story'
//     const media = await client.uploadPhoto({ photo: photo, caption: 'testing', post: 'feed' })
//     // console.log(`https://www.instagram.com/p/${media.code}/`)
//     console.log(media)
// };

const main = async () => {
  const words = await getRandomWords();
  const caption = await getImageCaption(words);
  const images = await getImages(caption);
};

main();

