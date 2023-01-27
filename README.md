# AImaginaryCreations
Posts can be found on Instagram at: @aimaginary_creations

## An Instagram bot to generate and post AI images

### Usage
Subject to MIT Licence, see LICENCE.md file for more details.

You must provide a .env file in your root working directory and ensure it has the necessary variables, tokens, username, password etc

Ensure you have node.js v19.4.0 installed

Clone this Git repo to your local environment

Run `npm install` from the root working directory to install the project using node

Run `npm run start` to begin the program


### This program is a fully automated AI bot. The program works in 5 main steps:
1: Generates between 2 to 5 random words from the dictionary 
    (We use the random-words package for this, which uses math.random as it's good enough for our use case)

2: We create a prompt using the words we obtained, the prompt is designed so that it uses the words as the object of a scene, and ask the Open AI text api to turn it into a caption for a piece of art. 
    (This uses OpenAI's text-davinci-003 model, as it's currently the best at dealing with abstract requests like this)

3: This prompt is then given to Open AI's Image generation AI, to create a full unique AI image.
    (These images are saved locally to begin with)

4: The image is then converted from PNG to JPG and uploaded to Imgur along with the caption. 
    (These local images will we overwritten every time the program is run)

5: Finally we upload the image to Instagram using the image url returned from the Imgur upload response.
    (We use the instagram-private-api package for this as most others are outdated)


### Limitations
1: The Imgur access token needs to be renewed every month.
2: Only generates 1 image at a time.
3: No record of previous generations, other than what has been posted to Imgur and Instagram
4: Currently the OpenAI API only gives you a limited amount of free generations


### Opportunities
- There are many changes you can make to this project, the openai.createCompletion method allows the use of other training models.
- The openai.createImage method, takes extra parametres for number of images and size.
- There are other methods provided by the OpenAI api.
- You don't have to use instagram, it's very easy to change this to use other social media APIs.

#### References
Imgur API Docs: https://apidocs.imgur.com/
OpenAI API Docs: https://beta.openai.com/docs/introduction
Instagram/Facebook API Docs: https://developers.facebook.com/docs/instagram-api
