"""
Скрипт для розбиття rada.geojson на окремі файли за кодами областей
Запуск: python split_rada.py
"""

import os
import json
from pathlib import Path

# Шлях до вихідного файлу та папки призначення
script_dir = Path(__file__).parent
source_file = script_dir / "data" / "rada.geojson"
output_dir = script_dir / "data" / "rada_regions"

# Створюємо папку для зберігання файлів областей, якщо її не існує
output_dir.mkdir(exist_ok=True, parents=True)

# Мапінг кодів областей з їх назвами
region_names = {
    "01": "Автономна Республіка Крим",
    "05": "Вінницька область",
    "07": "Волинська область",
    "12": "Дніпропетровська область",
    "14": "Донецька область",
    "18": "Житомирська область",
    "21": "Закарпатська область",
    "23": "Запорізька область",
    "26": "Івано-Франківська область",
    "32": "Київська область",
    "35": "Кіровоградська область",
    "44": "Луганська область",
    "46": "Львівська область",
    "48": "Миколаївська область",
    "51": "Одеська область",
    "53": "Полтавська область",
    "56": "Рівненська область",
    "59": "Сумська область",
    "61": "Тернопільська область",
    "63": "Харківська область",
    "65": "Херсонська область",
    "68": "Хмельницька область",
    "71": "Черкаська область",
    "73": "Чернівецька область",
    "74": "Чернігівська область",
    "80": "Київ",
    "85": "Севастополь"
}

print('Читаємо файл rada.geojson...')
try:
    with open(source_file, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)
except Exception as e:
    print(f'Помилка при читанні файлу: {e}')
    exit(1)

# Перевіряємо, чи це дійсно GeoJSON
if 'features' not in geo_data or not isinstance(geo_data['features'], list):
    print('Невірний формат GeoJSON')
    exit(1)

# Об'єкти для зберігання даних по областях
region_files = {}
region_counts = {}

# Розбиваємо об'єкти за кодами регіонів
print('Розбиваємо об\'єкти за кодами областей...')
for feature in geo_data['features']:
    # Перевіряємо наявність koatuu
    if feature.get('properties') and feature['properties'].get('koatuu'):
        # Отримуємо код області (перші дві цифри КОАТУУ)
        region_code = feature['properties']['koatuu'][:2]
        # Додаємо koatuu9 для сумісності
        feature['properties']['koatuu9'] = feature['properties']['koatuu'][:9]
        
        # Перевіряємо, чи маємо такий регіон у мапі
        if region_code not in region_files:
            region_files[region_code] = {
                'type': 'FeatureCollection',
                'features': []
            }
            region_counts[region_code] = 0
        
        # Додаємо об'єкт до відповідного регіону
        region_files[region_code]['features'].append(feature)
        region_counts[region_code] += 1

# Записуємо файли по регіонах
print('Записуємо файли по регіонах...')
for region_code, region_data in region_files.items():
    output_file = output_dir / f"rada_{region_code}.geojson"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(region_data, f)
    
    region_name = region_names.get(region_code, f'Невідомий регіон {region_code}')
    print(f"{region_code}: {region_counts[region_code]} об'єктів ({region_name})")

# Створюємо також каталог регіонів для зручної навігації
print('Створюємо каталог регіонів...')
catalog = {
    'regions': [
        {
            'code': code,
            'name': region_names.get(code, f'Регіон {code}'),
            'count': count,
            'file': f'rada_{code}.geojson'
        }
        for code, count in region_counts.items()
    ]
}

with open(output_dir / 'regions.json', 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\nГотово! Розбито на {len(region_files)} файлів в папці {output_dir}")
