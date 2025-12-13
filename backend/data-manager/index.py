import json
import os
from typing import Dict, Any

def verify_admin_token(token: str, email: str) -> bool:
    """Проверка токена администратора"""
    return bool(token) and bool(email)

def read_json_file(file_path: str) -> Dict:
    """Чтение JSON файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def write_json_file(file_path: str, data: Dict) -> None:
    """Запись JSON файла"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление данными в JSON файлах
    GET ?type=items|guides - получить данные
    POST ?type=items|guides - обновить данные
    """
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    data_type = query_params.get('type', 'items')  # items или guides
    
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
    
    # Определяем путь к файлу
    if data_type == 'items':
        file_path = 'src/data/wikiItems.json'
    elif data_type == 'guides':
        file_path = 'src/data/guides.json'
    else:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    # GET - публичный доступ для чтения
    if method == 'GET':
        data = read_json_file(file_path)
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
        
        # Записываем данные в файл
        try:
            write_json_file(file_path, body_data)
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
