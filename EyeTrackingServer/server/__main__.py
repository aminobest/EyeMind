# MIT License

# Copyright (c) 2022 Eye-Mind Tool (Author: Amine Abbad-Andaloussi)

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# DEBUG_MODE = True

import numpy as np
import tobii_research as tr
import time
import random
import os
import sys
from flask import Flask, request
import json
import math
import pandas as pd
import statistics
from scipy.spatial import distance
import threading
import copy
import pickle
from waitress import serve
import itertools

from .utils import generateGazePoints

# test mode settings if applicable
testMode = True
if len(sys.argv)>1 and sys.argv[1]=="testMode":
    testMode= True
    print("Test mode activiated")
#############

# locks
fileWrittingGazeLock = threading.Lock()
fileWrittingSnapshotLock = threading.Lock()
#############


# constants
GAZE_BUFFER_SIZE = 10000
COMMUNICATION_PORT_WITH_EYE_MIND = 5100
N_CONNECTION_TRIALS = 10
#############

# globals
mt = None
GAZE_ATTRIBUTES = [
    ('device_time_stamp', 1),
    #  ('left_gaze_origin_validity',  1),
    #   ('right_gaze_origin_validity',  1),

    #  ('left_gaze_origin_in_user_coordinate_system',  3),
    #  ('right_gaze_origin_in_user_coordinate_system',  3),

    #  ('left_gaze_origin_in_trackbox_coordinate_system',  3),
    #  ('right_gaze_origin_in_trackbox_coordinate_system',  3),

    ('left_gaze_point_validity',  1),
    ('right_gaze_point_validity',  1),

    ('left_gaze_point_on_display_area',  2),
    ('right_gaze_point_on_display_area',  2),

     ('left_pupil_validity',  1),
     ('right_pupil_validity',  1),

    ('left_pupil_diameter',  1),
    ('right_pupil_diameter',  1),

    ('left_gaze_origin_in_user_coordinate_system',  3),
    ('right_gaze_origin_in_user_coordinate_system',  3)
]
#############


# variables to be reset at each (ET) setup
gazeData = []
gazeFullData = None
snapshotsFullData = None


gazeDataFilename = ""
snapshotsContentDataFilename = ""

fileWrittingGazeThreads = []
fileWrittingSnapshotThreads = []

currentSnapshotId = -1
currentSnapshotTimestamp = -1
currentQuestion = ""

isETready = 0

xScreenDim =  -1 # in pixel
yScreenDim =  -1 # in pixel

# last_report = 0
# N = 0

isETstarted = False
######################################################


###
 # Title: find eye tracker
 #
 # Description: finding the connected eye-tracker
 #
 # @param {void} . .
 # Returns {boolean} eye-tracker found or not
 #
 # Additional notes: none
 #
 #/
def find_eyeTracker():
    global mt
    # looking for eye-tracker
    ft = []
    for i in range (0,N_CONNECTION_TRIALS):
        ft = tr.find_all_eyetrackers()
        if len(ft) == 0:
            print("No Eye Trackers found! Trying again ...")
            time.sleep(2)
        else:
            break

    # Pick first eye-tracker
    if len(ft)>0:
        mt = ft[0]
        print("Found Tobii Tracker at '%s'" % (mt.address))
        return True
    else:
        print("No Eye Trackers found!")
        return False


###
 # Title: start gaze tracking
 #
 # Description: start gaze tracking
 #
 # @param {void} . .
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def start_gaze_tracking():
    global isETstarted
    mt.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_data_callback, as_dictionary=True)
    isETstarted = True


###
 # Title: end gaze tracking
 #
 # Description: end gaze tracking
 #
 # @param {void} . .
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def end_gaze_tracking():
    mt.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_data_callback)

###
 # Title: gaze data callback
 #
 # Description: a function to be called when you gaze data is received
 #
 # @param {object} gaze_data a gaze data object with many attributes refering to gaze characteristics
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def gaze_data_callback(gaze_data):
    '''send gaze data'''

    eventSource = "eye-tracker"

    try:

        # global last_report
        # global N
        global gazeData

        # sts = gaze_data['system_time_stamp'] / 1000000.


        # if sts > last_report + 5:
        #     sys.stdout.write("%14.3f: %10d packets\r" % (sts, N))
        #     last_report = sts
        # N += 1

        # call unpack_gaze_data if not in testMode else d = gaze_data
        d = unpack_gaze_data(gaze_data) if not testMode else gaze_data

        #print(d)
        timestamp = d[0]

        validLeft = d[1]
        validright = d[2]

        leftXRatio = d[3]
        leftYRatio = d[4]

        rightXRatio = d[5]
        rightYRatio = d[6]

        leftPupilValidity = d[7]
        rightPupilValidity = d[8]

        leftPupilDiameter = d[9]
        rightPupilDiameter = d[10]

        leftXOrigin = d[11]
        leftYOrigin = d[12]
        leftZOrigin = d[13]

        rightXOrigin = d[14]
        rightYOrigin = d[15]
        rightZOrigin = d[16]



        entry = {
            "Timestamp": timestamp,

            "validLeft": validLeft,
            "validRight": validright,

            "leftXRatio": leftXRatio,
            "leftYRatio": leftYRatio,
            "rightXRatio": rightXRatio,
            "rightYRatio": rightYRatio,

            "leftPupilValidity": leftPupilValidity,
            "rightPupilValidity": rightPupilValidity,

            "leftPupilDiameter": leftPupilDiameter,
            "rightPupilDiameter": rightPupilDiameter,

            "leftXOrigin": leftXOrigin,
            "leftYOrigin": leftYOrigin,
            "leftZOrigin": leftZOrigin,

            "rightXOrigin": rightXOrigin,
            "rightYOrigin": rightYOrigin,
            "rightZOrigin": rightZOrigin,

            "snapshotId": currentSnapshotId,
            #"currentSnapshotTimestamp": currentSnapshotTimestamp,

            "currentQuestion": currentQuestion,

            "eventSource": eventSource,

            "systemTimestamp": time.time_ns()

            }

        gazeData.append(entry)

        storeGazeDataPeriodically()

    except:
        print("Error in callback: ")
        print(sys.exc_info())


###
 # Title: periodic storage of gaze data
 #
 # Description: periodic storage of gaze data to a file
 #
 # @param {void} . .
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def storeGazeDataPeriodically():
    global gazeData

    # if the length of gazeData exceeds the GAZE_BUFFER_SIZE
    if len(gazeData)>=GAZE_BUFFER_SIZE:
        print("storing gaze data ...")

        # make a deep copy of a gazeData fragment [:GAZE_BUFFER_SIZE]. This strategy avoid issues when gazeData is being updated externally from logQuestionData() or logClickData()
        tempData = copy.deepcopy(gazeData[:GAZE_BUFFER_SIZE])
        # remove the copied fragment from gazeData
        gazeData = gazeData[GAZE_BUFFER_SIZE: ]

        # start a thread responsible for appending tempData to gazeDataFilename
        thread = threading.Thread(target=appendGazesToFile, args=(tempData, ))
        thread.start()
        fileWrittingGazeThreads.append(thread)


###
 # Title: append gazes to file
 #
 # Description: append gazes to file
 #
 # @param {object}  tempData a fragment of gazeData
 #
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def appendGazesToFile(tempData):

    # fileWrittingGazeLock is a lock, making the load and the writting to the file thread-safe
    with fileWrittingGazeLock:
        print("periodic writting of gaze data to file started");

        try:
            file = open(gazeDataFilename, 'r+b')
            data = pickle.load(file)
            print("loaded data len",len(data))
            data.extend(tempData)
            print("new data len",len(data))
            file.seek(0)
            file.truncate()
            pickle.dump(data, file)
            file.close()
        except (EOFError, OSError) :
            file = open(gazeDataFilename, 'w+b')
            print("Fresh gazes file")
            print("tempData len",len(tempData))
            pickle.dump(tempData, file)
            file.close()


        print("periodic writting to file ended");

###
 # Title: log full snapshot
 #
 # Description: log the snapshot with all its details
 #
 # @param {object}  snapshotContent snapshot object
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def logFullSnapshot(snapshotContent):

    # start a thread responsible for appending snapshotContent to snapshotsContentDataFilename
    thread = threading.Thread(target=appendSnapshotContentToFile, args=(snapshotContent, ))
    thread.start()
    fileWrittingSnapshotThreads.append(thread)



###
 # Title: append snpashot content to file
 #
 # Description: append snpashot content to file
 #
 # @param {object}  snapshotContent snapshot object
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def appendSnapshotContentToFile(snapshotContent):


    # fileWrittingSnapshotLock is a lock, makking the load and the writting to the file thread-safe
    with fileWrittingSnapshotLock:
        print("append snapshots content data to snapshots file started");

        try:
            file = open(snapshotsContentDataFilename, 'r+b')
            data = pickle.load(file)
            print("loaded data len",len(data))
            data[snapshotContent["id"]] = snapshotContent;
            print("new data len",len(data))
            file.seek(0)
            file.truncate()
            pickle.dump(data, file)
            file.close()
        except (EOFError, OSError):
            file = open(snapshotsContentDataFilename, 'w+b')
            print("Fresh snapshot file")
            data = {}
            data[snapshotContent["id"]] = snapshotContent;
            print("data len",len(data))
            pickle.dump(data, file)
            file.close()

        print("append snapshots content data to snapshots file finished");


###
 # Title: log question data
 #
 # Description: append question events to gazeData
 #
 # @param {string} questionTimestamp timestamp of the event
 # @param {string} questionEventType type of question event (i.e., questionOnset, questionOffset)
 # @param {string} questionText  question text
 # @param {string} questionAnswer answer text
 # @param {int} questionPosition question position (i.e., nextQuestionId)
 # @param {string} questionID id of the question
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def logQuestionData(questionTimestamp,questionEventType,questionText,questionAnswer,questionPosition,questionID):

    global gazeData

    eventSource = "questionnaire"

    entry = { "questionTimestamp" : questionTimestamp,
                "questionEventType" : questionEventType,
                "questionText" : questionText,
                "questionAnswer" : questionAnswer,
                "questionPosition" : questionPosition,
                "questionID": questionID,
                "eventSource": eventSource,
                "systemTimestamp": time.time_ns()
                }

    gazeData.append(entry)


###
 # Title: log click data
 #
 # Description: append click event to gazeData
 #
 # @param {string} clickTimestamp timestamp when the click was registred
 # @param {string} clickedElement identifier of the clicked element
 # Returns {void}
 #
 # Additional notes: none
 #
 #/
def logClickData(clickTimestamp,clickedElement):

    global gazeData

    eventSource = "clickStream"

    entry = {   "clickTimestamp" : clickTimestamp,
                "clickedElement" : clickedElement,
                "eventSource": eventSource,
                "systemTimestamp": time.time_ns()
                }

    gazeData.append(entry)

###
 # Title: unpack gaze data
 #
 # Description: unpack gaze data
 #
 # @param {object} gaze_data gaze data
 # Returns {object} x gaze data
 #
 # Additional notes: none
 #
 #/
def unpack_gaze_data(gaze_data):
    x = []
    for s in GAZE_ATTRIBUTES:
        d = gaze_data[s[0]]
        if isinstance(d, tuple):
            x = x + list(d)
        else:
            x.append(d)
    return x


###
 # Title: load and get gaze data
 #
 # Description: load and get gaze data
 #
 # @param {void} . .
 # Returns {object} gazeDataFrame gaze data
 #
 # Additional notes: none
 #
 #/
def getGazes():

    # wait for all threads in fileWrittingGazeThreads to finish
    for thread in fileWrittingGazeThreads:
        thread.join()

    # append the data still in memory to the file
    if len(gazeData)>0:
        appendGazesToFile(gazeData)


    # open gazeDataFilename
    file = open(gazeDataFilename, 'rb')
    # load its content i.e., gazeData
    data = pickle.load(file)


    # for stress simulation:
    # data = data*100

    gazeDataFrame = pd.DataFrame(data)


    # sort gazeDataFrame by Timestamp
    gazeDataFrame.sort_values(by=['Timestamp'])

    now = int( time.time() )


    gazeDataFrame["Timestamp"] = gazeDataFrame["Timestamp"]/1000  #convert from micro to milliseconds
    # for timestamp simulation: gazeDataFrame["Timestamp"] = 325905.354 + (gazeDataFrame.index *  8.348)

    gazeDataFrame["leftX"] = gazeDataFrame["leftXRatio"]*xScreenDim
    gazeDataFrame["leftY"] = gazeDataFrame["leftYRatio"]*yScreenDim

    gazeDataFrame["rightX"] = gazeDataFrame["rightXRatio"]*xScreenDim
    gazeDataFrame["rightY"] = gazeDataFrame["rightYRatio"]*yScreenDim

    gazeDataFrame["XRatio"] = gazeDataFrame[["leftXRatio","rightXRatio"]].mean(axis=1)
    gazeDataFrame["YRatio"] = gazeDataFrame[["leftYRatio","rightYRatio"]].mean(axis=1)

    #gazeDataFrame["x"] = gazeDataFrame["XRatio"]*xScreenDim
    #gazeDataFrame["y"] = gazeDataFrame["YRatio"]*yScreenDim

    gazeDataFrame["leftDistance"] = gazeDataFrame["leftZOrigin"]
    gazeDataFrame["rightDistance"] = gazeDataFrame["rightZOrigin"]


    gazeDataFrame.to_csv("out/logs/EyeMindFinalGazeData"+str(now)+".csv")

    # version to send back to EyeMind

    # Set negative leftX, leftY, rightX, rightY to nan
    gazeDataFrame.loc[gazeDataFrame["leftX"] < 0, "leftX"] = np.nan
    gazeDataFrame.loc[gazeDataFrame["leftY"] < 0, "leftY"] = np.nan
    gazeDataFrame.loc[gazeDataFrame["rightX"] < 0, "rightX"] = np.nan
    gazeDataFrame.loc[gazeDataFrame["rightY"] < 0, "rightY"] = np.nan


    # Set leftX, rightX to nan if value > xScreenDim
    gazeDataFrame.loc[gazeDataFrame["leftX"] > xScreenDim, "leftX"] = np.nan
    gazeDataFrame.loc[gazeDataFrame["rightX"] > xScreenDim, "rightX"] = np.nan


    # Set leftY or rightY to nan if value > yScreenDim
    gazeDataFrame.loc[gazeDataFrame["leftY"] > yScreenDim, "leftY"] = np.nan
    gazeDataFrame.loc[gazeDataFrame["rightY"] > yScreenDim, "rightY"] = np.nan


    # rounding and dropping uncessary columns for the data to be send to EyeMind (the full data was already stored) (rounding is similar to iMotions)
    # round
    gazeDataFrame = gazeDataFrame.round({
        'leftX': 0,
        'leftY': 0,
        'rightX': 0,
        'rightY': 0,
     })

    # compute x and y with rounded data
    gazeDataFrame["x"] = gazeDataFrame[["leftX","rightX"]].mean(axis=1)
    gazeDataFrame["y"] = gazeDataFrame[["leftY","rightY"]].mean(axis=1)

    # round x and y after recomputation
    gazeDataFrame = gazeDataFrame.round({
        'x': 1,
        'y': 1,
     })

    # drop uncessary columns
    gazeDataFrame = gazeDataFrame.drop(columns=['leftXOrigin', 'leftYOrigin','leftZOrigin','rightXOrigin','rightYOrigin','rightZOrigin',
                                                   'leftXRatio','leftYRatio','rightXRatio','rightYRatio','XRatio','YRatio','systemTimestamp' ])

    return gazeDataFrame


###
 # Title: get snapshots content
 #
 # Description: get the content of the snapshots
 #
 # @param {void} . .
 # Returns {object} snapshots
 #
 # Additional notes: none
 #
 #/
def getSnapshotsContent():

    # wait for all threads in fileWrittingSnapshotThreads to finish
    for thread in fileWrittingSnapshotThreads:
        thread.join()

    # try except depending on whether snapshotsContentDataFilename was created on not yet. If the file was not created, this meaning that there are not snapshots
    try:
        # open snapshotsContentDataFilename
        file = open(snapshotsContentDataFilename, 'rb')
        # load its content i.e., snapshotsContent
        data = pickle.load(file)
        # close file
        file.close()

    except OSError:
        data = None

    return data


######################## for testing purpose ###############################

def processMockGazeData(gazes):

    for gazePoint in gazes:
        print(gazePoint)
        gaze_data_callback(gazePoint)

def mockGazePoints(interval):
    for index in itertools.count():
        if isETstarted:
            print("Sending mock gaze...")
            gazes = generateGazePoints(10, index)
            processMockGazeData(gazes)
            time.sleep(interval)

gaze_mock_interval = 0.5
########################################################################

######################## main control-flow

# check if not testMode
if not testMode:
    if find_eyeTracker():
        isETready = 1
    else:
        exit()
else:
    isETready = 1


app = Flask(__name__)

@app.route('/BPMeyeMind', methods = ['POST'])
def process():
    global gazeData
    global gazeFullData
    global snapshotsFullData
    global gazeDataFilename
    global snapshotsContentDataFilename
    global fileWrittingGazeThreads
    global fileWrittingSnapshotThreads
    global currentSnapshotId
    global currentSnapshotTimestamp
    global currentQuestion
    global isETready
    global xScreenDim
    global yScreenDim
    # global last_report
    # global N
    global isETstarted


    data = request.get_json()
    print("-----------------------new data received -----------------");


    if data['action']=='setup':
        print(data)
        print("setup received");

        # reset global variables

        gazeData = []
        gazeFullData = None
        snapshotsFullData = None
        cTimestamp = "t"+str(int( time.time() ))
        gazeDataFilename = "out/logs/EyeMindTemporalGazeData_"+cTimestamp+".bem"
        snapshotsContentDataFilename = "out/logs/EyeMindTemporalSnapshotsContentData_"+cTimestamp+".bem"

        fileWrittingGazeThreads = []
        fileWrittingSnapshotThreads = []

        currentSnapshotId = -1
        currentSnapshotTimestamp = -1
        currentQuestion = "";
        # last_report = 0
        # N = 0
        isETstarted = False

        # input new data
        xScreenDim = int(data['xScreenDim'])
        yScreenDim = int(data['yScreenDim'])

        # start gaze tracking if you are not in a test mode
        if not testMode:
            start_gaze_tracking()
        else:
            isETstarted = True
            # Create a new thread instance each time
            gaze_mock_thread = threading.Thread(target=mockGazePoints, args=(gaze_mock_interval,))
            gaze_mock_thread.daemon = True  # Make thread a daemon so it exits when main thread exits
            gaze_mock_thread.start()


        responseMsg = {
            "gazeData": gazeData,
            "gazeFullData": gazeFullData,
            "snapshotsFullData": snapshotsFullData,
            "cTimestamp": cTimestamp,
            "gazeDataFilename": gazeDataFilename,
            "snapshotsContentDataFilename": snapshotsContentDataFilename,
            "currentSnapshotId": currentSnapshotId,
            "currentSnapshotTimestamp": currentSnapshotTimestamp,
            "fileWrittingGazeThreads": fileWrittingGazeThreads,
            "fileWrittingSnapshotThreads": fileWrittingSnapshotThreads,
            "currentQuestion": currentQuestion,
            "isETstarted": isETstarted,
            "xScreenDim": xScreenDim,
            "yScreenDim": yScreenDim,
            "isETready": isETready,
            "response": "OK"
        }

        return responseMsg

    elif data['action']=='addSnapshot' and isETstarted:
        print(data)
        print("snapshot id received");
        currentSnapshotId = data['id']
        currentSnapshotTimestamp = data['timestamp']

        responseMsg = {
            "currentSnapshotId": currentSnapshotId,
            "currentSnapshotTimestamp": currentSnapshotTimestamp,
            "response": "OK"
        }

        return responseMsg;

    elif data['action']=='addQuestionEvent' and isETstarted:
        print(data)
        print("question event received");
        questionTimestamp = data['questionTimestamp']
        questionEventType = data['questionEventType']
        questionText = data['questionText']
        questionAnswer = data['questionAnswer']
        questionPosition = data['questionPosition']
        questionID = data['questionID']

        if questionEventType=="questionOnset":
            currentQuestion = data['questionID']
        elif questionEventType=="questionOffset":
            currentQuestion = ""

        logQuestionData(questionTimestamp,questionEventType,questionText,questionAnswer,questionPosition,questionID)

        responseMsg = {
            "response": "OK",
        }
        return responseMsg;

    elif data['action']=='addClickEvent' and isETstarted:
        print(data)
        print("click event received");
        clickTimestamp = data['clickTimestamp']
        clickedElement = data['clickedElement']

        logClickData(clickTimestamp,clickedElement)

        responseMsg = {
            "response": "OK",
        }
        return responseMsg;

    elif data['action']=='logFullSnapshot' and isETstarted:
        print("snapshot content received");
        #print(data['content']["boundingClientRect"])
        logFullSnapshot(data['content'])

        responseMsg = {
            "response": "OK",
        }
        return responseMsg;


    elif  data['action'] == 'PrepareGazeDataAndInitiateTransfer' and isETstarted:
        print(data);
        print("preparing data for transfer")

        if not testMode:
            end_gaze_tracking() # stop the data collection

        gazeFullData = getGazes();
        snapshotsFullData = getSnapshotsContent();
        output = {"gazeDataSize" : len(gazeFullData),
                  "snapshotsSize": len(snapshotsFullData)
                  }
        print("gaze data ready to send")
        return output

    elif data['action'] == 'getDataFragment' and isETstarted:
        print(data)
        print("getting a data fragement in range %s, %s" % (data['start'], data['end']) )

        return gazeFullData.iloc[data['start']:data['end']].to_json(orient = 'records')

    elif data['action'] == 'getSnapshotFragment' and isETstarted:
        print(data)
        print("getting a snapshot fragement in range %s, %s" % (data['start'], data['end']) )

        return {k: snapshotsFullData[k] for k in list(snapshotsFullData)[data['start']:data['end']]}


    ###########FOR TESTING PURPOSE#############################
    elif data['action'] == 'mockGazeData' and isETstarted:
        #print(data)
        processMockGazeData(data['content'])
        responseMsg = {
            "response": "OK",
        }
        return responseMsg;

    elif data['action'] == 'clear' and isETstarted:
        print(data)
        gazeData = []
        responseMsg = {
            "response": "OK",
        }
        return responseMsg;

    elif data['action'] == 'mockRecording' and isETstarted:
        print(data)
        gazeDataFilename = data['gazeDataFilename']
        snapshotsContentDataFilename = data['snapshotsContentDataFilename']

        responseMsg = {
            "response": "OK",
        }
        return responseMsg;


    ############################################################

    return "";

if __name__ == "__main__":
    #app.run(port=5000)
    serve(app, host="0.0.0.0", port=COMMUNICATION_PORT_WITH_EYE_MIND)

import signal
import sys

def handle_signal(signal_number, frame):
    print(f"Received signal {signal_number}. Cleaning up...")
    # Remove the thread join since we don't have a global thread anymore
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

############################################################
