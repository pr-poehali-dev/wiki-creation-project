import json
import os
import hashlib
import boto3
import base64
import uuid
from typing import Dict, Any, List

ADMIN_EMAIL = "ad.alex1995@yandex.ru"
GUIDES_FILE_KEY = "wiki/guides.json"

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

def load_guides_data() -> Dict:
    """Загрузка полных данных гайдов из S3"""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket='files', Key=GUIDES_FILE_KEY)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data
    except:
        # Если файла нет, создаём структуру по умолчанию
        default_data = {
            "categories": [],
            "difficulty": [
                {"id": "easy", "name": "Легко", "color": "#22c55e"},
                {"id": "medium", "name": "Средне", "color": "#eab308"},
                {"id": "hard", "name": "Сложно", "color": "#ef4444"}
            ],
            "guides": []
        }
        try:
            save_guides_data(default_data)
        except:
            pass
        return default_data

def save_guides_data(data: Dict) -> None:
    """Сохранение данных гайдов в S3"""
    s3 = get_s3_client()
    s3.put_object(
        Bucket='files',
        Key=GUIDES_FILE_KEY,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'),
        ContentType='application/json'
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление гайдами и загрузка изображений
    GET - получить все гайды и категории
    POST - создать гайд или загрузить изображение (action=upload)
    PUT - обновить гайд
    DELETE - удалить гайд
    """
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # GET - публичный доступ для чтения
    if method == 'GET':
        data = load_guides_data()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    # Для изменений требуется авторизация
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
    
    data = load_guides_data()
    guides = data.get('guides', [])
    body_data = json.loads(event.get('body', '{}'))
    
    if method == 'POST':
        # Если action=upload, загружаем изображение
        if action == 'upload':
            base64_data = body_data.get('image', '')
            filename = body_data.get('filename', 'image.png')
            folder = body_data.get('folder', 'guides')
            
            if not base64_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No image data provided'}),
                    'isBase64Encoded': False
                }
            
            # Убираем префикс data:image/...;base64,
            if ',' in base64_data:
                base64_data = base64_data.split(',', 1)[1]
            
            image_data = base64.b64decode(base64_data)
            file_ext = filename.split('.')[-1].lower()
            if file_ext not in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                file_ext = 'png'
            
            content_type_map = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'webp': 'image/webp'
            }
            content_type = content_type_map.get(file_ext, 'image/png')
            unique_filename = f"{folder}/{uuid.uuid4()}.{file_ext}"
            
            s3 = get_s3_client()
            s3.put_object(
                Bucket='files',
                Key=unique_filename,
                Body=image_data,
                ContentType=content_type
            )
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'url': cdn_url, 'filename': unique_filename}),
                'isBase64Encoded': False
            }
        
        # Создание нового гайда
        new_guide = body_data.get('guide', {})
        
        # Генерируем новый ID
        max_id = max([int(g['id']) for g in guides if g.get('id', '').isdigit()], default=0)
        new_guide['id'] = str(max_id + 1)
        new_guide['views'] = new_guide.get('views', 0)
        new_guide['rating'] = new_guide.get('rating', 0)
        
        guides.append(new_guide)
        data['guides'] = guides
        save_guides_data(data)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'guide': new_guide}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        # Обновление гайда
        guide_id = body_data.get('id')
        updated_guide = body_data.get('guide', {})
        
        for i, guide in enumerate(guides):
            if guide['id'] == guide_id:
                guides[i] = {**guide, **updated_guide, 'id': guide_id}
                data['guides'] = guides
                save_guides_data(data)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'guide': guides[i]}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Guide not found'}),
            'isBase64Encoded': False
        }
    
    elif method == 'DELETE':
        # Удаление гайда
        guide_id = body_data.get('id')
        
        guides = [g for g in guides if g['id'] != guide_id]
        data['guides'] = guides
        save_guides_data(data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }