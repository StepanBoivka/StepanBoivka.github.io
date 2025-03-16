import json
import os
from pathlib import Path

def fix_geojson_encoding(file_path):
    print(f"Обробка файлу: {file_path}")
    
    # Читаємо файл
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Функція для обробки властивостей feature
    def fix_properties(props):
        if not props:
            return props
            
        # Список полів які потрібно декодувати
        fields = ['coatuu_namesr', 'coatuu_nameobl', 'coatuu_namerayon']
        
        for field in fields:
            if field in props:
                # Перевіряємо чи значення вже в UTF-8
                if '\\u' in json.dumps(props[field]):
                    # Якщо значення escaped, воно автоматично буде декодовано
                    # при читанні json.load(), тому нічого додатково робити не потрібно
                    pass
        
        return props

    # Обробляємо кожен feature
    if 'features' in data:
        for feature in data['features']:
            if 'properties' in feature:
                feature['properties'] = fix_properties(feature['properties'])
    
    # Записуємо результат назад у файл
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    # Шлях до папки з rada_regions
    base_path = Path('data/rada_regions')
    
    # Перевіряємо існування папки
    if not base_path.exists():
        print(f"Папка {base_path} не знайдена!")
        return
    
    # Обробляємо всі .geojson файли
    for file_path in base_path.glob('*.geojson'):
        try:
            fix_geojson_encoding(file_path)
            print(f"Успішно оброблено: {file_path}")
        except Exception as e:
            print(f"Помилка при обробці {file_path}: {str(e)}")

if __name__ == '__main__':
    main()
    print("Обробка завершена!")
