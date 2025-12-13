import json
import os
import hashlib
import boto3
import time
from typing import Dict, Any, List, Optional

SUPER_ADMIN_EMAIL = "ad.alex1995@yandex.ru"
USERS_FILE_KEY = "admin/users.json"

def get_s3_client():
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def load_users_data() -> Dict:
    """Загрузка данных пользователей из S3"""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket='files', Key=USERS_FILE_KEY)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data
    except:
        default_data = {
            "users": [
                {
                    "email": SUPER_ADMIN_EMAIL,
                    "nickname": "Admin",
                    "password_hash": "",
                    "role": "super_admin",
                    "created_at": int(time.time()),
                    "expires_at": None
                }
            ]
        }
        try:
            save_users_data(default_data)
        except:
            pass
        return default_data

def save_users_data(data: Dict) -> None:
    """Сохранение данных пользователей в S3"""
    s3 = get_s3_client()
    s3.put_object(
        Bucket='files',
        Key=USERS_FILE_KEY,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'),
        ContentType='application/json'
    )

def find_user_by_email(email: str, users_data: Dict) -> Optional[Dict]:
    """Поиск пользователя по email"""
    for user in users_data.get('users', []):
        if user['email'].lower() == email.lower():
            return user
    return None

def is_super_admin(email: str) -> bool:
    """Проверка является ли пользователь супер-админом"""
    return email.lower() == SUPER_ADMIN_EMAIL.lower()

def verify_password(password: str, stored_hash: str) -> bool:
    """Проверка пароля"""
    if not stored_hash:
        return True
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return password_hash == stored_hash

def check_user_access(user: Dict) -> tuple[bool, str]:
    """Проверка доступа пользователя"""
    expires_at = user.get('expires_at')
    if expires_at and expires_at < int(time.time()):
        return False, "Access expired"
    return True, "OK"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление администраторами и авторизация
    POST /login - авторизация
    GET /users - список пользователей (только супер-админ)
    POST /users - создать пользователя (только супер-админ)
    PUT /users - обновить пользователя (супер-админ или сам себя)
    DELETE /users - удалить пользователя (только супер-админ)
    Version: 1.1
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
    
    # POST /login - авторизация
    if method == 'POST' and action == 'login':
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '').strip().lower()
        password = body_data.get('password', '')
        
        users_data = load_users_data()
        user = find_user_by_email(email, users_data)
        
        if not user:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        if not verify_password(password, user.get('password_hash', '')):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid password'}),
                'isBase64Encoded': False
            }
        
        has_access, error_msg = check_user_access(user)
        if not has_access:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': error_msg}),
                'isBase64Encoded': False
            }
        
        token = hashlib.sha256(f"{email}:{password}:{int(time.time())}".encode()).hexdigest()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'token': token,
                'email': email,
                'nickname': user.get('nickname', email),
                'role': user.get('role', 'admin'),
                'expires_at': user.get('expires_at')
            }),
            'isBase64Encoded': False
        }
    
    # Для остальных операций требуется авторизация
    headers = event.get('headers', {})
    token = headers.get('X-Admin-Token') or headers.get('x-admin-token', '')
    current_email = headers.get('X-Admin-Email') or headers.get('x-admin-email', '')
    
    if not token or not current_email:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    users_data = load_users_data()
    current_user = find_user_by_email(current_email, users_data)
    
    if not current_user:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    is_current_super_admin = is_super_admin(current_email)
    
    # GET /users - список пользователей (только супер-админ)
    if method == 'GET':
        if not is_current_super_admin:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        users_list = []
        for user in users_data.get('users', []):
            users_list.append({
                'email': user['email'],
                'nickname': user.get('nickname', user['email']),
                'role': user.get('role', 'admin'),
                'created_at': user.get('created_at'),
                'expires_at': user.get('expires_at')
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': users_list}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    # POST /users - создать пользователя (только супер-админ)
    if method == 'POST':
        if not is_current_super_admin:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        new_email = body_data.get('email', '').strip().lower()
        new_password = body_data.get('password', '')
        new_nickname = body_data.get('nickname', new_email)
        expires_days = body_data.get('expires_days')
        
        if not new_email or not new_password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email and password required'}),
                'isBase64Encoded': False
            }
        
        if find_user_by_email(new_email, users_data):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User already exists'}),
                'isBase64Encoded': False
            }
        
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        expires_at = None
        if expires_days:
            expires_at = int(time.time()) + (expires_days * 24 * 60 * 60)
        
        new_user = {
            'email': new_email,
            'nickname': new_nickname,
            'password_hash': password_hash,
            'role': 'admin',
            'created_at': int(time.time()),
            'expires_at': expires_at
        }
        
        users_data['users'].append(new_user)
        save_users_data(users_data)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'user': {
                'email': new_user['email'],
                'nickname': new_user['nickname'],
                'role': new_user['role'],
                'expires_at': new_user['expires_at']
            }}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    # PUT /users - обновить пользователя
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        target_email = body_data.get('email', '').strip().lower()
        
        # Супер-админ может редактировать всех, обычный админ - только себя
        if not is_current_super_admin and target_email != current_email:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        target_user = find_user_by_email(target_email, users_data)
        if not target_user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        # Обновление никнейма
        if 'nickname' in body_data:
            target_user['nickname'] = body_data['nickname']
        
        # Обновление пароля
        if 'password' in body_data and body_data['password']:
            target_user['password_hash'] = hashlib.sha256(body_data['password'].encode()).hexdigest()
        
        # Только супер-админ может менять expires_at
        if is_current_super_admin and 'expires_days' in body_data:
            expires_days = body_data['expires_days']
            if expires_days:
                target_user['expires_at'] = int(time.time()) + (expires_days * 24 * 60 * 60)
            else:
                target_user['expires_at'] = None
        
        save_users_data(users_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'user': {
                'email': target_user['email'],
                'nickname': target_user['nickname'],
                'role': target_user['role'],
                'expires_at': target_user.get('expires_at')
            }}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    # DELETE /users - удалить пользователя (только супер-админ)
    if method == 'DELETE':
        if not is_current_super_admin:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        target_email = body_data.get('email', '').strip().lower()
        
        # Нельзя удалить супер-админа
        if is_super_admin(target_email):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Cannot delete super admin'}),
                'isBase64Encoded': False
            }
        
        users_data['users'] = [u for u in users_data['users'] if u['email'].lower() != target_email]
        save_users_data(users_data)
        
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