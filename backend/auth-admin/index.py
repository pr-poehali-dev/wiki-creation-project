import json
import os
import hashlib
from typing import Dict, Any

ADMIN_EMAIL = "ad.alex1995@yandex.ru"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Авторизация администратора wiki
    Проверяет email и пароль, возвращает токен доступа
    """
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    body_data = json.loads(event.get('body', '{}'))
    email = body_data.get('email', '').strip().lower()
    password = body_data.get('password', '')
    
    # Проверка email
    if email != ADMIN_EMAIL.lower():
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }
    
    # Получаем пароль из секретов
    stored_password = os.environ.get('ADMIN_PASSWORD_HASH', '')
    
    # Проверяем пароль (простая проверка для удобства)
    if stored_password and password != stored_password:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid password'}),
            'isBase64Encoded': False
        }
    
    # Генерируем токен доступа
    token = hashlib.sha256(f"{email}:{password}".encode()).hexdigest()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'token': token,
            'email': email
        }),
        'isBase64Encoded': False
    }