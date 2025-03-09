#' Convert from pixel to mm based on a dpi value.
#'
#' @param obj Coordinates in pixel to convert.
#' @param dpi A dot per inch value (based on screen resolution and diagonal length of the screen).
#'
#' @return Object / coordinate in mm.
toMm <- function(obj, dpi) {
  obj <- obj / dpi * 25.4
  return(obj)
}



#' Compute each angle in degrees between the two matrices of 3D coordinates.
#'
#' @param matrix1 2D matrices of coordinates [3 x nbSample].
#' @param matrix2 2D matrices of coordinates [3 x nbSample].
#'
#' @return Array of angles in degree [nbSample].
angleDegrees <- function(matrix1, matrix2) {
    cosAngleRad <- sapply(seq(nrow(matrix1)), function(x) (matrix2[x, ] %*% matrix1[x, ]) /
                              (sqrt(matrix1[x, 1] ^ 2 + matrix1[x, 2] ^ 2 + matrix1[x, 3] ^ 2) *
                                   sqrt(matrix2[x, 1] ^ 2 + matrix2[x, 2] ^ 2 + matrix2[x, 3] ^ 2)))

    cosAngleRad[which(abs(cosAngleRad) > 1)] <- sign(cosAngleRad[which(abs(cosAngleRad) > 1)])

    angleRad <- acos(round(cosAngleRad, 10))
    angleDegree <- angleRad * 180.0 / pi

    return(angleDegree)
}

#' Compute the GazeVelocityAngle and GazeAccelerationAngle based on gaze data.
#'
#' @param data A data.table containing the eyetracker sample.
#' @param diffTimestamps The average time difference between timestamps based on the 100 first samples.
#' @param screenResolutionWidth screenResolutionWidth parameter as given to the IVT algorithm.
#' @param screenResolutionHeight screenResolutionHeight parameter as given to the IVT algorithm.
#' @param dpi The dots per inch value to transform distances in mm.
#' @param windowVelocity windowVelocity parameter as given to the IVT algorithm.
#'
#' @return A data.table with added GazeVelocityAngle and GazeAccelerationAngle columns
#'         also adding gazeXmm/gazeYmm/gazeZmm and eyeXmm/eyeYmm/eyeZmm for further computation.
velocityComputation <- function(data, diffTimestamps, screenResolutionWidth, screenResolutionHeight, dpi,
                                windowVelocity) {

    # Create empty columns if not enough data is available to compute velocity
    if (nrow(data) < 2) {
        data$GazeVelocityAngle <- NA_integer_
        data$GazeAccelerationAngle <- NA_integer_
        return(data)
    }

    # Convert gaze positions in mm for computing the velocity angle (z is set to 0)
    data$gazeXmm <- toMm(data$InterpolatedGazeX, dpi)
    data$gazeYmm <- toMm(data$InterpolatedGazeY, dpi)
    data$gazeZmm <- 0

    # Convert eye positions in mm (eyes are assumed centered in the middle of the screen)
    # Distance doesn't need to be converted as it is already given in mm
    data$eyeXmm <- toMm(screenResolutionWidth / 2, dpi)
    data$eyeYmm <- toMm(screenResolutionHeight / 2, dpi)
    data$eyeZmm <- data$InterpolatedDistance

    # Calculate the number of samples in the velocity window by dividing the windowVelocity in msec by the average
    # time difference of the first 100 samples, and looking at the nearest odd number
    # We will always use minimum 3 samples for further computation and maximum the total duration of the stimulus
    windowSample <- max(floor((windowVelocity / diffTimestamps) + 1) - floor((windowVelocity / diffTimestamps) %% 2), 3)
    windowSample <- min(windowSample, nrow(data) + floor(nrow(data) %% 2) - 1)
    halfWindow <- floor(windowSample / 2)

    # For each velocity window get the start, middle and end sample index (startIdx, idx and endIdx respectively)
    idx <- seq(halfWindow + 1, nrow(data) - halfWindow)
    startIdx <- idx - halfWindow
    endIdx <- idx + halfWindow

    # For each window, get: - time difference between start and end values
    # - gaze positions for start (gaze0) and end (gaze1) values
    # - eye position during the change of position
    gaze0 <- cbind(data$gazeXmm[startIdx], data$gazeYmm[startIdx], data$gazeZmm[startIdx])
    gaze1 <- cbind(data$gazeXmm[endIdx], data$gazeYmm[endIdx], data$gazeZmm[endIdx])
    eyePosition <- cbind(data$eyeXmm[idx], data$eyeYmm[idx], data$eyeZmm[idx])

    # Compute gaze direction and calculate the angle between them
    gazeDirection0 <- gaze0 - eyePosition
    gazeDirection1 <- gaze1 - eyePosition

    angleDeg <- angleDegrees(gazeDirection0, gazeDirection1)

    # All x and y coordinates must be available in the window to compute the velocity
    xExist <- zoo::rollapply(as.numeric(!is.na(data$gazeXmm)), (halfWindow * 2) + 1, mean)
    yExist <- zoo::rollapply(as.numeric(!is.na(data$gazeYmm)), (halfWindow * 2) + 1, mean)
    bothExist <- as.numeric(xExist == 1 & yExist == 1)
    bothExist[which(bothExist == 0)] <- NA

    # Compute the velocity based on the angular angle
    dtseconds <- (data$Timestamp[endIdx] - data$Timestamp[startIdx]) / 1000
    dtseconds[which(dtseconds == 0)] <- NA
    data$GazeVelocityAngle <- c(rep(NA, halfWindow), abs(angleDeg / dtseconds) * bothExist, rep(NA, halfWindow))

    # Also compute the acceleration based on the velocity - this time we don't use a window
    dtseconds <- diff(data$Timestamp) / 1000
    dtseconds[which(dtseconds == 0)] <- NA
    data$GazeAccelerationAngle <- c(NA, diff(data$GazeVelocityAngle) / dtseconds)

    return(data)
}

#' Convert an object size (or distance between two dots) in visual angle using the distance to screen variable.
#'
#' @param size Size of the object (or distance between two dots) that needs to be converted in visual angle.
#' @param screenDistance Distance to the screen (in the same unit as the size).
#'
#' @return The size (or distance) in visual angle.
distanceToVisualAngle <- function(size, screenDistance) {
  rad <- 2 * atan(size / (2 * screenDistance))
  visualAngle <- rad * (180 / pi)
  return(visualAngle)
}

#' Compute the dispersion (root mean square value) between a fixation points and its centroid.
#'
#' @param fixationXY A 2D array with fixation points X/Y coordinates (in pixels).
#' @param centroidXY A 2D array with centroid points X/Y coordinates (in pixels).
#' @param screenDistance The distance to the screen (in mm).
#' @param dpi The dots per inch value to transform distances in mm.
#'
#' @return The root mean square distance value for this fixation (in visual degree).
dispersionDegree <- function(fixationXY, centroidXY, screenDistance, dpi) {
  dispersion <- sqrt(mean((fixationXY[, 1] - centroidXY[, 1]) ^ 2 + (fixationXY[, 2] - centroidXY[, 2]) ^ 2, na.rm = T))
  dispersionDegree <- distanceToVisualAngle(toMm(dispersion, dpi), screenDistance)
  return(dispersionDegree)
}



#' Compute Fixation events information (start/end time, duration and averaged gaze/eye).
#'
#' @param data A data.table containing the eyetracker sample.
#' @param eventType The classification of gazepoint as Fixation/Saccade/Unknown.
#' @param dpi The dots per inch value to transform distances in mm.
#'
#' @return A data.table with information about fixations.
ivtFixationProcessing <- function(data, eventType, dpi) {
    # Get start / end index for each fixation event
    epFix <- with(rle(eventType), {
        end <- cumsum(lengths)
        start <- end - lengths + 1
        ok <- values == 0
        data.table(start, end)[ok, ]
    })

    # If no fixation are found return an empty table
    if (nrow(epFix) == 0) {
        fixations <- data.table(matrix(data = NA_integer_, ncol = 14, nrow = 0))
        names(fixations) <- c("ID", "startTime", "endTime", "centroidX", "centroidY", "centroidXmm", "centroidYmm",
                              "centroidZmm", "eyeXmm", "eyeYmm", "firstEyeZmm", "lastEyeZmm", "dispersion", "duration")
        return(fixations)
    }

    fixations <- data.table(ID = seq(nrow(epFix)))

    # The fixation start (end) will correspond to the average between the first (last) sample being part of it and the
    # one just before (after)
    # Note: centroidZmm, eyeXmm and eyeYmm are constant so we can just use the start value
    fixations <- with(epFix, {
        fixations[, `:=`(startTime = min(mean(data$Timestamp[(start[ID] - 1):start[ID]]),
                                         data$Timestamp[start[ID]], na.rm = T),
                         endTime = max(mean(data$Timestamp[end[ID]:(end[ID] + 1)]), data$Timestamp[end[ID]], na.rm = T),
                         centroidX = mean(data$InterpolatedGazeX[start[ID]:end[ID]]),
                         centroidY = mean(data$InterpolatedGazeY[start[ID]:end[ID]]),
                         centroidXmm = mean(data$gazeXmm[start[ID]:end[ID]]),
                         centroidYmm = mean(data$gazeYmm[start[ID]:end[ID]]),
                         centroidZmm = data$gazeZmm[start[ID]],
                         eyeXmm = data$eyeXmm[start[ID]],
                         eyeYmm = data$eyeYmm[start[ID]],
                         firstEyeZmm = data$eyeZmm[start[ID]],
                         lastEyeZmm = data$eyeZmm[end[ID]]),
                  by = "ID"]

        fixations[, `:=`(dispersion = ifelse(end[ID] != start[ID],
                                             dispersionDegree(cbind(data$InterpolatedGazeX[start[ID]:end[ID]],
                                                                    data$InterpolatedGazeY[start[ID]:end[ID]]),
                                                              centroidXY = cbind(centroidX[1], centroidY[1]),
                                                              mean(data$InterpolatedDistance[start[ID]:end[ID]]),
                                                              dpi),
                                             NA_real_),
                         duration = endTime - startTime),
                  by = "ID"]
    })

    return(fixations)
}

#' Compute the amplitude (distance) between the start of a saccade and its end.
#'
#' @param sacStartXY A vector with X/Y coordinates of the start of the saccade (in pixels).
#' @param sacEndXY A vector with X/Y coordinates of the end of the saccade (in pixels).
#' @param screenDistance The distance to the screen (in mm).
#' @param dpi The dots per inch value to transform distances in mm.
#'
#' @return The root mean square distance value for this fixation (in visual degree).
amplitudeDegree <- function(sacStartXY, sacEndXY, screenDistance, dpi) {
    amplitude <- sqrt((sacEndXY[1] - sacStartXY[1]) ^ 2 + (sacEndXY[2] - sacStartXY[2]) ^ 2)
    amplitudeDegree <- distanceToVisualAngle(toMm(amplitude, dpi), screenDistance)
    return(amplitudeDegree)
}


#' Compute a direction angle based on the start and end of a saccade.
#'
#' @param sacStartXY A vector with X/Y coordinates of the start of the saccade (in pixels).
#' @param sacEndXY A vector with X/Y coordinates of the end of the saccade (in pixels).
#'
#' @return An angle in degree ranging from 0 to 360 (0 being an horizontal saccade from left to right
#'         and 90 a vertical saccade from bottom to top).
directionAngle <- function(sacStartXY, sacEndXY) {
    dy <- sacEndXY[2] - sacStartXY[2]
    dx <- sacEndXY[1] - sacStartXY[1]
    theta <- atan2(dy, dx) # range (-PI, PI]
    theta <- theta * 180 / pi # convert radians to degrees, range (-180, 180]

    if (theta < 0) {
        theta <- 360 + theta # range [0, 360)
    }

    return(theta)
}

#' Compute Saccades events information (start/end time, duration and averaged gaze/eye).
#'
#' @param data A data.table containing the eyetracker sample.
#' @param eventType The classification of gazepoint as Fixation/Saccade/Unknown.
#' @param dpi The dots per inch value to transform distances in mm.
#'
#' @return A data.table with information about saccades.
ivtSaccadeProcessing <- function(data, eventType, dpi) {
    # Get start / end index for each saccade event
    epSac <- with(rle(eventType), {
        end <- cumsum(lengths)
        start <- end - lengths + 1
        ok <- values == 1
        data.table(start, end)[ok, ]
    })

    # If no saccade are found return an empty object
    if (nrow(epSac) == 0) {
        saccades <- data.table(matrix(data = NA_integer_, ncol = 9, nrow = 0))
        names(saccades) <- c("ID", "startTime", "endTime", "amplitude", "peakVelocity", "peakAcceleration",
                             "peakDeceleration", "dirAngle", "duration")
        return(saccades)
    }

    saccades <- data.table(ID = seq(nrow(epSac)))

    # The saccade start (end) will correspond to the average between the first (last) sample being part of it and the
    #  one just before (after)
    saccades <- with(epSac, {
        saccades[, `:=`(startTime = min(mean(data$Timestamp[(start[ID] - 1):start[ID]]), data$Timestamp[start[ID]],
                                        na.rm = T),
                        endTime = max(mean(data$Timestamp[end[ID]:(end[ID] + 1)]), data$Timestamp[end[ID]], na.rm = T),
                        amplitude = ifelse(end[ID] != start[ID],
                                           amplitudeDegree(sacStartXY = c(data$InterpolatedGazeX[start[ID]],
                                                                          data$InterpolatedGazeY[start[ID]]),
                                                           sacEndXY = c(data$InterpolatedGazeX[end[ID]],
                                                                        data$InterpolatedGazeY[end[ID]]),
                                                           mean(data$InterpolatedDistance[start[ID]:end[ID]]), dpi),
                                           NA_real_),
                        peakVelocity = max(data$GazeVelocityAngle[start[ID]:end[ID]], na.rm = T),
                        peakAcceleration = max(0, data$GazeAccelerationAngle[start[ID]:end[ID]], na.rm = T),
                        peakDeceleration = min(0, data$GazeAccelerationAngle[start[ID]:end[ID]], na.rm = T),
                        dirAngle = ifelse(end[ID] != start[ID],
                                          directionAngle(sacStartXY = c(data$InterpolatedGazeX[start[ID]],
                                                                        data$InterpolatedGazeY[start[ID]]),
                                                         sacEndXY = c(data$InterpolatedGazeX[end[ID]],
                                                                      data$InterpolatedGazeY[end[ID]])),
                                          NA_real_)),
                 by = "ID"]

        saccades[peakAcceleration == 0, ]$peakAcceleration <- NA
        saccades[peakDeceleration == 0, ]$peakDeceleration <- NA
        saccades[, duration := endTime - startTime, by = "ID"]

    })

    return(saccades)
}

#' Merge fixations nearby using their indexes.
#'
#' @param fixationSubset A data table composed of adjacent fixations that need to be merged.
#'
#' @return A data table observation with information about the merged fixation.
mergeAdjacentFixations <- function(fixationSubset) {
    # Compute weight of each fixation based on their duration
    weights <- fixationSubset$duration / sum(fixationSubset$duration)

    # Compute new weighted fixation gaze positions and new duration
    mergedFixation <- data.table()

    # Compute values that need to be updated after merge, else it keeps the first fixation values
    # Note: centroidZmm, eyeXmm and eyeYmm are constant so we don't need to update this value
    mergedFixation <- with(fixationSubset, {
        mergedFixation[, `:=`(endTime = tail(endTime, 1),
                              centroidX = sum(centroidX * weights),
                              centroidY = sum(centroidY * weights),
                              centroidXmm = sum(centroidXmm * weights),
                              centroidYmm = sum(centroidYmm * weights),
                              lastEyeZmm = tail(lastEyeZmm, 1),
                              duration = tail(endTime, 1) - head(startTime, 1))]
    })

    # Merging with the value that didn't got updated
    fixedValue <- fixationSubset[1, !names(mergedFixation), with = FALSE]
    mergedFixation <- cbind(fixedValue, mergedFixation)[, names(fixationSubset), with = FALSE]

    return(mergedFixation)
}

#' Check if pairs of fixations should be merged together (based on time/angle between fixations).
#'
#' @param f1 A data table with information about each potential first fixation to merge
#'            (same fixations can be listed multiple time).
#' @param f2 A data table with information about each potential second fixation to merge
#'            (same fixations can be listed multiple time).
#' @param maxAngleBtwFixation maxAngleBtwFixation parameter as given to the IVT algorithm.
#'
#' @return A boolean array returning for each pairs of fixations TRUE if they can be merge, FALSE otherwise.
checkFixations <- function(f1, f2, maxAngleBtwFixation) {
  # For each pair of fixation get:
  # - gaze positions of each fixation
  # - eye position during the change of fixation
  # Note: centroidZmm, eyeXmm and eyeYmm are constant so it doesn't matter which fixation is used for these values
  gaze0 <- cbind(f1[["centroidXmm"]], f1[["centroidYmm"]], f1[["centroidZmm"]])
  gaze1 <- cbind(f2[["centroidXmm"]], f2[["centroidYmm"]], f2[["centroidZmm"]])
  eyePosition <- cbind(f1[["eyeXmm"]], f1[["eyeYmm"]], (f1[["lastEyeZmm"]] + f2[["firstEyeZmm"]]) / 2)

  # Compute gaze direction and calculate the angle between them
  gazeDirection0 <- gaze0 - eyePosition
  gazeDirection1 <- gaze1 - eyePosition

  angleDeg <- angleDegrees(gazeDirection0, gazeDirection1)

  toMerge <- c(angleDeg <= maxAngleBtwFixation)
  return(toMerge)
}

#' Merge fixations nearby using their indexes.
#'
#' @param fixations A data.table with information about the fixations to potentially merge.
#' @param saccades A data.table with information about the saccades that need to potentially be updated.
#' @param maxTimeBtwFixation maxTimeBtwFixation parameter as given to the IVT algorithm.
#' @param maxAngleBtwFixation maxAngleBtwFixation parameter as given to the IVT algorithm.
#' @param dpi The dots per inch value to transform distances in mm.
#' @param data A data.table with information about the gaze data to recompute the dispersion metric after merge.
#' @param eventType The classification of gazepoint as Fixation/Saccade/Unknown.
#'
#' @return An updated data.table with merged fixations.
mergeFixations <- function(fixations, saccades, maxTimeBtwFixation, maxAngleBtwFixation, dpi, data, eventType) {
    # We need to find all combinations of fixations that are close enough in time
    # only combinations with a "time between fixation" inferior to maxTimeBtwFixation are checked for merge
    fixCombn <- do.call(cbind, lapply(seq(nrow(fixations) - 1), function(i) {
        j <- i + 1
        repeat {
            if (fixations$startTime[j] - fixations$endTime[i] > maxTimeBtwFixation || j == nrow(fixations) + 1) break()
            j <- j + 1
        }

        if (j > i + 1) {
            return(rbind(i, (i + 1):(j - 1)))
        }
    }))

    if (is.null(fixCombn)) return(list(fixations = fixations, saccades = saccades))

    fixCombn <- data.table(t(fixCombn))
    names(fixCombn) <- c("f1", "f2")
    fixCombn$IDcombn <- seq(nrow(fixCombn))

    # Temporary store gaze data corresponding to fixations for dispersion recomputation
    fixationData <- data[eventType == 0, ]

    repeat {
        # Look for all pair of fixations that could potentially be merged (i.e. the visual angle is below the
        #  maxAngleBtwFixation threshold), if no possible merge is found with exit the loop
        setkey(fixations, ID)
        toMerge <- fixCombn[checkFixations(fixations[.(fixCombn$f1)], fixations[.(fixCombn$f2)], maxAngleBtwFixation), ]

        # Select all available non-overlapping merges
        repeat {
            idx <- with(toMerge, head(which(!c(TRUE, head(f2, -1) < tail(f1, -1))), 1))

            if (!length(idx)) break()
            toMerge <- toMerge[-idx, ]
        }

        # Merge the fixations and start the loop again to see if other fixations need to be merged
        if (nrow(toMerge) > 0) {
            # Get merged fixations events
            mergedFix <- with(toMerge, {
              toMerge[, mergeAdjacentFixations(fixations[.(f1[IDcombn == .BY]:f2[IDcombn == .BY]), nomatch = 0L]),
                      by = "IDcombn"]
              })

            # Update fixations with merged informations
            fixations[ID %in% mergedFix$ID, ] <- mergedFix[, !("IDcombn")]

            # Clean merged fixations and update fixation ID
            fixations <- fixations[!ID %inrange% list(toMerge$f1 + 1, toMerge$f2), ]

            # If a saccade occurs between any merged fixations, we need to remove it
            saccades <- saccades[!(inrange(startTime, mergedFix$startTime, mergedFix$endTime, incbounds = F) &
                                   inrange(endTime, mergedFix$startTime, mergedFix$endTime, incbounds = F)), ]

            saccades <- saccades[, ID := seq(nrow(saccades))]

            # We need to update the fixations combination to check for merge now that we completed a round of merge
            toRemove <- fixCombn[f1 %inrange% list(toMerge$f1, toMerge$f2 - 1) |
                                   f2 %inrange% list(toMerge$f1 + 1, toMerge$f2), ]$IDcombn

            fixCombn <- fixCombn[!IDcombn %in% toRemove, ]
            fixCombn[f1 %in% toMerge$f2, "f1"] <- toMerge[match(fixCombn[f1 %in% toMerge$f2, ]$f1, toMerge$f2), ]$f1
        }

        # If we have less than two fixations or have checked all fixations without finding any potential merge, we stop
        #  the process
        if (nrow(fixations) < 2 || nrow(toMerge) == 0 || nrow(fixCombn) == 0) {
            break()
        }
    }

    # Get merged events information to recompute the dispersion of the fixation while ignoring merged saccade events
    epFix <- with(rle(eventType), {
        ok <- values == 0
        individualFixEnd <- cumsum(lengths[ok])
        individualFixStart <- individualFixEnd - lengths[ok] + 1
        end <- individualFixEnd[c(cumsum(diff(fixations$ID)), length(individualFixEnd))]
        start <- c(1, head(end, -1) + 1)
        data.table(start, end)
    })

    fixations <- fixations[, ID := seq(nrow(fixations))]

    fixations <- with(epFix, {
      fixations[, `:=`(dispersion = ifelse(end[ID] != start[ID],
                                           dispersionDegree(cbind(fixationData$InterpolatedGazeX[start[ID]:end[ID]],
                                                                  fixationData$InterpolatedGazeY[start[ID]:end[ID]]),
                                                            centroidXY = cbind(centroidX[1], centroidY[1]),
                                                            mean(fixationData$InterpolatedDistance[start[ID]:end[ID]]),
                                                            dpi),
                                           NA_real_)),
                by = "ID"]
    })

    return(list(fixations = fixations, saccades = saccades))
}


#' Discard fixations that are below the minDurationFixation threshold.
#'
#' @param fixations A data.table with information about the fixations to potentially discard.
#' @param minDurationFixation minDurationFixation parameter as given to the IVT algorithm.
#'
#' @return An updated data.table without discarded fixations
discardFixations <- function(fixations, minDurationFixation) {
  
    # Find which fixations are below the minDurationFixation threshold in order to discard them
    removeIdx <- which(fixations$duration < minDurationFixation)

    if (length(removeIdx) > 0) {
        fixations <- fixations[!ID %in% removeIdx]
        fixations <- fixations[, ID := seq(nrow(fixations))]
    }

    return(fixations)
}



#' Based on a angular velocity threshold, classify gazepoints as fixations/saccades/unknown and return information
#' about each fixation/saccade.
#'
#' @param params The list of parameters as given to the IVT algorithm.
#' @param data A data.table containing the eyetracker sample for ivt processing.
#' @param diffTimestamps The average time difference between timestamps based on the 100 first samples.
#'
#' @return A list with gaze data, fixations and saccades information.
ivt <- function(params, data, diffTimestamps) {
    # Compute dpi (dots per inch) to transform pixel distances in mm
    dpi <- sqrt(params$screenResolutionWidth ^ 2 + params$screenResolutionHeight ^ 2) / params$monitorSize

    # 1) Velocity computation - adding GazeVelocityAngle and GazeAccelerationAngle column =============================
    # Some temporary columns are also created to be used by the ivtFixationProcessing and ivtSaccadeProcessing functions
    # namely gazeXmm/gazeYmm/gazeZmm and eyeXmm/eyeYmm/eyeZmm
    message("IVT - velocity computation")
    data <- velocityComputation(data, diffTimestamps, params$screenResolutionWidth, params$screenResolutionHeight,
                                dpi, params$windowVelocity)

    # 2) Classify velocity angles into Fixation/Saccade/Unknown (0/1/2 respectively) ==================================
    # based on the velocity threshold defined
    eventType <- as.numeric(data$GazeVelocityAngle >= params$velocityThreshold) # Fixation as 0 / Saccade as 1
    eventType[is.na(data$GazeVelocityAngle)] <- 2 # Unknown as 2

    # 3) Compute Fixations events information =========================================================================
    message("IVT - processing fixations")
    fixations <- ivtFixationProcessing(data, eventType, dpi)

    # 4) Compute Saccades events information ==========================================================================
    message("IVT - processing saccades")
    saccades <- ivtSaccadeProcessing(data, eventType, dpi)

    # Remove temporary columns from the data
    data <- data[, -c("gazeXmm", "gazeYmm", "gazeZmm", "eyeXmm", "eyeYmm", "eyeZmm")]

    # 5) Merge fixation nearby and update saccades if needed ==========================================================
    # if there is more than one fixation and params$mergeFixation is enabled, check if they need to be merged
    if (params$mergeFixation && nrow(fixations) >= 2) {
          message("IVT - merging fixations")
          mergedEvents <- mergeFixations(fixations, saccades, params$maxTimeBtwFixation, params$maxAngleBtwFixation,
                                         dpi, data, eventType)

          fixations <- mergedEvents$fixations
          saccades <- mergedEvents$saccades
    }

    # 6) Discard short fixation if enabled ============================================================================
    if (params$discardShortFixation && nrow(fixations) != 0) {
        message("IVT - discarding fixations")
        fixations <- discardFixations(fixations, params$minDurationFixation)
    }

    return(list(data = data, fixations = fixations, saccades = saccades))
}

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
