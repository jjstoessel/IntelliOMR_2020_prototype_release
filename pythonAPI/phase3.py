import json
import numpy as np
from scipy.ndimage import interpolation as inter
from scipy import signal as sg
from PIL import Image
from urllib.request import urlopen
from io import StringIO
import math
import copy

import base64
from io import BytesIO

import sys
import boto
from boto.s3.key import Key

imagePath = "https://s3.amazonaws.com/omrimageuploads/public/"
keyId = "AKIAJWYTYMAQ6GV3LOEA"
sKeyId = "UPJEthV4gEDCc0DfD2jAYywXAUycnpKm5keZVuIN"


def getSubImage(image, startX, endX, startY, endY):
    (height, width) = image.shape
    startX = int(round(startX*width))
    endX = int(round(endX*width))
    startY = int(round(startY*height))
    endY = int(round(endY*height))

    print(height, width)
    subarray = image[startY:endY, startX:endX]
    img = Image.fromarray((subarray).astype("uint8")).convert("RGB")
    return img


def find_score(arr, angle):
    data = inter.rotate(arr, angle, reshape=False, order=0)
    hist = np.sum(data, axis=1)
    score = np.sum((hist[1:] - hist[:-1]) ** 2)
    return hist, score


def deskewImage(image):
    original_img = image.convert('L')
    original_img = np.array(original_img)  # converts the jpg into a 2d array
    bin_img = 1-(original_img/255.0)  # creates a negative image

    # itereate through various angles to find the maximum fit
    delta = 1
    limit = 10
    angles = np.arange(-limit, limit+delta, delta)
    scores = []
    for angle in angles:
        hist, score = find_score(bin_img, angle)
        scores.append(score)

    best_score = max(scores)
    best_angle = angles[scores.index(best_score)]

    # correct skew
    data = inter.rotate(original_img, best_angle, reshape=True, order=0)
    img = Image.fromarray((data).astype("uint8")).convert("RGB")
    return [img, np.asscalar(best_angle)]


def saveImageToS3(image, filename):
    print("filename=", filename)
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    image.save("/tmp/temp.png")

    print("saved locally")

    img_str = base64.b64encode(buffered.getvalue())
    # print(img_str)

    print("getting con")
    conn = boto.connect_s3(keyId, sKeyId)
    bucket = conn.get_bucket('omrimageuploads')

    k = Key(bucket)
    k.key = "public/"+filename

    k.set_contents_from_filename('/tmp/temp.png')
    print("image saved")

    return


def horizontalEdgeDetection(image):
    edgeDetector = [[-1, -1, -1, -1, -1],
                    [-1, -1, -1, -1, -1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]]
    img = np.array(image.convert('L'))  # converts the jpg into a 2d array
    filteredImage = sg.convolve2d(img, edgeDetector, mode='same')
    filteredImage[filteredImage < 0] = 0
    return filteredImage


def autocorrelate(filteredImage):
    # the filtered image highlights the staff lines
    # we project these values onto the y axis
    # and then 

    width = int(np.floor(filteredImage.shape[1]/10))
    avgAutocorr = [0]
    for x in range(0, 10):
        slice = filteredImage[:, width*x:(width*(x+1))]
        # project the row onto the y axis
        rowSums = np.sum(slice, axis=1)
        freqs = np.fft.rfft(rowSums)
        autocorr = np.fft.irfft(freqs * np.conj(freqs))
        if (x == 0):
            avgAutocorr = autocorr
        else:
            avgAutocorr += autocorr

        avgAutocorr = avgAutocorr[1:100]
        return avgAutocorr


def findNextPeak(start, array):
    threshVal = 2

    thresh = array[start]/threshVal
    print("thresh=", thresh)

    searchWidth = 3
    if (start > 0):
        searchWidth = math.floor(start/3)
    startPos = start+searchWidth
    endPos = len(array)-(searchWidth+1)

    for x in range(startPos, endPos):
        # print("x=",x)
        ok = 1
        val = array[x]
        for y in range(-searchWidth, searchWidth):
            if (array[y+x] > val):
                ok = 0
        hp = start+math.floor((x-start)/2)
        midpoint = array[hp]

        if (ok and val > thresh):
            print("x=", x, "val=", val, " tresh=", thresh,
                  " midpoint", midpoint, " val/t", (val/1.5))
            if (midpoint < (val/1.5)):
                return x
            else:
                print("mid =", midpoint, "val=", val)
    print("failed...")
    return -1


def filterForStaffs(scaledImage):
    edgeDetector = [[-1, -1, -1, -1, -1],
                    [-1, -1, -1, -1, -1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]]
    # converts the jpg into a 2d array
    img = np.array(scaledImage.convert('L'))
    filteredImage = sg.convolve2d(img, edgeDetector, mode='same')
    filteredImage[filteredImage < 0] = 0

    rowSums = np.sum(filteredImage, axis=1)

    output = np.zeros(len(rowSums))
    for x in range(0, len(rowSums)):
        start = max(x-10, 0)
        end = min(x+10, len(rowSums))
        pool = rowSums[start:end]

        output[x] = max(pool)

    output2 = np.zeros(len(rowSums))
    for x in range(0, len(rowSums)):
        start = max(x-40, 0)
        end = min(x+40, len(rowSums))
        pool = output[start:end]
        output2[x] = min(pool)

    left = np.ones(20)*-2.5
    middle = np.ones(100)
    right = np.ones(20)*-2.5
    filter = np.concatenate((left, middle, right))
    staffs = np.convolve(rowSums, filter, mode='same')
    staffCentroids = staffs * output2

    return staffCentroids


def findAllPeaks(array, height, localSearch=3):
    results = []
    thresh = max(array)/8

    for x in range(localSearch, len(array)-(localSearch+2)):
        ok = 1
        val = array[x]
        for y in range(-localSearch, localSearch+1):
            if (array[y+x] > val):
                ok = 0
        if (ok and val > thresh):
            results.append({"x": 0, "width": 1.0, "y": (
                x-60)/height, "height": 120/height})
    return results


def getStaffLocations(pageImage):
    # find the best rotation for the image
    image, rotation = deskewImage(pageImage)


    filteredImage = horizontalEdgeDetection(image)
    avgAutocorr = autocorrelate(filteredImage)
    peak1 = findNextPeak(0, avgAutocorr)
    if (peak1 == -1):
        return
    peak2 = findNextPeak(peak1, avgAutocorr)
    print("peak 1 at %s" % str(peak1))
    print("peak 2 at %s" % str(peak2))
    if (peak2 == -1):
        return

    # scale image so that staff height is 100
    img = image
    scale = 100/(peak2*2.5)
    vsize = int((float(img.size[0])*scale))
    hsize = int((float(img.size[1])*float(scale)))
    scaledImage = img.resize((vsize, hsize), Image.ANTIALIAS)

    staffCentroids = filterForStaffs(scaledImage)
    staffLocations = findAllPeaks(staffCentroids, hsize, 60)
    print("staff locations ", staffLocations)

    return {
        'orientation': rotation,
        'staffLocations': staffLocations
    }


def rotateAndSavePages(url, tag, pageBoundaries, orientation):
    # this function takes the original image
    # rotates it, and saves the section images to s3

    img = Image.open(urlopen(imagePath+url))
    image = img.convert('L')
    original_img = np.array(image)  # converts the jpg into a 2d array
    deskewedImage = inter.rotate(
        original_img, orientation, reshape=False, order=0)

    # lets iterate through the pageBoundaries
    # and grab the section
    # and save to s3
    pages = []
    for i in range(len(pageBoundaries)):
        region = pageBoundaries[i]
        print(region)
        print(region['x']+region['width'])
        subImage = getSubImage(deskewedImage,
                               region['x'],
                               region['x']+region['width'],
                               region['y'],
                               region['y']+region['height']
                               )

        # now lets save to s3
        filename = "page_"+str(i)+"_"+tag+"_"+url
        print("filename", filename)
        saveImageToS3(subImage, filename)

        # now lets find the staff locations
        locs = getStaffLocations(subImage)
        if locs:
            locs['url'] = filename
            print("page ", locs)
            pages.append(locs)
    print("pages ", pages)
    return pages


def main(event, context):
    body = (json.loads(event['body']))
    orientation = body['orientation']
    pageBoundaries = json.loads(body['pageBoundaries'])
    largeUrl = body['image']
    pages = []
    print("largeUrl ", largeUrl)
    print("pageBoundaries ", pageBoundaries)

    if len(pageBoundaries) > 0:
        pages = rotateAndSavePages(
            largeUrl, "large", pageBoundaries, orientation)

    body = {
        "pages": pages
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
