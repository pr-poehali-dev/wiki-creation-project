import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление онлайн-активностью администраторов
    Методы: GET - список онлайн, POST - обновление активности
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
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'POST':
            # Обновление активности пользователя
            body_data = json.loads(event.get('body', '{}'))
            email = body_data.get('email', '')
            nickname = body_data.get('nickname', email)
            action = body_data.get('action', 'heartbeat')  # heartbeat, login, visit
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email required'})
                }
            
            # Обновление или создание записи
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
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        elif method == 'GET':
            # Получение списка онлайн пользователей (активность за последние 30 секунд)
            online_threshold = datetime.now() - timedelta(seconds=30)
            
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
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'users': users})
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
