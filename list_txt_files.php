<?php
// Отримання списку всіх txt файлів з папки data/
$directory = 'data/';
$files = glob($directory . '*.txt');
$fileList = array_map('basename', $files);

// Сортуємо файли за назвою
sort($fileList);

// Повертаємо у форматі JSON, який очікує JavaScript
$response = [
    'files' => $fileList,
    'count' => count($fileList),
    'generated_at' => date('Y-m-d H:i:s')
];

header('Content-Type: application/json');
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
