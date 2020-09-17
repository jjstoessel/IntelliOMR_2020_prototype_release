import json
import numpy as np
from scipy.ndimage import interpolation as inter
from scipy import signal as sg
from PIL import Image
from urllib.request import urlopen
from io import StringIO
import math
import copy


def getWindowedSum(filteredImage):
    (height, width) = filteredImage.shape
    windowHeight = math.floor(height / 4)
    maxSums = np.zeros(width)

    for y in range(height - windowHeight):
        subarray = filteredImage[y:(y + windowHeight - 1), :]
        columnSums = np.sum(subarray, axis=0)
        maxSums = np.maximum(maxSums, columnSums)
    maxSums = maxSums/windowHeight

    return maxSums


def k2meansThreshold(values):
    min = np.amin(values)
    max = np.mean(values)
    min_sum = 0
    min_items = 0
    max_sum = 0
    max_items = 0

    for i in range(10):
        for v in range(len(values)):
            val = values[v]
            dist1 = abs(min - val)
            dist2 = abs(max - val)
            if (dist1 < dist2):
                min_sum += val
                min_items += 1
            else:
                max_sum += val
                max_items += 1
        min = min_sum / min_items
        max = max_sum / max_items
    return (min + max) / 2


def identifySections(edges, threshold):
    # iterate through array until minimum peak is found, then find associated max
    pos = 0
    results = []
    while pos < edges.size:

        # iterate through the positions until we find a point that is less than the min threshold
        if (edges[pos] > threshold):
            posStart = pos

            # iterate until we find the end
            while (pos < edges.size - 2) and (edges[pos] > threshold):
                pos += 1

            # this is the pair
            print("pair found at %s %s" % (posStart, pos))
            section = {"start": posStart, "end": pos}
            results.append(section)

        pos += 1
    return results


def stitch(sections, documentWidth, documentHeight):
    stitchedSections = []
    previousSection = copy.deepcopy(sections[0])
    stitchedSections.append(previousSection)
    minGap = documentWidth/100

    for i in range(1, len(sections)):
        nextSection = copy.deepcopy(sections[i])
        gap = nextSection['start']-previousSection['end']

        if gap < minGap:
            previousSection['end'] = nextSection['end']
        else:
            stitchedSections.append(nextSection)
            previousSection = nextSection

    largeSections = []
    minWidth = documentWidth/4
    margin = math.floor(documentWidth/100)
    for i in range(len(stitchedSections)):
        section = stitchedSections[i]
        width = section['end']-section['start']
        if (width > minWidth):
            section['start'] = max(0, section['start']-margin)
            section['end'] = min(documentWidth-1, section['end']+margin)
            largeSections.append(section)
        section['x'] = section['start']/documentWidth
        section['width'] = (section['end']-section['start'])/documentWidth
        section['y'] = 0
        section['height'] = 1.0

    return largeSections


def extractPageBoundaries(url, orientation):
    img = Image.open(urlopen(url))
    image = img.convert('L')
    original_img = np.array(image)  # converts the jpg into a 2d array
    original_img = inter.rotate(
        original_img, orientation, reshape=False, order=0)

    # apply an edge detector to highlight staff lines
    edgeDetector = [[-1, -1, -1, -1, -1],
                    [-1, -1, -1, -1, -1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]]
    filteredImage = np.abs(sg.convolve2d(
        original_img, edgeDetector, mode='same'))

    # project onto the x axis
    columnSums = getWindowedSum(filteredImage)

    # calculate the threshold between staff / no staff values
    threshold = k2meansThreshold(columnSums)

    # use the threshold for identifying areas of staffs / no staffs
    results = identifySections(columnSums, threshold)
    width = filteredImage.shape[1]
    height = filteredImage.shape[0]

    # stitch together broken regions to reduce the noise
    results = stitch(results, width, height)
    return results


def main(event, context):
    fileName = (json.loads(event['body']))['image']
    orientation = (json.loads(event['body']))['orientation']
    pageBoundaries = extractPageBoundaries(fileName, orientation)

    body = {
        "filename": fileName,
        "pageBoundaries": pageBoundaries
    }

    response = {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }

    return response


if __name__ == "__main__":
    main('', '')
