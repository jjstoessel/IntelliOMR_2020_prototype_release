import json
import numpy as np
from scipy.ndimage import interpolation as inter
from PIL import Image
from urllib.request import urlopen
from io import StringIO


def find_score(arr, angle):
    data = inter.rotate(arr, angle, reshape=False, order=0)
    hist = np.sum(data, axis=1)
    score = np.sum((hist[1:] - hist[:-1]) ** 2)
    return hist, score


def deskewImage(url):
    img = Image.open(urlopen(url))
    original_img = img.convert('L')
    original_img = np.array(original_img)  # converts the jpg into a 2d array
    bin_img = 1-(original_img/255.0)  # creates a negative image

    # itereate through various angles to find the maximum fit
    delta = 1
    limit = 15
    angles = np.arange(-limit, limit+delta, delta)
    scores = []
    for angle in angles:
        hist, score = find_score(bin_img, angle)
        scores.append(score)

    best_score = max(scores)
    best_angle = angles[scores.index(best_score)]

    return np.asscalar(best_angle)


def main(event, context):
    fileName = (json.loads(event['body']))['image']
    print("filename = ", fileName)
    bestAngle = deskewImage(fileName)
    #bestAngle = 3

    body = {
        "filename": fileName,
        "bestAngle": bestAngle
    }

    print(body)

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
