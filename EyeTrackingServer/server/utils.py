def generateGazePoints(number,timestampSeed):

	gazePoints = []

	for i in range (0,number):

		gazePoint = [timestampSeed, #timestamp
			1, #validLeft
			1, # validright

			0.2, #leftXRatio
			0.3, #leftYRatio

			0.4, #rightXRatio
			0.5, #rightYRatio

			1, #leftPupilValidity
			1, #rightPupilValidity

			0.06, #leftPupilDiameter
			0.07, #rightPupilDiameter

			0.08, #leftXOrigin
			0.09, #leftYOrigin
			0.10, #leftZOrigin

			0.11, #rightXOrigin
			0.12, #rightYOrigin
			0.13 #rightZOrigin
	    	]

		timestampSeed = timestampSeed + 1

		gazePoints.append(gazePoint)

	return gazePoints
