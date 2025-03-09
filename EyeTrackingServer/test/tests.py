import unittest
import time
from ..server.utils import generateGazePoints
from utils import send, read_json_directory
import pandas as pd
from pandas.testing import assert_frame_equal


## Important note:
    #the eye-tracking server needs to be running in testMode: python main.py testMode.
    #Use the following command to run a test "python -m unittest tests.Tests.<<testName>>"


###
 # Title: Tests
 #
 # Description: test class
 #
 # Additional notes: none
 #
class Tests(unittest.TestCase):
	###
	# Title: setup eye-tracker
	#
	# Description: test "action": 'setup' communication
	#			   test that all variables needed for a new data collection are reset
	#
	def test_ET_setup(self):

		print("test_ET_setup starts")

		responseMsg = send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})

		self.assertEqual(responseMsg["gazeData"], [])
		self.assertEqual(responseMsg["gazeFullData"], None)
		cTimestamp = responseMsg["cTimestamp"]
		self.assertEqual(responseMsg["gazeDataFilename"], "out/logs/EyeMindTemporalGazeData_"+cTimestamp+".bem")
		self.assertEqual(responseMsg["snapshotsContentDataFilename"], "out/logs/EyeMindTemporalSnapshotsContentData_"+cTimestamp+".bem")
		self.assertEqual(responseMsg["fileWrittingGazeThreads"], [])
		self.assertEqual(responseMsg["fileWrittingSnapshotThreads"], [])
		self.assertEqual(responseMsg["currentSnapshotId"], -1)
		self.assertEqual(responseMsg["currentSnapshotTimestamp"], -1)
		self.assertEqual(responseMsg["currentQuestion"], '')
		self.assertEqual(responseMsg["isETstarted"], True)
		self.assertEqual(responseMsg["xScreenDim"], 1920)
		self.assertEqual(responseMsg["yScreenDim"], 1080)
		self.assertEqual(responseMsg["isETready"], 1)
		self.assertEqual(responseMsg["response"], "OK")

		print("test_ET_setup ends")

	###
	# Title: adding several snapshots
	#
	# Description: test "action": 'addSnapshot' communication
	#					"action": 'PrepareGazeDataAndInitiateTransfer' (is received_gazeDataSize correct?)
	#					"action": getDataFragment
	#			   test that currentSnapshotId and currentSnapshotTimestamp (global variables) are changed
	#			   test that the gazes occuring before and after sending a snapshot have the correct currentSnapshotId
	#
	def test_addSnapshot(self):


		print("test_addSnapshot starts")

		#defs
		len1 = 100
		len2 = 120
		len3 = 20

		seed1 = 0
		seed2 = len1
		seed3 = len2

		responseMsg = send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})

		print(responseMsg["cTimestamp"])

		# send some gaze points
		gazePoints = generateGazePoints(number=len1,timestampSeed=seed1)
		send({ "action": 'mockGazeData', "content": gazePoints})

		# send new snapshot id and do assertion for currentSnapshotId
		snapshots = read_json_directory("data/snapshots/")
		responseMsg = send({ "action": 'addSnapshot', "timestamp": snapshots[0]["timestamp"], "id": snapshots[0]["id"] })
		# assertions
		self.assertEqual(responseMsg["currentSnapshotId"], snapshots[0]["id"])
		self.assertEqual(responseMsg["response"], "OK")

		# send more gazepoints
		gazePoints = generateGazePoints(number=len2,timestampSeed=seed2)
		send({ "action": 'mockGazeData', "content": gazePoints})

		# send new snapshot id and do assertion for currentSnapshotId
		snapshots = read_json_directory("data/snapshots/")
		responseMsg = send({ "action": 'addSnapshot', "timestamp": snapshots[1]["timestamp"], "id": snapshots[1]["id"] })
		# assertions to check currentSnapshotId and response
		self.assertEqual(responseMsg["currentSnapshotId"], snapshots[1]["id"])
		self.assertEqual(responseMsg["response"], "OK")

		# send more gazepoints
		gazePoints = generateGazePoints(number=len3,timestampSeed=seed3)
		send({ "action": 'mockGazeData', "content": gazePoints})


		#"action": 'PrepareGazeDataAndInitiateTransfer' and do assertion for received_gazeDataSize
		responseMsg = send({ "action": 'PrepareGazeDataAndInitiateTransfer'})
		received_gazeDataSize = responseMsg["gazeDataSize"]
		self.assertEqual(received_gazeDataSize, len1+len2+len3)

		#"action": 'getDataFragment'
		responseMsg = send({ 'action': 'getDataFragment', 'start':0, 'end':received_gazeDataSize })


		#assertions to check whether currentSnapshotId was corectly assigned to gazes of the first, second and third sets
		for i in range (0,len1):
			self.assertEqual(responseMsg[i]["snapshotId"], -1)

		for i in range (len1,len1+len2):
			self.assertEqual(responseMsg[i]["snapshotId"], snapshots[0]["id"])

		for i in range (len1+len2,len1+len2+len3):
			self.assertEqual(responseMsg[i]["snapshotId"], snapshots[1]["id"])

		print("test_addSnapshot ends")

	###
	# Title: logging serveral full snapshots
	#
	# Description: test "action": 'logFullSnapshot'
	#					"action": 'PrepareGazeDataAndInitiateTransfer' (are snapshots correct?)
	#			   test logging several full snapshots using the implemented multi-threading approach
	#
	def test_logFullSnapshot(self):

		print("test_logFullSnapshot starts")

		send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})

		# send several snapshots
		snapshots = read_json_directory("data/snapshots/")
		for snapshot in snapshots:
			send({ "action": 'addSnapshot', "timestamp": snapshot["timestamp"], "id": snapshot["id"] })
			send({ "action": 'logFullSnapshot', "content": snapshot})


		#send 1 gaze point to avoid exceptions with getGazes()
		gazePoints = generateGazePoints(number=1,timestampSeed=0)
		send({ "action": 'mockGazeData', "content": gazePoints})

    	#request gazeDataSize and snapshots through "action": 'PrepareGazeDataAndInitiateTransfer'
		responseMsg = send({ "action": 'PrepareGazeDataAndInitiateTransfer'})
		received_snapshots = responseMsg["snapshots"]

		#prepare expected snapshots
		expected_snapshots = dict()
		for snapshot in snapshots:
			expected_snapshots[str(snapshot["id"])] = snapshot


		#assertions
		self.assertEqual(len(received_snapshots), len(expected_snapshots))

		for key in expected_snapshots:
			self.assertEqual(received_snapshots[key]["timestamp"], expected_snapshots[key]["timestamp"])
			self.assertEqual(received_snapshots[key]["code"], expected_snapshots[key]["code"])
			self.assertEqual(received_snapshots[key]["screenX"], expected_snapshots[key]["screenX"])
			self.assertEqual(received_snapshots[key]["screenY"], expected_snapshots[key]["screenY"])
			self.assertEqual(received_snapshots[key]["id"], expected_snapshots[key]["id"])
			self.assertEqual(received_snapshots[key]["tabName"], expected_snapshots[key]["tabName"])
			self.assertEqual(received_snapshots[key]["boundingClientRect"], expected_snapshots[key]["boundingClientRect"])

		print("test_logFullSnapshot ends")

	###
	# Title: logging serveral clicks
	#
	# Description: test "action": 'addClickEvent'
	#					"action": 'PrepareGazeDataAndInitiateTransfer'
	#
	#			   test that a set of clicks events are recorded correctly together with some gaze points
	#
	def test_addClickEvents(self):

		print("test_addClickEvent starts")

		#defs
		lensAndSeeds = [
		{"len":5, "seed":0},
		{"len":2, "seed":200},
		{"len":5, "seed":400},
		{"len":10, "seed":600},
		{"len":12, "seed":900},
		{"len":30, "seed":1600},
		{"len":12, "seed":1650},
		{"len":14, "seed":1660},
		{"len":20, "seed":1780},
		{"len":30, "seed":1900}
		]

		mockClickEvents = ["el1","el2","el3","el4","el5","el6","el7","el8","el9","el10"]

		responseMsg = send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})


		for i in range(0,len(mockClickEvents)):
			# send some gaze points
			gazePoints = generateGazePoints(number=lensAndSeeds[i]["len"],timestampSeed=lensAndSeeds[i]["seed"])
			send({ "action": 'mockGazeData', "content": gazePoints})
			# send a click event
			send({"action": 'addClickEvent',
			  "clickTimestamp": i+1,
			  "clickedElement": mockClickEvents[i]
			});


		#"action": 'PrepareGazeDataAndInitiateTransfer' and do assertion for received_gazeDataSize
		responseMsg = send({ "action": 'PrepareGazeDataAndInitiateTransfer'})
		received_gazeDataSize = responseMsg["gazeDataSize"]

		#"action": 'getDataFragment'
		responseMsg = send({ 'action': 'getDataFragment', 'start':0, 'end':received_gazeDataSize })

		#df = pd.DataFrame.from_dict(responseMsg)
		#df = df.mask(df == '')
		#df.to_csv("data/clicks/gazePointsAndClicks.csv", index=False)

		#load expected dataframe
		expected = pd.read_csv("data/clicks/gazePointsAndClicks.csv")

		#construct resulting dataframe
		received = pd.DataFrame.from_dict(responseMsg)
		received = received.mask(received == '')

		# check_dtype=False because pandas looks for the best dtype when reading a csv
		assert_frame_equal(received, expected, check_dtype=False)

		print("test_addClickEvent ends")

	###
	# Title: add question events
	#
	# Description: test "action": 'addQuestionEvent'
	#					"action": 'PrepareGazeDataAndInitiateTransfer'
	#
	#			   test that a set of question events are recorded correctly together with some gaze points
	#
	# Notes: except for the first and last question events, questionOffset should come always before questionOnset
	def test_addQuestionEvents(self):

		print("test_addQuestionEvent starts")

		#defs
		lensAndSeeds = [
		{"len":5, "seed":0},
		{"len":2, "seed":200},
		{"len":5, "seed":400},
		{"len":10, "seed":600},
		{"len":12, "seed":900},
		{"len":30, "seed":1600},
		{"len":12, "seed":1650},
		{"len":14, "seed":1660},
		{"len":20, "seed":1780},
		{"len":30, "seed":1900}
		]

		mockClickEvents = ["el1","el2","el3","el4","el5","el6","el7","el8","el9","el10"]

		responseMsg = send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})


		for i in range(0,len(mockClickEvents)):
			# send some gaze points
			gazePoints = generateGazePoints(number=lensAndSeeds[i]["len"],timestampSeed=lensAndSeeds[i]["seed"])
			send({ "action": 'mockGazeData', "content": gazePoints})
			# send a click event
			if i!=0:
				send({"action": 'addQuestionEvent',
					"questionTimestamp": i,
					"questionEventType": "questionOffset",
					"questionPosition": i-1,
					"questionText": "testQtext",
					"questionAnswer": "testQanswer",
					"questionID": "testQId"+str(i)
				})
			if i!=len(mockClickEvents)-1:
				send({"action": 'addQuestionEvent',
					"questionTimestamp": i+1,
					"questionEventType": "questionOnset",
					"questionPosition": i,
					"questionText": "testQtext",
					"questionAnswer": "testQanswer",
					"questionID": "testQId"+str(i+1)
				})

		#"action": 'PrepareGazeDataAndInitiateTransfer' and do assertion for received_gazeDataSize
		responseMsg = send({ "action": 'PrepareGazeDataAndInitiateTransfer'})
		received_gazeDataSize = responseMsg["gazeDataSize"]

		#"action": 'getDataFragment'
		responseMsg = send({ 'action': 'getDataFragment', 'start':0, 'end':received_gazeDataSize })

		#df = pd.DataFrame.from_dict(responseMsg)
		#df = df.mask(df == '')
		#df.to_csv("data/questions/gazePointsAndQuestions.csv", index=False)

		#load expected dataframe
		expected = pd.read_csv("data/questions/gazePointsAndQuestions.csv")

		#construct resulting dataframe
		received = pd.DataFrame.from_dict(responseMsg)
		received = received.mask(received == '')

		# check_dtype=False because pandas looks for the best dtype when reading a csv
		assert_frame_equal(received, expected, check_dtype=False)


		print("test_addQuestionEvent ends")




	###
	# Title: mockGazeData
	#
	# Description: test "action": 'mockGazeData'
	#					"action": 'getDataFragment'
	#			   test that a large number of gazeData is recorded correctly (taking into consideration the implemented period storage strategy based on multi-threading)
	#
	#
	def test_mockGazeData(self):

		print("test_mockGazeData starts")

		#defs
		lensSeedsAndSleeps = [
		{"len":120000, "seed":0, "sleep":2},
		{"len":200001, "seed":120000, "sleep":1},
		{"len":50000, "seed":200001+120000, "sleep":3},
		]

		FragmentSize = 10000

		allGazes = [];

		responseMsg = send({ "action": 'setup',
		"xScreenDim": 1920,
		"yScreenDim": 1080})

		for lss in lensSeedsAndSleeps:
			# generate send some gaze points
			gazePoints = generateGazePoints(number=lss["len"],timestampSeed=lss["seed"])
			send({ "action": 'mockGazeData', "content": gazePoints})
			#sleep
			time.sleep(lss["sleep"])

		#"action": 'PrepareGazeDataAndInitiateTransfer' and do assertion for received_gazeDataSize
		responseMsg = send({ "action": 'PrepareGazeDataAndInitiateTransfer'})
		received_gazeDataSize = responseMsg["gazeDataSize"]

		start = 0
		end = start+FragmentSize if (start+FragmentSize) <=received_gazeDataSize else received_gazeDataSize

		while start<received_gazeDataSize:

			responseMsg = send({ 'action': 'getDataFragment', 'start':start, 'end':end })
			start = start + FragmentSize
			end = start+FragmentSize if (start+FragmentSize) <=received_gazeDataSize else received_gazeDataSize
			allGazes.extend(responseMsg)
		#to do extend dataframe

		#df = pd.DataFrame.from_dict(allGazes)
		#df = df.mask(df == '')
		#df.to_csv("data/gazes/gazes.csv", index=False)

		#load expected dataframe
		expected = pd.read_csv("data/gazes/gazes.csv")

		#construct resulting dataframe
		received = pd.DataFrame.from_dict(allGazes)
		received = received.mask(received == '')

		# check_dtype=False because pandas looks for the best dtype when reading a csv
		assert_frame_equal(received, expected, check_dtype=False)


		print("test_mockGazeData ends")







