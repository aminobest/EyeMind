
#' Compute averaged GazeX / GazeY and Distance based on both eyes if available (else only the eye available is used).
#'
#' @param data A data.table containing the eyetracker sample.
#' @param params The list of parameters as given to the script.
#' @return A data.table with added GazeX, GazeY and Distance column based on available eyes.
eyeSelection <- function(data,params) {

    leftX  <-  if (params$areGazesCorrected) "leftX-corrected" else "leftX"
    leftY <-   if (params$areGazesCorrected) "leftY-corrected" else "leftY"
    rightX <-  if (params$areGazesCorrected) "rightX-corrected" else "rightX"
    rightY <-  if (params$areGazesCorrected) "rightY-corrected" else "rightY"

    message("used columns", leftX, leftY, rightX, rightY)

    # Compute average if both eyes are available else only the eye available is used
    data$GazeX <- rowMeans(data[, c(leftX, rightX),  with=FALSE], na.rm = T)
    data$GazeY <- rowMeans(data[, c(leftY, rightY),  with=FALSE], na.rm = T)
    data$Distance <- rowMeans(data[, c("leftDistance", "rightDistance")], na.rm = T)

    # Clean data by removing other signals
    #data <- data[, -c("leftDistance", "rightDistance", leftX, rightX, leftY, rightY), with=FALSE]

    return(data)
}


#' Fill missing values in eyetracker data by interpolating between the value right before and after the gap.
#'
#' @param signal A data.table column containing missing values to fill.
#' @param gapInfos A data.table containing the start and end index of each gap.
#'
#' @return Interpolated data.table column (NA will still be present when gaps were not interpolated).
interpolateSignal <- function(signal, gapInfos) {
    # Get values before and after each gap to interpolate
    valueBefore <- signal[[1]][gapInfos$start - 1]
    valueAfter <- signal[[1]][gapInfos$end + 1]

    # Get duration of gap and give each gap a distinct ID
    gapDuration <- gapInfos$end - gapInfos$start + 1

    gaps <- data.table(ID = rep(seq(nrow(gapInfos)), times = gapDuration))
    gaps[, Obs := seq(gapInfos$start[ID], gapInfos$end[ID]), by = ID]
    gaps[, Value := seq(valueBefore[ID], valueAfter[ID], length.out = gapDuration[ID] + 2)[2:(gapDuration[ID] + 1)],
         by = ID]

    signal[gaps$Obs] <- gaps$Value
    return(signal)
}

#' Detect gaps in the eyetracker data and call interpolateSignal() to fill the gaps.
#'
#' @param data A data.table containing the eyetracker sample.
#' @param diffTimestamps The average time difference between timestamps based on the 100 first samples.
#' @param colName Name of the signal on which gaps needs to be filled.
#' @param newColName Name of the new signal to generate (gap-filled).
#' @param maxGapLength maxGapLength parameter as given to the IVT/dispersion algorithm.
#'
#' @return A data.table with interpolated data for the variable wanted.
computeGap <- function(data, diffTimestamps, colName, newColName, maxGapLength) {
    # Find where data is missing (NA value) and set the corresponding quality to 0
    if (colName == "Distance") {
        quality <- as.numeric(!is.na(data[[colName]]) & !(data[[colName]] == 0))
    } else {
        quality <- as.numeric(!is.na(data[[colName]]))
    }

    # Compute start and endpoints of missing data
    gapInfos <- with(rle(quality), {
        end <- cumsum(lengths)
        start <- end - lengths + 1
        ok <- values == 0 & lengths + 1 <= (maxGapLength / diffTimestamps) & start != 1 & end != tail(end, 1)
        data.table(start, end)[ok, ]
    })

    # If at least one gap found, interpolate gaps
    if (nrow(gapInfos) > 0) {
        # Interpolate signal of interest
        data[, (newColName) := interpolateSignal(data[, colName, with = FALSE], gapInfos)]
    } else {
        data[, (newColName) := data[, colName, with = FALSE]]
    }

    return(data)
}


#' Interpolate the distance to screen and the gaze coordinates if gapFill is enabled.
#'
#' @param data A data.table containing the eyetracker sample.
#' @param diffTimestamps The average time difference between timestamps based on the 100 first samples.
#' @param maxGapLength maxGapLength parameter as given to the IVT/dispersion algorithm.
#' @param gapFill gapFill parameter as given to the IVT/dispersion algorithm.
#'
#' @return A data.table with added InterpolatedGazeX, InterpolatedGazeY and InterpolatedDistance column.
gapFilling <- function(data, diffTimestamps, maxGapLength, gapFill) {
    if (gapFill) {
        # X Gaze gap detection
        data <- computeGap(data, diffTimestamps, "GazeX", "InterpolatedGazeX", maxGapLength)
        # Y Gaze gap detection
        data <- computeGap(data, diffTimestamps, "GazeY", "InterpolatedGazeY", maxGapLength)
        # Distance gap detection
        data <- computeGap(data, diffTimestamps, "Distance", "InterpolatedDistance", maxGapLength)
    } else {
        data$InterpolatedGazeX <- data$GazeX
        data$InterpolatedGazeY <- data$GazeY
        data$InterpolatedDistance <- data$Distance
    }

    return(data)
}


#' Perform symmetrical moving average or median based on filterType.
#'
#' @param signal A data.table column containing the signal that needs to be filtered.
#' @param windowNoise windowNoise parameter as given to the IVT/dispersion algorithm.
#' @param filterType filterType parameter as given to the IVT/dispersion algorithm.
#'
#' @return The signal with noise filtered.
movingNoiseReduction <- function(signal, windowNoise, filterType) {
    # Get the number of sample on each side to design the symmetrical filter
    halfWindow <- floor((windowNoise - 1) / 2)

    # Create a new data.table that will contain all padded signal necessary for the moving noise filtering
    paddedSignals <- data.table(signal)

    toDiscard <- is.na(signal)
    i <- 1
    while (i <= halfWindow) {
        padLeft <- shift(signal, i, type = "lag")
        padRight <- shift(signal, i, type = "lead")

        # Compute the number of sample available at each timestamp to see if enough are available
        # Correct values on both sides are needed to compute the average/median
        nbSample <- as.numeric(!is.na(padLeft)) + as.numeric(!is.na(padRight))
        toDiscard <- toDiscard | (nbSample %% 2 != 0)

        padLeft[toDiscard] <- NA
        padRight[toDiscard] <- NA

        # Store data with different padding
        paddedSignals[[2 + (i - 1) * 2]] <- padLeft
        paddedSignals[[3 + (i - 1) * 2]] <- padRight

        i <- i + 1
    }

    # Based on filterType, perform a moving average or a moving median
    if (filterType == "Average") {
        denoisedSignal <- rowMeans(paddedSignals, na.rm = TRUE)
    } else if (filterType == "Median") {
        denoisedSignal <- apply(paddedSignals, 1, median, na.rm = TRUE)
    }

    return(denoisedSignal)
}


#' Perform gap filling and noise reduction if enabled.
#'
#' @param params The list of parameters as given to the script.
#' @param data A data.table containing the eyetracker sample that needs to be pre-processed.
#' @param diffTimestamps The average time difference between timestamps based on the 100 first samples.
#'
#' @return The pre-processed eyetracker data.table.
gazePreProcessing <- function(params, data, diffTimestamps) {
    # 1) Select which eye to use based on missing data (both eyes by default) =========================================
    data <- eyeSelection(data,params)

    # 2) Interpolate the distance to screen and gaze position if gap filling is enabled ===============================
    data <- gapFilling(data, diffTimestamps, params$maxGapLength, params$gapFill)

    # 3) Noise Reduction if enabled ===================================================================================
    if (params$noiseReduction) {
        data$InterpolatedGazeX <- movingNoiseReduction(data$InterpolatedGazeX, params$windowNoise, params$filterType)
        data$InterpolatedGazeY <- movingNoiseReduction(data$InterpolatedGazeY, params$windowNoise, params$filterType)
    }

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
