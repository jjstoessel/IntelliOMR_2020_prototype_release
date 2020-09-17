import json
from cgi import parse_header, parse_multipart
from io import BytesIO
import boto
from boto.s3.key import Key
#import boto3

imagePath = "https://s3.amazonaws.com/omrimageuploads/public/"
keyId = "AKIAJWYTYMAQ6GV3LOEA"
sKeyId = "UPJEthV4gEDCc0DfD2jAYywXAUycnpKm5keZVuIN"


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
    symbols = (json.loads(event['body']))['symbols']
    saveTextToS3("omr_symbols.json", symbols)

    body = {
        "symbols": symbols
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
