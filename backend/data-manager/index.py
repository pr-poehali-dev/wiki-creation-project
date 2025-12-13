import json
import os
import boto3
from typing import Dict, Any

ITEMS_FILE_KEY = "wiki/items.json"
GUIDES_FILE_KEY = "wiki/guides.json"
USERS_FILE_KEY = "admin/users.json"

def get_users_data() -> Dict:
    """Загрузка данных пользователей из S3 для проверки"""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket='files', Key=USERS_FILE_KEY)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data
    except:
        return {"users": []}

def verify_admin_token(token: str, email: str) -> bool:
    """Проверка токена администратора через список пользователей"""
    if not token or not email:
        return False
    
    users_data = get_users_data()
    for user in users_data.get('users', []):
        if user.get('email', '').lower() == email.lower():
            return True
    return False

def get_s3_client():
    """Получение S3 клиента"""
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def load_from_s3(file_key: str, default_data: Dict) -> Dict:
    """Загрузка данных из S3"""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket='files', Key=file_key)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data
    except:
        try:
            save_to_s3(file_key, default_data)
        except:
            pass
        return default_data

def save_to_s3(file_key: str, data: Dict) -> None:
    """Сохранение данных в S3"""
    s3 = get_s3_client()
    s3.put_object(
        Bucket='files',
        Key=file_key,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'),
        ContentType='application/json'
    )

def validate_items_data(data: Dict) -> bool:
    """Валидация данных предметов"""
    if 'предметы' not in data:
        return False
    items = data['предметы']
    if not isinstance(items, list):
        return False
    for item in items:
        if not isinstance(item, dict):
            return False
        required_fields = ['id', 'name', 'description', 'tags']
        for field in required_fields:
            if field not in item:
                return False
    return True

def validate_guides_data(data: Dict) -> bool:
    """Валидация данных гайдов"""
    required_keys = ['categories', 'difficulty', 'guides', 'pageSettings']
    for key in required_keys:
        if key not in data:
            return False
    if not isinstance(data['guides'], list):
        return False
    return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление данными в S3
    GET ?type=items|guides - получить данные
    POST ?type=items|guides - обновить данные
    """
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    data_type = query_params.get('type', 'items')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Определяем файл и default данные
    if data_type == 'items':
        file_key = ITEMS_FILE_KEY
        default_data = {"предметы": []}
    elif data_type == 'guides':
        file_key = GUIDES_FILE_KEY
        default_data = {
            "categories": [],
            "difficulty": [
                {"id": "easy", "name": "Легко", "color": "#22c55e"},
                {"id": "medium", "name": "Средне", "color": "#eab308"},
                {"id": "hard", "name": "Сложно", "color": "#ef4444"}
            ],
            "guides": [],
            "pageSettings": {
                "title": "Гайды DevilRust",
                "subtitle": "Подробные пошаговые руководства по игре на сервере"
            }
        }
    else:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    # GET - публичный доступ для чтения
    if method == 'GET':
        data = load_from_s3(file_key, default_data)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    # POST - требуется авторизация для записи
    if method == 'POST':
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
        
        body_data = json.loads(event.get('body', '{}'))
        
        # Валидация данных
        if data_type == 'items':
            if not validate_items_data(body_data):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid items data structure'}),
                    'isBase64Encoded': False
                }
        elif data_type == 'guides':
            if not validate_guides_data(body_data):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid guides data structure'}),
                    'isBase64Encoded': False
                }
        
        # Сохраняем данные в S3
        try:
            save_to_s3(file_key, body_data)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }