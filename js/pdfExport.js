document.getElementById('exportPDF').addEventListener('click', function() {
    const exchangeAnalysis = document.getElementById('exchangeAnalysis');
    const totalArea = document.getElementById('totalArea').textContent;
    const fieldTables = document.getElementById('fieldTables');
    const notFoundSummary = document.getElementById('notFoundSummary');
    const mutualExchangeWarning = document.getElementById('mutualExchangeWarning');

    if (!exchangeAnalysis || !totalArea || !fieldTables) {
        alert('Спочатку сформуйте дані для обміну');
        return;
    }

    try {
        // Создаем базовое определение документа
        const documentDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            content: [
                {
                    text: 'ПРОПОЗИЦІЯ ОБМІНУ ЗЕМЕЛЬНИМИ ДІЛЯНКАМИ',
                    style: 'header',
                    alignment: 'center'
                },
                {
                    text: `Дата формування: ${new Date().toLocaleDateString('uk-UA')}`,
                    style: 'date',
                    margin: [0, 10, 0, 20]
                }
            ],
            styles: {
                header: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                date: {
                    fontSize: 12,
                    margin: [0, 5, 0, 15]
                },
                tenantHeader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 15, 0, 5]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 9,
                    fillColor: '#f8f9fa'
                },
                tableFooter: {
                    bold: true,
                    fontSize: 9
                },
                warningText: {
                    fontSize: 10,
                    color: '#dc3545',
                    margin: [0, 5, 0, 5]
                }
            },
            pageMargins: [15, 20, 15, 20],
            defaultStyle: {
                fontSize: 9,
                lineHeight: 1.2
            }
        };

        // Добавляем предупреждения (если есть)
        if (notFoundSummary && notFoundSummary.style.display !== 'none') {
            documentDefinition.content.push({
                text: notFoundSummary.textContent.trim(),
                style: 'warningText',
                margin: [0, 5, 0, 15]
            });
        }

        if (mutualExchangeWarning && mutualExchangeWarning.style.display !== 'none') {
            documentDefinition.content.push({
                text: mutualExchangeWarning.textContent.trim(),
                style: 'warningText',
                margin: [0, 5, 0, 15]
            });
        }

        // Обрабатываем каждую группу арендаторов
        const tenantGroups = document.querySelectorAll('#fieldTables .tenant-group');
        
        tenantGroups.forEach((group) => {
            const tenantName = group.querySelector('h5').textContent;
            
            const table = group.querySelector('table');
            if (!table) {
                return; // Skip this group
            }
            
            // Добавляем заголовок группы в PDF
            documentDefinition.content.push({
                text: tenantName,
                style: 'tenantHeader'
            });
            
            // Получаем заголовки таблицы
            const headerRow = table.querySelector('thead tr');
            if (!headerRow) {
                return; // Skip this table
            }
            
            const headerCells = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent || '');
            
            // Создаем тело таблицы для PDF
            const tableBody = [];
            
            // Добавляем строку с заголовками
            tableBody.push(headerCells.map(header => ({
                text: header,
                style: 'tableHeader'
            })));
            
            // Добавляем строки данных из tbody
            const tbody = table.querySelector('tbody');
            if (tbody) {
                const dataRows = tbody.querySelectorAll('tr');
                
                dataRows.forEach((row) => {
                    const cellsData = [];
                    const cells = row.querySelectorAll('td');
                    
                    // Формируем ячейки для каждой строки
                    for (let i = 0; i < headerCells.length; i++) {
                        // Если ячейка существует, используем ее содержимое, иначе пустая строка
                        const cellContent = i < cells.length ? cells[i].textContent || '' : '';
                        cellsData.push({
                            text: cellContent
                        });
                    }
                    
                    // Проверка на соответствие количества ячеек
                    if (cellsData.length !== headerCells.length) {                        
                        // Добавляем недостающие ячейки
                        while (cellsData.length < headerCells.length) {
                            cellsData.push({ text: '' });
                        }
                        
                        // Или обрезаем лишние
                        if (cellsData.length > headerCells.length) {
                            cellsData.length = headerCells.length;
                        }
                    }
                    
                    tableBody.push(cellsData);
                });
            }
            
            // Добавляем строку с итогами из tfoot
            const tfoot = table.querySelector('tfoot');
            if (tfoot) {
                const footerRows = tfoot.querySelectorAll('tr');
                
                footerRows.forEach((row) => {
                    const footerCells = [];
                    const cells = row.querySelectorAll('td');
                    
                    // Сначала посчитаем общее количество ячеек с учетом colspan
                    let totalCells = 0;
                    for (let i = 0; i < cells.length; i++) {
                        const colspan = parseInt(cells[i].getAttribute('colspan') || '1', 10);
                        totalCells += colspan;
                    }
                    
                    // Если общее количество ячеек не совпадает с заголовками, корректируем
                    let cellIndex = 0;
                    for (let i = 0; i < cells.length && cellIndex < headerCells.length; i++) {
                        const cell = cells[i];
                        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
                        
                        // Добавляем ячейку с colspan
                        if (colspan > 1 && cellIndex + colspan <= headerCells.length) {
                            footerCells.push({
                                text: cell.textContent || '',
                                style: 'tableFooter',
                                colSpan: colspan
                            });
                            
                            // Добавляем пустые ячейки для учета colspan
                            for (let j = 1; j < colspan; j++) {
                                footerCells.push({});
                            }
                            
                            cellIndex += colspan;
                        } else {
                            // Обычная ячейка
                            footerCells.push({
                                text: cell.textContent || '',
                                style: 'tableFooter'
                            });
                            cellIndex++;
                        }
                    }
                    
                    // Проверяем и корректируем количество ячеек в итоговой строке
                    if (footerCells.length !== headerCells.length) {
                        
                        // Добавляем недостающие ячейки
                        while (footerCells.length < headerCells.length) {
                            footerCells.push({ text: '', style: 'tableFooter' });
                        }
                        
                        // Или обрезаем лишние
                        if (footerCells.length > headerCells.length) {
                            footerCells.length = headerCells.length;
                        }
                    }
                    
                    tableBody.push(footerCells);
                });
            }
            
            // Проверяем, что все строки имеют одинаковое количество ячеек
            let hasErrors = false;
            tableBody.forEach((row, rowIndex) => {
                if (row.length !== headerCells.length) {
                    hasErrors = true;
                }
                
                // Проверяем наличие undefined в ячейках
                row.forEach((cell, cellIndex) => {
                    if (cell === undefined) {
                        hasErrors = true;
                        // Заменяем undefined на пустой объект
                        row[cellIndex] = { text: '' };
                    }
                });
            });
            
            if (hasErrors) {
                return; // Skip this table
            }
            
            // Добавляем таблицу в документ
            documentDefinition.content.push({
                table: {
                    headerRows: 1,
                    // Установка равномерной ширины столбцов
                    widths: Array(headerCells.length).fill('*'),
                    body: tableBody
                },
                margin: [0, 5, 0, 15],
                layout: {
                    hLineWidth: function() { return 0.5; },
                    vLineWidth: function() { return 0.5; },
                    hLineColor: function() { return '#ddd'; },
                    vLineColor: function() { return '#ddd'; },
                    paddingLeft: function() { return 4; },
                    paddingRight: function() { return 4; },
                    paddingTop: function() { return 2; },
                    paddingBottom: function() { return 2; },
                    fillColor: function(i) {
                        return (i === 0) ? '#f8f9fa' : null;
                    }
                }
            });
        });

        // Добавляем общую площадь обмена
        documentDefinition.content.push({
            text: `Загальна площа обміну: ${totalArea} га`,
            style: 'tenantHeader',
            margin: [0, 10, 0, 10]
        });

        // Добавляем анализ равноценности
        documentDefinition.content.push({
            text: 'АНАЛІЗ РІВНОЦІННОСТІ ОБМІНУ:',
            style: 'header',
            margin: [0, 10, 0, 10]
        });

        // Получаем результаты анализа равноценности
        const analysisItems = exchangeAnalysis.children;
        
        for (let i = 0; i < analysisItems.length; i++) {
            const element = analysisItems[i];
            const text = element.textContent;
            const color = element.classList.contains('text-danger') ? '#dc3545' : '#28a745';
            
            documentDefinition.content.push({
                text: text,
                color: color,
                margin: [0, 5]
            });
        }
        
        // Создаем PDF и загружаем
        pdfMake.createPdf(documentDefinition).download(
            `пропозиція_обміну_${new Date().toISOString().slice(0,10)}.pdf`
        );
        
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        alert('Помилка при створенні PDF: ' + error.message);
    }
});

/**
 * Извлекает данные из HTML таблицы в двумерный массив
 * @param {HTMLElement} table - HTML таблица
 * @return {Array} двумерный массив с данными таблицы
 */
function extractTableData(table) {
    if (!table) return null;
    
    const result = [];
    
    try {
        // Обрабатываем заголовки
        const theadRows = table.querySelectorAll('thead tr');
        if (theadRows.length > 0) {
            const headerRow = [];
            theadRows[0].querySelectorAll('th').forEach(cell => {
                headerRow.push(cell.textContent.trim());
            });
            
            if (headerRow.length > 0) {
                result.push(headerRow);
            }
        }
        
        // Обрабатываем тело таблицы
        const tbodyRows = table.querySelectorAll('tbody tr');
        tbodyRows.forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            
            // Проверяем, что у нас есть данные в строке
            if (rowData.length > 0) {
                // Выравниваем количество ячеек в строке с количеством заголовков
                while (result.length > 0 && rowData.length < result[0].length) {
                    rowData.push('');
                }
                
                result.push(rowData);
            }
        });
        
        // Обрабатываем футер таблицы
        const tfootRows = table.querySelectorAll('tfoot tr');
        if (tfootRows.length > 0) {
            const footerRow = Array(result[0] ? result[0].length : 0).fill('');
            let currentCol = 0;
            
            // Обрабатываем каждую ячейку футера с учетом colspan
            tfootRows[0].querySelectorAll('td').forEach(cell => {
                const colspan = parseInt(cell.getAttribute('colspan')) || 1;
                const text = cell.textContent.trim();
                
                // Проверяем, не выходим ли за пределы массива
                if (currentCol < footerRow.length) {
                    footerRow[currentCol] = text;
                    
                    // Увеличиваем currentCol с учетом colspan
                    currentCol += colspan;
                }
            });
            
            result.push(footerRow);
        }
    } catch (error) {
        console.error('Error extracting table data:', error);
    }
    
    return result;
}

// Определяем функцию generatePDF, на которую ссылаются в коде
function generatePDF(tables) {
    // Эта функция может вызываться извне для генерации PDF
    const documentDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        content: [
            {
                text: 'Дані обміну земельними ділянками',
                style: 'header',
                alignment: 'center'
            },
            {
                text: `Дата: ${new Date().toLocaleDateString('uk-UA')}`,
                style: 'date'
            }
        ],
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            date: {
                fontSize: 10,
                margin: [0, 5, 0, 15]
            },
            table: {
                margin: [0, 5, 0, 15]
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: 'black'
            }
        }
    };
    
    // Добавляем таблицы в документ
    if (tables && tables.length > 0) {
        tables.forEach(tableData => {
            if (tableData && tableData.length > 0) {
                documentDefinition.content.push({
                    table: {
                        headerRows: 1,
                        body: tableData
                    },
                    style: 'table',
                    layout: {
                        fillColor: function(i) {
                            return (i === 0) ? '#eeeeee' : null;
                        }
                    }
                });
            }
        });
    }
    
    // Возвращаем определение документа для дальнейшего использования
    return documentDefinition;
}

// Экспортируем функции
window.generatePDF = generatePDF;
