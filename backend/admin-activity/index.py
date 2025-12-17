import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# In-memory кэш для GET-запросов
_cache: Dict[str, Any] = {
    'data': None,
    'timestamp': None
}
CACHE_TTL_SECONDS = 10

def get_cached_users() -> Optional[Dict[str, Any]]:
    """Получить данные из кэша, если они актуальны"""
    if _cache['data'] is None or _cache['timestamp'] is None:
        return None
    
    cache_age = (datetime.now() - _cache['timestamp']).total_seconds()
    if cache_age > CACHE_TTL_SECONDS:
        return None
    
    return _cache['data']

def set_cache(data: Dict[str, Any]) -> None:
    """Сохранить данные в кэш"""
    _cache['data'] = data
    _cache['timestamp'] = datetime.now()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление онлайн-активностью администраторов с кэшированием
    Методы: GET - список онлайн (кэш 10 сек), POST - обновление активности
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        if method == 'GET':
            # Проверяем кэш перед запросом к БД
            cached_data = get_cached_users()
            if cached_data is not None:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'X-Cache': 'HIT'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps(cached_data)
                }
            
            # Кэш пустой или устарел - запрашиваем из БД
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            online_threshold = datetime.now() - timedelta(seconds=60)
            
            cur.execute('''
                SELECT email, nickname, last_seen, login_count, visit_count
                FROM admin_activity
                WHERE last_seen > %s
                ORDER BY last_seen DESC
            ''', (online_threshold,))
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'email': row[0],
                    'nickname': row[1],
                    'lastSeen': row[2].isoformat(),
                    'loginCount': row[3],
                    'visitCount': row[4]
                })
            
            cur.close()
            conn.close()
            
            response_data = {'users': users}
            set_cache(response_data)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'MISS'
                },
                'isBase64Encoded': False,
                'body': json.dumps(response_data)
            }
        
        elif method == 'POST':
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            body_data = json.loads(event.get('body', '{}'))
            email = body_data.get('email', '')
            nickname = body_data.get('nickname', email)
            action = body_data.get('action', 'heartbeat')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email required'})
                }
            
            if action == 'login':
                cur.execute('''
                    INSERT INTO admin_activity (email, nickname, last_seen, login_count, visit_count)
                    VALUES (%s, %s, NOW(), 1, 0)
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        nickname = EXCLUDED.nickname,
                        last_seen = NOW(),
                        login_count = admin_activity.login_count + 1
                ''', (email, nickname))
            elif action == 'visit':
                cur.execute('''
                    INSERT INTO admin_activity (email, nickname, last_seen, login_count, visit_count)
                    VALUES (%s, %s, NOW(), 0, 1)
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        nickname = EXCLUDED.nickname,
                        last_seen = NOW(),
                        visit_count = admin_activity.visit_count + 1
                ''', (email, nickname))
            else:  # heartbeat
                cur.execute('''
                    INSERT INTO admin_activity (email, nickname, last_seen, login_count, visit_count)
                    VALUES (%s, %s, NOW(), 0, 0)
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        nickname = EXCLUDED.nickname,
                        last_seen = NOW()
                ''', (email, nickname))
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Инвалидируем кэш после изменения данных
            _cache['data'] = None
            _cache['timestamp'] = None
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
