import json
from cgi import parse_header, parse_multipart
from io import BytesIO
import boto
from boto.s3.key import Key
import base64
# import boto3

imagePath = "https://s3.amazonaws.com/omrimageuploads/public/"
keyId = "AKIAJWYTYMAQ6GV3LOEA"
sKeyId = "UPJEthV4gEDCc0DfD2jAYywXAUycnpKm5keZVuIN"
encoding = "utf-8"
#encoding = "cp437"


def saveBinaryToS3(filename, data):
    print("binary filename=", filename)
    newFile = open("/tmp/temp.bin", "wb")
    newFile.write(data)
    newFile.close()

    print("saved locally")

    print("getting con")
    conn = boto.connect_s3(keyId, sKeyId)
    bucket = conn.get_bucket('omrimageuploads')

    k = Key(bucket)
    k.key = "public/"+filename
    bucket.delete_key(k)

    k.set_contents_from_filename('/tmp/temp.bin')
    print("image saved")

    # s3 = boto3.resource('s3', region_name='us-east-1', aws_access_key_id=keyId,
    #                    aws_secret_access_key=sKeyId)
    # object = s3.Object('omrimageuploads', "public/"+filename)
    # object.put(Body=data)

    return


def saveTextToS3(filename, data):

    print("getting con")
    print('filename=', filename)
    print('data=', data)
    conn = boto.connect_s3(keyId, sKeyId)
    bucket = conn.get_bucket('omrimageuploads')

    k = Key(bucket)
    k.key = "public/"+filename
    bucket.delete_key(k)

    k.set_contents_from_string(data)
    print("text data saved")

    return


def main(event, context):
    print("calling uploadNetwork")
    print("event keys = ", event.keys())
    print("is base 64 = ", event['isBase64Encoded'])
    # print("event=", event)
    print("headers=", event['headers'])
    c_type, c_data = parse_header(event['headers']['content-type'])
    print("c_data=", c_data)
    assert c_type == 'multipart/form-data'

    print("example data")
    example = event['body'][3500:3539]
    print(example)
    print("values = ", list(example))
    print("example length = ", len(example))
    decoded = bytes(example, encoding)
    print("decoded length = ", len(decoded))
    print("values = ", list(decoded))

    #print("boundary type =", type(c_data['boundary']))
    c_data['boundary'] = bytes(c_data['boundary'], encoding)
    #print("body type = ", type(event['body']))
    #print("boundary type =", type(c_data['boundary']))
    #print("body length =", len(event['body']))
    #body = str.encode(event['body'])
    #body = bytes(event['body'], "utf-8")

    #print("new body type = ", type(body))
    #print("body length 2 = ", len(body))
    # form_data = parse_multipart(
    #    BytesIO(body), c_data)

    print("body type = ", type(event['body']))
    print("boundary type =", type(c_data['boundary']))
    print("body length =", len(event['body']))
    #body = str.encode(event['body'])
    image_64_decode = event['body'].read()

    body = bytes(event['body'], encoding)
    #body = event['body']

    print("new body type = ", type(body))
    print("body length 2 = ", len(body))
    print("new body type3 = ", type(image_64_decode))
    print("body length 3 = ", len(image_64_decode))

    form_data = parse_multipart(
        BytesIO(body), c_data)

    model = form_data["model.json"][0]
    #print("model = ", model)

    saveTextToS3("model_test2.json", model.decode())
    weights = form_data["model.weights.bin"][0]
    print("weights length = ", len(weights))
    saveBinaryToS3("model.weights_test2.bin", weights)
    #saveTextToS3("weights_test.bin", weights.decode())

    response = {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": "uploaded ok"
    }

    print("response = ", response)

    return response


if __name__ == "__main__":
    main('', '')
