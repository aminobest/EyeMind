import unittest
from utils import write_json, read_json, suffleStartingFromIndex
import os
import pandas as pd
import re

experimentConfig = {

	"rooms": ["A","M"],
	"linkingSubProcessesModes": ["no","newTab","withinTab"],
	"participantsPerRoom": 100,
	"ParticipantsIdPrefix": "P",
	"participantsIdSeed":1,
	"shuffleStartIndex":2, #shuffle questions list starting from startIndex=2 (to keep the amazon smart process questions first)

	"template" :  'templates/pilot-session.json',
	"outDirectory": "out/"

}


###
 # Title: Tests
 #
 # Description: test class
 #
 # Additional notes: none
 #
class Tests(unittest.TestCase):

	###
	# Title: test shuflling
	#
	# Description: test the suffling
	#
	def test_shuflling(self):

		print("test_shuflling")

		inFilePath =  'test-data/test-session.json'

		# read json
		session = read_json(inFilePath)

		#number of loaded questions
		nLoadedQuestions = len(session["questions"])

		#non randomized questions and questions to randomize
		nonRandomizedQuestions = session["questions"][0:2]
		questionsToRandomize = session["questions"][2:]

		#list with question ids in their original order
		questionIdsInOriginalOrder = [question["id"] for question in session["questions"]] 

		#shuffle questions starting from startIndex=2 (to keep the amazon smart process questions first)
		session["questions"] = suffleStartingFromIndex(session["questions"],startIndex=2)

		#list with question ids in new order
		questionIdsInNewOrder = [question["id"] for question in session["questions"]]

		#asserts
		#number of questions did not change
		self.assertEqual(len(session["questions"]), nLoadedQuestions)
		#first two questions did remain at the same order
		self.assertEqual(session["questions"][0:2], nonRandomizedQuestions)
		#remaining questions come at different order
		self.assertNotEqual(questionIdsInNewOrder[2:], questionIdsInOriginalOrder[2:])


###
	# Title: test generated sessions
	#
	# Description: test generated sessions
	#
	def test_generated_sessions(self):

		print("test_generated_sessions")

		
		outDirectory =  'out/'

		# get questions of the template
		template = read_json(experimentConfig["template"])

		#list with question ids in their original template order
		questionIdsInOriginalOrder = [question["id"] for question in template["questions"]]

		# iterate the session files in outDirectory
		for subdir, dirs, files in os.walk(outDirectory):
			for file in files:
				fileName = os.path.join(subdir, file)
				print(f'reading {fileName}')
				if fileName != "out/README.md":
					session = read_json(fileName)
					#list with question ids in new session order
					questionIdsInNewOrder = [question["id"] for question in session["questions"]]
					#asserts
					#number of questions is the same as the one in the template
					self.assertEqual(len(session["questions"]), len(template["questions"]))
					#first two questions did remain the same
					for index, question in enumerate(session["questions"][0:2]):
						self.assertEqual(question["id"], template["questions"][index]["id"])
						self.assertEqual(question["question"], template["questions"][index]["question"])
						self.assertEqual(question["type"], template["questions"][index]["type"])
						self.assertEqual(question["options"], template["questions"][index]["options"])
						self.assertEqual(question["model-group"], template["questions"][index]["model-group"])
					#remaning questions come at different order
					self.assertNotEqual(questionIdsInNewOrder[2:], questionIdsInOriginalOrder[2:])
					#linkingSubProcessesMode in file name matches linkingSubProcessesModes in the session config
					linkingSubProcessesModeFromFileName = re.search('-(.+?).json',fileName).group(1)
					self.assertEqual(linkingSubProcessesModeFromFileName, session["linkingSubProcessesMode"])


# for now, tests should be executed in independent runs
def suite():
    suite = unittest.TestSuite()
    suite.addTest(Tests('test_shuflling'))
    suite.addTest(Tests('test_generated_sessions'))
    return suite

if __name__ == '__main__':
    runner = unittest.TextTestRunner()
    runner.run(suite())

