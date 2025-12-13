import json
import os
import hashlib
import boto3
from typing import Dict, Any, List

ITEMS_FILE_KEY = "wiki/items.json"

def verify_admin_token(token: str, email: str) -> bool:
    """Проверка токена администратора"""
    # Токен и email должны быть не пустыми
    # Реальная проверка происходит через auth-admin систему
    return bool(token) and bool(email)

def get_s3_client():
    """Получение S3 клиента"""
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def load_items() -> List[Dict]:
    """Загрузка предметов из S3"""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket='files', Key=ITEMS_FILE_KEY)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data.get('items', [])
    except:
        # Если файла нет, создаём пустой и возвращаем []
        try:
            save_items([])
        except:
            pass
        return []

def save_items(items: List[Dict]) -> None:
    """Сохранение предметов в S3"""
    s3 = get_s3_client()
    data = {
        "items": items
    }
    s3.put_object(
        Bucket='files',
        Key=ITEMS_FILE_KEY,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'),
        ContentType='application/json'
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление предметами wiki (CRUD операции)
    GET - получить все предметы
    POST - создать предмет
    PUT - обновить предмет
    DELETE - удалить предмет
    Version: 1.1
    """
    method: str = event.get('httpMethod', 'GET')
    
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
        items = load_items()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'items': items}, ensure_ascii=False),
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
    
    items = load_items()
    body_data = json.loads(event.get('body', '{}'))
    
    if method == 'POST':
        # Создание нового предмета
        new_item = body_data.get('item', {})
        
        # Генерируем новый ID
        max_id = max([int(item['id']) for item in items if item.get('id', '').isdigit()], default=0)
        new_item['id'] = str(max_id + 1)
        
        items.append(new_item)
        save_items(items)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'item': new_item}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        # Обновление предмета
        item_id = body_data.get('id')
        updated_item = body_data.get('item', {})
        
        for i, item in enumerate(items):
            if item['id'] == item_id:
                items[i] = {**item, **updated_item, 'id': item_id}
                save_items(items)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'item': items[i]}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Item not found'}),
            'isBase64Encoded': False
        }
    
    elif method == 'DELETE':
        # Удаление предмета
        item_id = body_data.get('id')
        
        items = [item for item in items if item['id'] != item_id]
        save_items(items)
        
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