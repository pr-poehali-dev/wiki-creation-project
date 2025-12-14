import json
import os
from typing import Dict, Any

ITEMS_FILE_PATH = "../../src/data/wikiItems.json"
GUIDES_FILE_PATH = "../../src/data/guides.json"

def load_default_items() -> Dict:
    """Загрузка дефолтных предметов из файла"""
    try:
        file_path = os.path.join(os.path.dirname(__file__), ITEMS_FILE_PATH)
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"предметы": []}

def load_default_guides() -> Dict:
    """Загрузка дефолтных гайдов из файла"""
    try:
        file_path = os.path.join(os.path.dirname(__file__), GUIDES_FILE_PATH)
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {
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

def verify_admin_token(token: str, email: str) -> bool:
    """Проверка токена администратора"""
    return bool(token) and bool(email)

def save_to_file(file_path: str, data: Dict) -> None:
    """Сохранение данных в файл проекта"""
    abs_file_path = os.path.join(os.path.dirname(__file__), file_path)
    
    with open(abs_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление данными в файлах проекта
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
    
    if data_type == 'items':
        file_path = ITEMS_FILE_PATH
        default_data = load_default_items()
    elif data_type == 'guides':
        file_path = GUIDES_FILE_PATH
        default_data = load_default_guides()
    else:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid type'}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        try:
            abs_file_path = os.path.join(os.path.dirname(__file__), file_path)
            with open(abs_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            data = default_data
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
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
        
        try:
            save_to_file(file_path, body_data)
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