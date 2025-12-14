import json
import os
import boto3

def init_s3_data():
    """Инициализация дефолтных данных в S3"""
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    default_items = {
        "предметы": [
            {
                "id": "1",
                "name": "Камень",
                "image": "https://cdn.poehali.dev/projects/example/bucket/wiki/stone.png",
                "description": "Базовый ресурс для крафта",
                "tags": ["Ресурс", "База"],
                "isDonateItem": False
            }
        ]
    }
    
    try:
        s3.get_object(Bucket='files', Key='wiki/items.json')
        print('Items data already exists in S3')
    except:
        s3.put_object(
            Bucket='files',
            Key='wiki/items.json',
            Body=json.dumps(default_items, ensure_ascii=False, indent=2).encode('utf-8'),
            ContentType='application/json'
        )
        print('Initialized items data in S3')

if __name__ == '__main__':
    init_s3_data()
