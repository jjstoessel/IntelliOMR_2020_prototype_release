import numpy as np
import json
from scipy.ndimage import interpolation as inter
from urllib.request import urlopen
from PIL import Image
from scipy import signal as sg
import matplotlib.pyplot as plt
from IPython import display
import datetime
#import cv2 as cv

imagePath = "https://s3.amazonaws.com/omrimageuploads/public/"
debug = 1

def printTimestamp(pointName):
    ts = datetime.datetime.now().timestamp()
    print(pointName, ts)

def arrayToImage(I):
    I=I+0.0 # convert to double
    mx = np.amax(I)
    mn = np.amin(I)
    dx = mx-mn
    n = 255.0*(I-mn)/dx
    
    #if (debug):
        #print("array to image",n)
        #print("array to image mx=",mx," mn=",mn)
    n = n.astype(np.uint8)    
    return Image.fromarray(n, mode='L')

def myimshow(I):
    I=I+0.0
    mx = np.amax(I)
    mn = np.amin(I)
    dx = mx-mn
    n = 255*(I-mn)/dx
    n = n.astype(np.uint8)    
    fig = plt.figure(figsize=(20,8))
    ax3 = fig.add_subplot(111)    
    ax3.imshow(n, cmap='gray', vmin=0, vmax=255)
    #if (debug):
    #    print("showing image mx=",mx," mn=",mn)
    plt.show()
    
    

def getSubImage(image, x, y, width, height):

    imHeight = image.shape[0]
    imWidth = image.shape[1]

    startX = int(x*imWidth)
    endX = int((x+width)*imWidth)
    startY = int(y*imHeight)
    endY = int((y+height)*imHeight)
    subarray = image[startY:endY, startX:endX]

    return subarray

def findPeaks(hist):
    # returns a list of peaks... this might be where points of interest lie
    peaks = []
    window = 3
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
    
    flattened = imageArea.flatten('F') #'F'
    freqs = np.fft.rfft(flattened)
    corr = np.fft.irfft(freqs * np.conj(freqs))
    #corr = np.convolve(flattened,flattened[::-1])
    #print("autocorr = ",corr)
    #height = round(imageArea.shape[0]/2)   
    #corr=corr[flattened.size:]
    #print("corr = ",corr)
    #print("size = ",flattened.size)
    
    
    
    height = round(imageArea.shape[0]/2)    
    return corr[:height]

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
    if (debug):
        print("GETTING LINE SPACING")
        myimshow(0.0+image)
           
        
    cors = autocorrelate(image)
    
    if (debug):
      fig = plt.figure(figsize=(20,8))
      ax3 = fig.add_subplot(111)    
      ax3.plot(cors)
      plt.show()   
        
    searchRadius = 3
    bestPos = 10
    bestVal = 0
    
    for x in range(searchRadius,len(cors)-searchRadius):
        peak = 1
        currentVal = cors[x]
        for y in range(1,searchRadius+1):
            left = cors[x-y]
            right = cors[x+y]
            if (left>currentVal) or (right>currentVal):
                peak = 0
        if (peak==1):
            if (currentVal>bestVal):
                bestVal = currentVal
                bestPos = x
    if (debug):
        print("LINE SPACING=")
        print(bestPos)             
    return bestPos            
        

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


def maxPool(image):
    im3 = np.zeros((5,image.shape[0],image.shape[1]));
    im3[0,:,:] = np.roll(image,-2,0)
    im3[1,:,:] = np.roll(image,-1,0)
    im3[2,:,:] = image
    im3[3,:,:] = np.roll(image,1,0)
    im3[4,:,:] = np.roll(image,2,0)
    return np.max(im3,0)

def getStaffLines(image):
    image = lineFilter(image) # highlight where lines exist
    if (debug):
        myimshow(image)
        
    topLine = topLineFilter(image)
    bottomLine = bottomLineFilter(image)
    if (debug):
        myimshow(topLine)
        myimshow(bottomLine)
        
    topLineInContext = image+topLine+0.5*np.roll(maxPool(bottomLine),-40,0)
    bottomLineInContext = image+bottomLine+0.5*np.roll(maxPool(topLine),40,0)
        
    if (debug):
        print("top line in context = ")
        myimshow(topLineInContext)
        print("bottom line in context = ")
        myimshow(bottomLineInContext)
    
    height = image.shape[0]
    scale = 1.5/height
    topLine = (np.argmax(topLineInContext,axis=0)-height/6)*scale
    bottomLine = (np.argmax(bottomLineInContext,axis=0)-height/6)*scale
    if (debug):
        print('height = ',image.shape[0])
        print("top line = ",topLine)
        print("bottom line = ",bottomLine)

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
    # blurs the image horizontally, highlighting points where there are horizontal lines
    imageArea = 1.0-(imageArea/255.0)
    height = imageArea.shape[0]
    width = imageArea.shape[1]
    
    filter = np.array([[0,0,0.5,0.8,1,0.8,0.5,0,0]])
    filter = filter-np.mean(filter)
    filter = filter.transpose();
    imageArea = sg.convolve2d(imageArea, filter, mode='same') # filter for edges
    imageArea = imageArea.clip(min=0)
    if (debug):
        myimshow(imageArea)
    

    filterHeight = 3
    filterWidth = 80

    filter = np.ones((filterHeight, filterWidth))

    processedImage = sg.convolve2d(imageArea, filter, mode='same')
    return processedImage

def topLineFilter(imageArea):
    filter = np.array([[0,0.5,0.8,1,0.8,0.5,0,0,0,0,0,0.5,0.8,1,0.8,0.5,0,0,0,0,-0.5,-0.8,-1,-1,-1,-0.8,-0.5]])
    filter = filter-np.mean(filter)
    filter = filter.transpose();
    processedImage = sg.convolve2d(imageArea, filter, mode='same')
    processedImage = processedImage.clip(min=0)
    return processedImage

def bottomLineFilter(imageArea):
    filter = np.array([[-0.5,-0.8,-1,-1,-1,-0.8,-0.5,0,0,0,0,0.5,0.8,1,0.8,0.5,0,0,0,0,0,0.5,0.8,1,0.8,0.5,0]])
    filter = filter-np.mean(filter)
    filter = filter.transpose();
    processedImage = sg.convolve2d(imageArea, filter, mode='same')
    processedImage = processedImage.clip(min=0)
    return processedImage

def resizeImage(image,scale):
    image = image.convert('L')
    #if (debug):
    #    print("RESIZING IMAGE")
    #    print("Original Image:")
    #    myimshow(np.array(image))
        
    newWidth = round(image.size[0]*scale)
    newHeight = round(image.size[1]*scale)
    
    img = image.resize((newWidth,newHeight), Image.ANTIALIAS)
    img = img.convert('L')
    #if (debug):
    #    print("New Image:")
    #    myimshow(np.array(img))
    
    
    if (debug):       
        print("old width :",image.size[0])
        print("new width :",img.size[0])
    return img

def findPointsOfInterest(image):
    image = 255.0-image
    myimshow(image)

    # filter 1 .... lets detect vertical lines
    
    filter = [[-1,-1,1,1,1,1,-1,-1]]
    image2 = sg.convolve2d(image,filter,mode="same")
    image2 = image2.clip(min=0)
    myimshow(image2)
    hist1 = np.sum(image2, axis=0)

    # lets blur this
    filter = np.hanning(3)
    hist = sg.convolve(hist1, filter, mode="same")
    if (debug):
      fig = plt.figure(figsize=(20,8))
      ax3 = fig.add_subplot(111)    
      ax3.plot(hist)
      plt.show()        

    #return {'hist': hist, 'filteredImage': image}  
    
    # filter 2 ... lets detect dots
    filter = [[0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,1,1,0,0,0,0],
              [0,0,0,1,1,1,1,0,0,0],
              [0,0,1,1,1,1,1,1,0,0],
              [0,0,1,1,1,1,1,1,0,0],
              [0,0,0,1,1,1,1,0,0,0],
              [0,0,0,0,1,1,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0]]
    filter = filter - np.mean(filter)
    image3 = sg.convolve2d(image,filter,mode="same")
    image3 = image3.clip(min=0)
    myimshow(image3)
    hist2 = np.max(image3, axis=0)
    
    # lets blur this
    filter = np.hanning(3)
    hist = sg.convolve(hist2, filter, mode="same")
    if (debug):
      fig = plt.figure(figsize=(20,8))
      ax3 = fig.add_subplot(111)    
      ax3.plot(hist)
      plt.show()   
    
    # filter 4 .... lets detect larger objects
    filter = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
              [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
              [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
              [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
              [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
              [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
              [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
              [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
              [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
              [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
    filter = filter - np.mean(filter)
    image4 = sg.convolve2d(image,filter,mode="same")
    image4 = image4.clip(min=0)
    myimshow(image4)
    hist3 = np.max(image4, axis=0)
       
    # lets blur this
    filter = np.hanning(3)
    hist = sg.convolve(hist3, filter, mode="same")
    if (debug):
      fig = plt.figure(figsize=(20,8))
      ax3 = fig.add_subplot(111)    
      ax3.plot(hist)
      plt.show()    
        
    
    filter = np.hanning(3)
    histFinal = sg.convolve(hist1+hist2+hist3,filter,mode="same")
    if (debug):
      print("final histogram")
      fig = plt.figure(figsize=(20,8))
      ax3 = fig.add_subplot(111)    
      ax3.plot(histFinal)
      plt.show() 
    
    return findPeaks(histFinal)

def drawPointsOfInterest(image,points):
    imHeight = image.shape[0]
    imWidth = image.shape[1]
    
    for p in range(len(points)):
        x = int(points[p]*imWidth)
        for y in range(0,imHeight-1):
            image[y][x] = 0
    myimshow(image)
        

def getPointsOfInterest(image, loc):
    if (debug):
        print("getting points of interest ", loc)
    
    # step 1, calculate the line spacing, and resize the image
    x = loc['x']
    y = loc['y']
    width = loc['width']
    height = loc['height']
    y=y-height/4
    height=height+height/2
    if (y<0):
        y=0
    if (y+height>1):
        y=1-height

    section = getSubImage(
        image, x,y,width,height)
    
    lineSpacing = getLineSpacing(section)    
    image2 = resizeImage(arrayToImage(image),10.0/lineSpacing)
    image2 = np.array(image2)
    myimshow(image2)
    
    #step 2, get the section, using this new image
    section = getSubImage(
        image2, x,y,width,height)

    

    #out = suppressStafflines(section)
    pointsOfInterest = findPointsOfInterest(section)
    
    if (debug):
        drawPointsOfInterest(section,pointsOfInterest)

    #pointsOfInterest = findPeaks(out['hist'])
    #pointsOfInterest = findPeaks(section)

    #lineSpacing = getLineSpacing(newIm)
    staffLines = getStaffLines(section)

    pointsInStaff = []
    for p in range(len(pointsOfInterest)):
        pl = getPointCoordinates(
            pointsOfInterest[p], section, staffLines, lineSpacing, loc)
        if (pl != None):
            pointsInStaff.append(pl)

    poi={
        'points': pointsInStaff,
        'guides': {
            'top': arrayTo1000(staffLines['top']),
            'bottom': arrayTo1000(staffLines['bottom'])
        }
    }
            
    if (debug):
        print("poi=",poi)
        
    return poi


    

def main(event, content):
    body = (json.loads(event['body']))
    print("body ...", body)
    url = body['imageUrl']
    staffLocations = body['staffLocations']
    orientation = body['orientation']
    firstItem = body['firstItem']

    # load and rotate image
    print("opening file ... ", imagePath+url)
    img = Image.open(urlopen(imagePath+url))
    image = img.convert('L')
    original_img = np.array(image)  # converts the jpg into a 2d array
    deskewedImage = inter.rotate(
        original_img, orientation, reshape=False, order=0)
    
    startTime = datetime.datetime.now().timestamp() # we want only to go for 10 seconds max
    lastItem = -1

    for s in range(len(staffLocations)):
        if (s<firstItem):
            continue
        now = datetime.datetime.now().timestamp()
        if ((now-startTime)>10.0):
            lastItem = s
            break
        staff = staffLocations[s]
        poi = getPointsOfInterest(deskewedImage, staff)
        staff['pointsOfInterest'] = poi['points']
        staff['guides'] = poi['guides']
        
    body = {
        "pointsOfInterest": staffLocations,
        "lastItem": lastItem
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
