import json
import os
import base64
import uuid
import boto3
from typing import Dict, Any

ADMIN_EMAIL = "ad.alex1995@yandex.ru"

def verify_admin_token(token: str, email: str) -> bool:
    """Проверка токена администратора"""
    if email.lower() != ADMIN_EMAIL.lower():
        return False
    return bool(token)

def get_s3_client():
    """Получение S3 клиента"""
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Загрузка изображений для wiki предметов
    POST - загрузить изображение (base64)
    Возвращает CDN URL загруженного файла
    """
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Проверка авторизации
    headers = event.get('headers', {})
    token = headers.get('X-Admin-Token') or headers.get('x-admin-token', '')
    email = headers.get('X-Admin-Email') or headers.get('x-admin-email', '')
    
    if not verify_admin_token(token, email):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        base64_data = body_data.get('image', '')
        filename = body_data.get('filename', 'image.png')
        
        if not base64_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No image data provided'}),
                'isBase64Encoded': False
            }
        
        # Удаляем префикс data:image/...;base64, если есть
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        
        # Декодируем base64
        image_data = base64.b64decode(base64_data)
        
        # Генерируем уникальное имя файла
        file_ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'png'
        unique_filename = f"wiki-items/{uuid.uuid4()}.{file_ext}"
        
        # Определяем content type
        content_type_map = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        content_type = content_type_map.get(file_ext.lower(), 'image/png')
        
        # Загружаем в S3
        s3 = get_s3_client()
        s3.put_object(
            Bucket='files',
            Key=unique_filename,
            Body=image_data,
            ContentType=content_type
        )
        
        # Формируем CDN URL
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'url': cdn_url
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'}),
            'isBase64Encoded': False
        }
