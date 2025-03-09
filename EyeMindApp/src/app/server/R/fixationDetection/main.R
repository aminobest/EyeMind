library(data.table)
library(zoo)
library(arrow)
library(jsonlite)
library(plumber)
library(dplyr)    


source(paste(getwd(),"/gazePreprocessing.R",sep = ""))
source(paste(getwd(),"/ivt.R",sep = ""))

cat(paste("RServerPid=",Sys.getpid(), sep = ""))


ParamData <- NULL
gazeData <- NULL   


#* @param params
#* @post /SetParamData
function(params="") {

    message("Set Param Data")

    ParamData <<- list(screenResolutionWidth=as.double(params$xScreenDim),
    screenResolutionHeight=as.double(params$yScreenDim),
    screenDistance=as.double(params$screenDistance),
    monitorSize=as.double(params$monitorSize),
    gapFill=toupper(params$fixationFilterData$isInterpolation),
    maxGapLength=as.double(params$fixationFilterData$maxGapLength),
    noiseReduction=as.logical(params$fixationFilterData$isNoiceReduction),
    filterType=params$fixationFilterData$noiseReductionMethod,
    windowNoise=as.double(params$fixationFilterData$windowSize),
    fixationFilter=params$fixationFilterData$algorithm,
    windowVelocity=as.double(params$fixationFilterData$windowLength),
    velocityThreshold=as.double(params$fixationFilterData$velocityThreshold),
    discardShortFixation=as.logical(params$fixationFilterData$isDiscardShortFixations),
    minDurationFixation=as.double(params$fixationFilterData$minimumFixationDuration),
    mergeFixation=as.logical(params$fixationFilterData$isMergeAdjacentFixations),
    maxTimeBtwFixation=as.double(params$fixationFilterData$maximumTimeBetweenFixations),
    maxAngleBtwFixation=as.double(params$fixationFilterData$maximumAngleBetweenFixations),
    areGazesCorrected=as.logical(params$areGazesCorrected)
    )

  message(ParamData)  

  return("");

  }


#* @post /OpenDataTransferETR
function() {

  message("Open Data Transfer (from EyeMind To R server)")

  gazeData <<- NULL  

 

  return("");

}


#* @post /TransferDataFragmentETR
#* @param dataFragment
function(dataFragment) {

  message("Transfer Data Fragment (from EyeMind To R server)")

  gazeData <<- rbind(gazeData,as.data.table(dataFragment)) 
  return("");

}


#* @post /ApplyFilter
function() {

  message("ApplyFilter")


  #filtering: keeping only events with eventSource=="eye-tracker"
  gazeData <<- gazeData[eventSource == "eye-tracker"]


  # main processing
  results <- mainProcessing(ParamData,gazeData)
  # output processing
  gazeData <<- outputProcessing(results,"IVT")

  #message(paste(getwd(),"/output.csv",sep=""))
  #fwrite(output,paste(getwd(),"/output.csv",sep=""));
  #fwrite(gazeData,paste(getwd(),"/output.csv",sep=""));

  return("")

  # fwrite(gazeData,paste(getwd(),"/output.csv",sep=""));
} 


#* @post /OpenDataTransferRTE
function() {

  message("Open Data Transfer (from R server To EyeMind)")

  res = cbind(nrow(gazeData))

  return(res);

}


#* @post /TransferDataFragmentRTE
#* @param start
#* @param end
function(start,end) {

  message("Transfer Data Fragment (from R server To EyeMind)")

  return(gazeData[start:end]);

}




#json_data <- read_json(path=params$filePath, simplifyDataFrame = TRUE);
#data <- as.data.table(json_data$processedGazeData$gazeData);




#' Main function for the gaze processing calling either the IVT filter or Duration Dispersion filter
#'
#' @param params The list of parameters as given to the script.
mainProcessing <- function(params,data) {
  
  message("mainProcessing");

  data[data == -1, ] <- NA
  
  # Compute the average time difference between timestamps for further processing based on the 100 first samples
  diffTimestamps <- mean(abs(diff(data[1:100, ]$Timestamp)), na.rm = TRUE)
  
  # Get pre-processed data (GazeX, GazeY, InterpolatedGazeX, InterpolatedGazeY)
  message("Gaze pre-processing")
  data <- gazePreProcessing(params, data, diffTimestamps)
  
  # Get fixations / saccades informations using either the IVT filter or the duration dispersion algorithm
 
  message("IVT processing")
  results <- ivt(params, data, diffTimestamps)

   message("mainProcessing Done");
  
  return(results)
  
}

#' Prepare the final output of the gaze processing.
#'
#' @param results A list with gaze data, fixations and saccades information.
#'
#' @return An updated eyetracker sample data.table with fixations and saccades information.
outputProcessing <- function(results, fixationFilter) {

  message("outputProcessing");

  data <- results$data


  fixations <- results$fixations
  

  colNamesGaze <- c("Gaze X", "Gaze Y", "Interpolated Gaze X", "Interpolated Gaze Y", "Interpolated Distance",
                    "Gaze Velocity", "Gaze Acceleration")

  message("outputProcessing: fixations");

  # Add fixations columns
  colNamesFix <- c("Fixation Index by Stimulus", "Fixation X", "Fixation Y", "Fixation Start", "Fixation End",
                   "Fixation Duration", "Fixation Dispersion")
  

  #fwrite(fixations,paste(getwd(),"/output.csv",sep=""));
  
  
  if (is.null(fixations) || nrow(fixations) == 0) {
  
    set(data, j = c("FixID", colNamesFix), value = NA_integer_)
  } else {
    
    data <- with(fixations, {
      invisible(lapply(seq(nrow(fixations)), function(x) {
        set(data, i = which(data$Timestamp >= startTime[x] & data$Timestamp <= endTime[x]), "FixID", ID[x])
      }))
      
      data[, (colNamesFix) := if (!is.na(FixID)) {
        list("", centroidX[FixID], centroidY[FixID], startTime[FixID], endTime[FixID],
             duration[FixID], dispersion[FixID])}, by = FixID] #nolint
    })
  }
  
  # Add saccades columns

  message("outputProcessing: saccades");

  
  colNamesSac <- c("Saccade Index by Stimulus", "Saccade Start", "Saccade End", "Saccade Duration",
                   "Saccade Amplitude", "Saccade Peak Velocity", "Saccade Peak Acceleration",
                   "Saccade Peak Deceleration", "Saccade Direction")
  

  saccades <- results$saccades
  
  
  
  if (is.null(saccades) || nrow(saccades) == 0) {
    
    set(data, j = c("SacID", colNamesSac), value = NA_integer_)
  } else {
   
    data <- with(saccades, {
      invisible(lapply(seq(nrow(saccades)), function(x) {
        set(data, i = which(data$Timestamp >= startTime[x] & data$Timestamp <= endTime[x]), "SacID", ID[x])
      }))
      
      data[, (colNamesSac) := if (!is.na(SacID)) {
        list("", startTime[SacID], endTime[SacID], duration[SacID], amplitude[SacID],
             peakVelocity[SacID], peakAcceleration[SacID], peakDeceleration[SacID],
             dirAngle[SacID])}, by = SacID] #nolint
    })
      
  }

  
  
  data <- data[, -c("Distance")]

  
  
  attr(data, "sensorName") <- "I-VT filter"

  

  message("outputProcessing Done");

  #fwrite(data,paste(getwd(),"/output.csv",sep=""));
  
  return(data)
}




# Code adapted from iMotions, fixation filter R notebook under the following license:

# The contents of this script are licensed under the MIT license:
# Copyright (c) 2018 iMotions
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
