import requests
import os
import json
import time

url = 'http://127.0.0.1:5000/BPMeyeMind'

#helpers
def send(data):
	response = requests.post(url, json = data)
	responseMsg = response.json()
	return responseMsg


def read_json_directory(dir):
	dir_list = os.listdir(dir)
	snapshots = []
	for f in dir_list:
		file = open(dir+f)
		snapshot = json.load(file)
		file.close()
		snapshots.append(snapshot)
	return snapshots
