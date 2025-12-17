import json
import os
import io
import boto3
from PIL import Image
from typing import Dict, Any, List
import urllib.request
import urllib.parse

WATERMARK_URL = urllib.parse.quote("https://cdn.poehali.dev/files/вод знак.png", safe=':/')
DATA_MANAGER_URL = "https://functions.poehali.dev/48941930-c0e7-45ef-89bf-41d4184cf005"

def download_watermark() -> Image.Image:
    """Скачать водяной знак из CDN"""
    with urllib.request.urlopen(WATERMARK_URL) as response:
        watermark_data = response.read()
    return Image.open(io.BytesIO(watermark_data))

def download_image(url: str) -> Image.Image:
    """Скачать изображение по URL"""
    with urllib.request.urlopen(url) as response:
        image_data = response.read()
    return Image.open(io.BytesIO(image_data))

def apply_watermark(image: Image.Image, watermark: Image.Image, max_size: int = 120) -> Image.Image:
    """Наложить водяной знак в правый нижний угол"""
    if image.mode in ('RGBA', 'LA', 'P'):
        img_copy = image.convert('RGB')
    elif image.mode != 'RGB':
        img_copy = image.convert('RGB')
    else:
        img_copy = image.copy()
    
    if watermark.mode != 'RGBA':
        watermark = watermark.convert('RGBA')
    
    wm_ratio = watermark.width / watermark.height
    wm_width = max_size
    wm_height = int(wm_width / wm_ratio)
    watermark_resized = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
    
    alpha = watermark_resized.split()[3]
    alpha = alpha.point(lambda p: int(p * 0.6))
    watermark_resized.putalpha(alpha)
    
    position = (
        img_copy.width - watermark_resized.width - 12,
        img_copy.height - watermark_resized.height - 12
    )
    
    img_copy.paste(watermark_resized, position, watermark_resized)
    return img_copy

def get_all_items() -> List[Dict[str, Any]]:
    """Получить все предметы из data-manager"""
    with urllib.request.urlopen(f"{DATA_MANAGER_URL}?type=items") as response:
        data = json.loads(response.read().decode())
    return data.get('предметы', [])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Переобработка всех изображений с наложением водяных знаков
    POST: запускает процесс переобработки всех изображений
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Получаем список всех предметов
        items = get_all_items()
        
        # Инициализируем S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        # Скачиваем водяной знак один раз
        watermark = download_watermark()
        
        processed_count = 0
        failed_count = 0
        results = []
        
        for item in items:
            image_url = item.get('image', '')
            if not image_url:
                continue
            
            try:
                # Скачиваем изображение
                image = download_image(image_url)
                
                # Накладываем водяной знак
                image = apply_watermark(image, watermark, max_size=120)
                
                # Сохраняем в JPEG
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                
                # Извлекаем путь из URL
                # URL формат: https://cdn.poehali.dev/projects/{project_id}/bucket/{path}
                url_parts = image_url.split('/bucket/')
                if len(url_parts) < 2:
                    results.append({'item': item.get('name', ''), 'status': 'failed', 'error': 'Invalid URL format'})
                    failed_count += 1
                    continue
                
                file_path = url_parts[1]
                
                # Загружаем обратно на S3
                s3.put_object(
                    Bucket='files',
                    Key=file_path,
                    Body=output.getvalue(),
                    ContentType='image/jpeg'
                )
                
                processed_count += 1
                results.append({'item': item.get('name', ''), 'status': 'success', 'url': image_url})
                
            except Exception as e:
                failed_count += 1
                results.append({'item': item.get('name', ''), 'status': 'failed', 'error': str(e)})
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'processed': processed_count,
                'failed': failed_count,
                'total': len(items),
                'results': results
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
