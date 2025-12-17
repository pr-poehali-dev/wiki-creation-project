import json
import os
import base64
import io
import boto3
from PIL import Image
from typing import Dict, Any
import urllib.request
import urllib.parse

WATERMARK_URL = urllib.parse.quote("https://cdn.poehali.dev/files/вод знак.png", safe=':/')

def download_watermark() -> Image.Image:
    """Скачать водяной знак из CDN"""
    with urllib.request.urlopen(WATERMARK_URL) as response:
        watermark_data = response.read()
    return Image.open(io.BytesIO(watermark_data))

def apply_watermark(image: Image.Image, watermark: Image.Image, max_size: int = 120) -> Image.Image:
    """Наложить водяной знак в правый нижний угол"""
    # Работаем в RGB режиме
    if image.mode in ('RGBA', 'LA', 'P'):
        img_copy = image.convert('RGB')
    else:
        img_copy = image.copy()
    
    # Конвертируем водяной знак в RGBA если нужно
    if watermark.mode != 'RGBA':
        watermark = watermark.convert('RGBA')
    
    # Масштабируем водяной знак
    wm_ratio = watermark.width / watermark.height
    wm_width = max_size
    wm_height = int(wm_width / wm_ratio)
    watermark_resized = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
    
    # Применяем прозрачность 60%
    alpha = watermark_resized.split()[3]
    alpha = alpha.point(lambda p: int(p * 0.6))
    watermark_resized.putalpha(alpha)
    
    # Позиция в правом нижнем углу с отступом 12px
    position = (
        img_copy.width - watermark_resized.width - 12,
        img_copy.height - watermark_resized.height - 12
    )
    
    # Создаем временное изображение для наложения
    watermark_layer = Image.new('RGBA', img_copy.size, (0, 0, 0, 0))
    watermark_layer.paste(watermark_resized, position)
    
    # Конвертируем основное изображение в RGBA для наложения
    img_rgba = img_copy.convert('RGBA')
    img_rgba = Image.alpha_composite(img_rgba, watermark_layer)
    
    # Конвертируем обратно в RGB
    return img_rgba.convert('RGB')

def compress_image(image: Image.Image, max_width: int = 1200, quality: int = 85) -> Image.Image:
    """Сжать изображение до разумного размера"""
    if image.width > max_width:
        ratio = max_width / image.width
        new_height = int(image.height * ratio)
        image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    return image

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обработка изображений: наложение водяного знака и сжатие
    POST: загрузка изображения с обработкой
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
        body_data = json.loads(event.get('body', '{}'))
        image_base64 = body_data.get('image', '')
        filename = body_data.get('filename', 'image.jpg')
        folder = body_data.get('folder', 'wiki')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Image data required'})
            }
        
        # Декодируем base64
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # 1. Сжимаем изображение
        image = compress_image(image, max_width=1200, quality=85)
        
        # 2. Скачиваем и накладываем водяной знак
        watermark = download_watermark()
        image = apply_watermark(image, watermark, max_size=120)
        
        # 3. Сохраняем в JPEG (уже в RGB после apply_watermark)
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        # 4. Загружаем на S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        # Генерируем уникальное имя файла
        import time
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{folder}/{int(time.time())}_{filename.replace(' ', '_')}"
        if not unique_filename.lower().endswith(('.jpg', '.jpeg')):
            unique_filename = unique_filename.rsplit('.', 1)[0] + '.jpg'
        
        s3.put_object(
            Bucket='files',
            Key=unique_filename,
            Body=output.getvalue(),
            ContentType='image/jpeg'
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'url': cdn_url,
                'message': 'Image processed and uploaded successfully'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }