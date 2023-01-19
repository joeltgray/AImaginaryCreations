import os
import requests
from instagrapi import Client
from decouple import config

username = config('username')
password = config('password')
access_token = config('insta_token')
print(access_token)

cl = Client()
response = cl.login(username, password)
print(response)

url = 'https://graph.instagram.com/me?fields=id&access_token=' + access_token
response = requests.get(url)
data = response.json()
user_id = data['id']

url = "https://graph.facebook.com/{}/{}/media".format('v12.0', user_id)
payload = {'image_url': '/home/joel/Downloads/colourPossibilities.jpg',
           'caption': '"A Free Hollow of Colorful Possibilities"',
           'access_token': access_token}

response = requests.post(url, params=payload)
print(response.json())
creation_id = response['id']

url = 'https://graph.facebook.com/{api-version}/{ig-user-id}/media_publish'
payload = {'creation_id': creation_id,
           'access_token': access_token}

response = requests.post(url, params=payload)
print(response.json())

