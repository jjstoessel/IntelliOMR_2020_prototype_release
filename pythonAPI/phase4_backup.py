import numpy as np
import json
from scipy.ndimage import interpolation as inter
from urllib.request import urlopen
from PIL import Image
from scipy import signal as sg

imagePath = "https://s3.amazonaws.com/omrimageuploads/public/"


def getSubImage(image, x, y, width, height):

    imHeight = image.shape[0]
    imWidth = image.shape[1]

    startX = int(x*imWidth)
    endX = int((x+width)*imWidth)
    startY = int(y*imHeight)
    endY = int((y+height)*imHeight)
    subarray = image[startY:endY, startX:endX]

    return subarray


def suppressStafflines(image):

    image = 255.0-image
    height = image.shape[0]
    width = image.shape[1]
    windowSize = height
    output = np.zeros((height, width))

    for x in range(1, width-1):
        left = image[:, max(0, x-windowSize):x]
        right = image[:, x:min(x+windowSize, width)]
        leftAv = np.mean(left, axis=1)
        rightAv = np.mean(right, axis=1)
        m = np.maximum(leftAv, rightAv)
        output[:, x] = m
    image = image-output
    image[image < 0] = 0

    hist = np.max(image, axis=0)

    # lets blur this
    filter = np.hanning(10)
    hist = sg.convolve(hist, filter, mode="same")

    return {'hist': hist, 'filteredImage': image}


def findPeaks(hist):
    # returns a list of peaks... this might be where points of interest lie
    peaks = []
    window = 7
    av = np.mean(hist)
    for x in range(window, len(hist)-window):
        ok = 1
        middle = hist[x]
        for y in range(1, window):
            left = hist[x-y]
            right = hist[x+y]

            if (middle <= left or middle <= right):
                ok = 0
        if (ok == 1) and (middle > av):
            peaks.append(x/len(hist))
    return peaks


def autocorrelate(imageArea):
    height = imageArea.shape[0]
    width = imageArea.shape[1]
    stepSize = int(height/4)
    autocorr = np.zeros(height)

    for x in range(int(width/stepSize)):
        x1 = x*stepSize
        x2 = (x+1)*stepSize
        area = imageArea[:, x1:x2]

        rowSums = np.sum(area, axis=1)
        freqs = np.fft.rfft(rowSums)
        corr = np.fft.irfft(freqs * np.conj(freqs))
        for y in range(len(corr)):
            autocorr[y] = autocorr[y]+corr[y]

    return autocorr


def findFirstTrough(cors):
    for x in range(len(cors)-1):
        if (cors[x] < cors[x+1]):
            return x
    return len(cors)/10


def findPeak(cors, start, end):
    if (start < 0):
        start = 0
    if (end < 2):
        end = 2
    if (start >= len(cors)-2):
        start = len(cors)-2
    if (end >= len(cors)):
        end = len(cors-1)
    maxVal = cors[start]
    maxPos = start
    for i in range(start, end):
        if (cors[i] > maxVal):
            maxVal = cors[i]
            maxPos = i
    return maxPos


def getLineSpacing(image):
    cors = autocorrelate(image)

    # find first trough
    peaks, _ = sg.find_peaks(cors, height=0)

    # step 1 find the max peak value
    maxValue = 0
    for x in range(len(peaks)):
        height = cors[peaks[x]]
        if (height > maxValue):
            maxValue = height

    threshold = maxValue/2
    count = 0
    if (len(peaks) < 2):
        return (len(cors)/4)

    secondPeak = peaks[1]

    for x in range(len(peaks)):
        height = cors[peaks[x]]
        if (height > threshold):
            count = count + 1
            if (count == 2):
                secondPeak = peaks[x]

    return secondPeak/2


def findLocalPeak(centralLine, lines, offset, searchRadius):
    height = lines.shape[0]
    width = lines.shape[1]
    output = np.zeros(width)
    for x in range(width):
        start = int(centralLine[x]+offset-searchRadius)
        end = int(centralLine[x]+offset+searchRadius)
        if (start < 0):
            start = 0
        if (end >= height):
            end = height-1
        if (end < 2):
            end = 2
        if (start >= height-2):
            start = height-2

        data = lines[start:end, x]
        output[x] = (start+np.argmax(data))/height

    return output


def getStaffLines(image, spacing):

    filterSize = int(spacing*4)
    filter = np.zeros((filterSize+1, filterSize+1))
    for y1 in range(0, 5):
        y = int(y1*spacing)
        for x in range(0, filterSize):
            filter[y][x] = 1.0
    centralLines = sg.convolve2d(image, filter, mode='same')

    # give % of where central line is!
    centralLinePos = np.argmax(centralLines, 0)

    topLine = findLocalPeak(
        centralLinePos, image, -2*spacing, spacing/2)
    bottomLine = findLocalPeak(
        centralLinePos, image, 2*spacing, spacing/2)

    return {
        'top': topLine,
        'bottom': bottomLine
    }


def getPointCoordinates(pointOfInterest, image, centralLine, spacing, loc):
    # step 1, get x coordinate, width and height, in actual x, y pixels
    imHeight = image.shape[0]
    imWidth = image.shape[1]
    spacing = spacing/imHeight

    xp = int(pointOfInterest*imWidth)
    top = (centralLine['top'][xp])
    bottom = (centralLine['bottom'][xp])
    height = bottom-top

    return {
        'x': int(pointOfInterest*1000),
        'y': int((loc['y']+(top)*loc['height'])*1000),
        'height': int((height*loc['height'])*1000)
    }


def arrayTo1000(array):
    segments = 50
    out = []
    segmentLength = float(len(array))/segments

    for x in range(segments):
        start = int((x-1)*segmentLength)
        if (start < 0):
            start = 0
        end = int((x+1)*segmentLength)
        if (end >= len(array)):
            end = len(array)
        chunk = array[start:end]
        median = np.median(chunk)*1000.0
        out.append(int(median))

    return out


def lineFilter(imageArea):
    imageArea = 1.0-(imageArea/255.0)
    height = imageArea.shape[0]
    width = imageArea.shape[1]

    filterHeight = int(height/20)
    if (filterHeight < 1):
        filterHeight = 1

    # filterNeg = np.ones((filterHeight, int(height/2))) * -1
    # filterPos = np.ones((filterHeight, int(height/2)))/2.0
    # fullFilter = np.append(filterPos, filterNeg, axis=0)
    # fullFilter = np.append(fullFilter, filterPos, axis=0)
    filter = np.ones((filterHeight, int(height/2)))

    processedImage = sg.convolve2d(imageArea, filter, mode='same')
    return processedImage


def getPointsOfInterest(image, loc):
    print("getting points of interest ", loc)

    section = getSubImage(
        image, loc['x'], loc['y'], loc['width'], loc['height'])

    out = suppressStafflines(section)

    pointsOfInterest = findPeaks(out['hist'])

    # now, lets also go through the image, apply detector to find staff lines
    newIm = lineFilter(section)
    lineSpacing = getLineSpacing(newIm)
    staffLines = getStaffLines(newIm, lineSpacing)

    pointsInStaff = []
    for p in range(len(pointsOfInterest)):
        pl = getPointCoordinates(
            pointsOfInterest[p], section, staffLines, lineSpacing, loc)
        if (pl != None):
            pointsInStaff.append(pl)

    print("pointsInStaff ", pointsInStaff)

    return {
        'points': pointsInStaff,
        'guides': {
            'top': arrayTo1000(staffLines['top']),
            'bottom': arrayTo1000(staffLines['bottom'])
        }
    }


def main(event, context):
    body = (json.loads(event['body']))
    print("body ...", body)
    url = body['imageUrl']
    staffLocations = body['staffLocations']
    orientation = body['orientation']

    # load and rotate image
    print("opening file ... ", imagePath+url)
    img = Image.open(urlopen(imagePath+url))
    image = img.convert('L')
    original_img = np.array(image)  # converts the jpg into a 2d array
    deskewedImage = inter.rotate(
        original_img, orientation, reshape=False, order=0)

    for s in range(len(staffLocations)):
        staff = staffLocations[s]
        poi = getPointsOfInterest(deskewedImage, staff)
        staff['pointsOfInterest'] = poi['points']
        staff['guides'] = poi['guides']

    body = {
        "pointsOfInterest": staffLocations
    }

    print("body output = ", body)

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
