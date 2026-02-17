/**
 * Генератор аналітичної довідки по раді (PDF)
 * АГРО-ПРОСТІР
 */

// Функція для генерації довідки з головної сторінки
async function generateCouncilReport(councilId, councilName, geojsonFile, myTenants = []) {
    // Показуємо індикатор завантаження
    showReportLoading(true);
    
    try {
        // Формуємо правильний шлях
        const dataPath = councilId ? `data/${councilId}/` : 'data/';
        const url = dataPath + geojsonFile;
        
        console.log('Завантаження довідки:', url);
        
        // Завантажуємо дані
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Не вдалося завантажити дані: ${response.status}`);
        
        const geojson = await response.json();
        // Фільтруємо тільки original
        const originalFeatures = geojson.features.filter(f => f.properties && f.properties.type === 'original');
        console.log('Завантажено original features:', originalFeatures.length);
        
        const stats = calculateStats(originalFeatures);
        console.log('Статистика:', stats);
        
        // Генеруємо PDF з персоналізацією
        createReportPDF(councilName, stats, myTenants);
        
    } catch (error) {
        console.error('Помилка генерації довідки:', error);
        alert('Помилка генерації довідки: ' + error.message);
    } finally {
        showReportLoading(false);
    }
}

// Функція для генерації довідки зі сторінки статистики (дані вже є)
function generateReportFromStats(councilName, stats, myTenants = []) {
    createReportPDF(councilName, stats, myTenants);
}

// Розрахунок статистики з features (включає ЄДРПОУ)
function calculateStats(features) {
    const currentYear = new Date().getFullYear();
    
    const stats = {
        totalArea: 0,
        totalParcels: 0,
        freeArea: 0,
        freeParcels: 0,
        freeNGO: 0,
        rentedArea: 0,
        totalNGO: 0,
        tenants: {},      // Ключ = ЄДРПОУ або назва
        expiryYears: {},
        newOwnersFree: {}
    };
    
    const uniqueTenants = new Set();
    
    // Debug: показуємо перший feature
    if (features && features.length > 0) {
        console.log('Перший feature properties:', features[0].properties);
    }
    
    features.forEach(f => {
        const p = f.properties;
        
        // Площа - як в statistics.html
        const area = parseFloat(p['Площа розрахована'] || p['Площа ДЗК'] || 0) || 0;
        
        // НГО - видаляємо пробіли як в statistics.html
        const ngo = parseFloat(String(p['НГО'] || '0').replace(/\s/g, '')) || 0;
        
        // Орендар, ЄДРПОУ та рік завершення
        const tenantName = p['Орендар'] || '';
        const edrpou = p['ЄДРПОУ орендаря ділянки'] || p['ЄДРПОУ орендаря поля'] || '';
        const expiryYear = p['Рік завершення'];
        const registrationDate = p['Дата реєстрації'];
        
        // Ключ орендаря = ЄДРПОУ якщо є, інакше назва
        const tenantKey = edrpou || tenantName;
        
        stats.totalArea += area;
        stats.totalParcels++;
        stats.totalNGO += ngo;
        
        if (!tenantName || tenantName.trim() === '') {
            stats.freeArea += area;
            stats.freeParcels++;
            stats.freeNGO += ngo;
            
            // Нові власники без оренди (зареєстровані за останні 3 роки)
            if (registrationDate) {
                const regYear = extractYear(registrationDate);
                if (regYear && regYear >= currentYear - 2) {
                    if (!stats.newOwnersFree[regYear]) {
                        stats.newOwnersFree[regYear] = { count: 0, area: 0, owners: [] };
                    }
                    stats.newOwnersFree[regYear].count++;
                    stats.newOwnersFree[regYear].area += area;
                }
            }
        } else {
            stats.rentedArea += area;
            uniqueTenants.add(tenantKey);
            
            // Зберігаємо з ЄДРПОУ та назвою
            if (!stats.tenants[tenantKey]) {
                stats.tenants[tenantKey] = { 
                    count: 0, 
                    area: 0, 
                    ngo: 0, 
                    name: tenantName,
                    edrpou: edrpou
                };
            }
            stats.tenants[tenantKey].count++;
            stats.tenants[tenantKey].area += area;
            stats.tenants[tenantKey].ngo += ngo;
            
            // Статистика по роках завершення (зберігаємо tenantKey)
            if (expiryYear) {
                const year = parseInt(expiryYear);
                if (!isNaN(year)) {
                    if (!stats.expiryYears[year]) {
                        stats.expiryYears[year] = { count: 0, area: 0, tenants: {} };
                    }
                    if (!stats.expiryYears[year].tenants[tenantKey]) {
                        stats.expiryYears[year].tenants[tenantKey] = { 
                            count: 0, 
                            area: 0, 
                            name: tenantName, 
                            edrpou: edrpou 
                        };
                    }
                    stats.expiryYears[year].count++;
                    stats.expiryYears[year].area += area;
                    stats.expiryYears[year].tenants[tenantKey].count++;
                    stats.expiryYears[year].tenants[tenantKey].area += area;
                }
            }
        }
    });
    
    stats.tenantsCount = uniqueTenants.size;
    console.log('Розрахована статистика:', {
        totalArea: stats.totalArea,
        totalParcels: stats.totalParcels,
        freeArea: stats.freeArea,
        freeParcels: stats.freeParcels,
        rentedArea: stats.rentedArea,
        tenantsCount: stats.tenantsCount
    });
    return stats;
}

function extractYear(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('.')) return parseInt(dateStr.split('.')[2]);
    if (dateStr.includes('/')) return parseInt(dateStr.split('/')[2]);
    if (dateStr.length === 4) return parseInt(dateStr);
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
}

// Створення PDF документа - аналітичний текстовий формат з персоналізацією
function createReportPDF(councilName, stats, myTenants = []) {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Чи є персоналізація?
    const isPersonalized = myTenants && myTenants.length > 0;
    const myTenantKeys = myTenants.map(t => t.key);
    
    // Захист від undefined
    const expiryYears = stats.expiryYears || {};
    const tenants = stats.tenants || {};
    const newOwnersFree = stats.newOwnersFree || {};
    const freeArea = stats.freeArea || 0;
    const freeParcels = stats.freeParcels || 0;
    const totalArea = stats.totalArea || 0;
    const totalParcels = stats.totalParcels || 0;
    const rentedArea = stats.rentedArea || 0;
    const totalNGO = stats.totalNGO || 0;
    const tenantsCount = stats.tenantsCount || Object.keys(tenants).length;
    
    // Відсоток оренди
    const rentedPercent = totalArea > 0 ? (rentedArea / totalArea * 100).toFixed(1) : 0;
    const freePercent = totalArea > 0 ? (freeArea / totalArea * 100).toFixed(1) : 0;
    
    // Розділяємо орендарів на своїх та конкурентів
    let myTenantsData = [];
    let competitorsData = [];
    let myTotalArea = 0, myTotalCount = 0;
    let competitorsTotalArea = 0, competitorsTotalCount = 0;
    
    Object.entries(tenants).forEach(([key, data]) => {
        const tenantInfo = {
            key,
            name: data.name || key,
            edrpou: data.edrpou || '',
            area: data.area,
            count: data.count,
            ngo: data.ngo
        };
        
        if (isPersonalized && myTenantKeys.includes(key)) {
            myTenantsData.push(tenantInfo);
            myTotalArea += data.area;
            myTotalCount += data.count;
        } else {
            competitorsData.push(tenantInfo);
            competitorsTotalArea += data.area;
            competitorsTotalCount += data.count;
        }
    });
    
    myTenantsData.sort((a, b) => b.area - a.area);
    competitorsData.sort((a, b) => b.area - a.area);
    
    // Підрахунок завершень для своїх та конкурентів
    let myExpiringByYear = {};
    let competitorsExpiringByYear = {};
    
    Object.entries(expiryYears).forEach(([year, yearData]) => {
        const y = parseInt(year);
        if (y >= currentYear && y <= currentYear + 5) {
            myExpiringByYear[y] = { count: 0, area: 0 };
            competitorsExpiringByYear[y] = { count: 0, area: 0 };
            
            Object.entries(yearData.tenants || {}).forEach(([tenantKey, tData]) => {
                if (isPersonalized && myTenantKeys.includes(tenantKey)) {
                    myExpiringByYear[y].count += tData.count;
                    myExpiringByYear[y].area += tData.area;
                } else {
                    competitorsExpiringByYear[y].count += tData.count;
                    competitorsExpiringByYear[y].area += tData.area;
                }
            });
        }
    });
    
    // Підрахунок по роках завершення
    const sortedYears = Object.keys(expiryYears).map(Number).sort((a, b) => a - b);
    let expiredCount = 0, expiredArea = 0;
    let futureYearsData = [];
    
    sortedYears.forEach(year => {
        const data = expiryYears[year];
        if (year < currentYear) {
            expiredCount += data.count || 0;
            expiredArea += data.area || 0;
        } else if (year <= currentYear + 5) {
            futureYearsData.push({ year, count: data.count || 0, area: data.area || 0 });
        }
    });
    
    // Нові власники
    let newOwnersCount = 0, newOwnersArea = 0;
    Object.values(newOwnersFree).forEach(data => {
        newOwnersCount += data.count || 0;
        newOwnersArea += data.area || 0;
    });
    
    // Топ-10 орендарів для матриці (з ЄДРПОУ та назвою)
    const topTenants = Object.entries(tenants)
        .sort((a, b) => b[1].area - a[1].area)
        .slice(0, 10)
        .map(([key, data]) => ({
            key,
            name: data.name || key,
            edrpou: data.edrpou || '',
            area: data.area,
            count: data.count,
            ngo: data.ngo,
            isMy: isPersonalized && myTenantKeys.includes(key)
        }));
    
    // Роки для матриці (поточний + 5 років)
    const matrixYears = [];
    for (let y = currentYear; y <= currentYear + 5; y++) {
        matrixYears.push(y);
    }
    
    // Будуємо матрицю орендарів по роках
    const matrixData = topTenants.map(tenant => {
        const row = { 
            key: tenant.key,
            name: tenant.name, 
            edrpou: tenant.edrpou,
            total: tenant.area, 
            isMy: tenant.isMy,
            years: {} 
        };
        matrixYears.forEach(year => {
            const yearData = expiryYears[year];
            if (yearData && yearData.tenants && yearData.tenants[tenant.key]) {
                row.years[year] = yearData.tenants[tenant.key].area;
            } else {
                row.years[year] = 0;
            }
        });
        return row;
    });
    
    // Підсумки по роках для матриці
    const yearTotals = {};
    matrixYears.forEach(year => {
        yearTotals[year] = expiryYears[year] ? expiryYears[year].area || 0 : 0;
    });
    
    // Потенціал
    const currentYearData = futureYearsData.find(d => d.year === currentYear) || { count: 0, area: 0 };
    const nextYearData = futureYearsData.find(d => d.year === currentYear + 1) || { count: 0, area: 0 };
    const totalPotentialArea = freeArea + newOwnersArea + expiredArea + currentYearData.area + nextYearData.area;
    
    // === ДОКУМЕНТ PDF ===
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 70, 40, 60],
        
        header: function(currentPage, pageCount) {
            return {
                columns: [
                    { text: 'АГРО-ПРОСТІР | Аналітична довідка', style: 'headerBrand', margin: [40, 25, 0, 0] },
                    { text: `${currentPage}/${pageCount}`, alignment: 'right', style: 'headerPage', margin: [0, 25, 40, 0] }
                ]
            };
        },
        
        footer: {
            columns: [
                { text: 'agro-prostir.com.ua — система аналітики земельних ділянок для агробізнесу', style: 'footerText', margin: [40, 0, 0, 0] },
                { text: `${currentDate} ${currentTime}`, alignment: 'right', style: 'footerText', margin: [0, 0, 40, 0] }
            ],
            margin: [0, 20, 0, 0]
        },
        
        content: [
            // === ЗАГОЛОВОК ===
            { text: 'АНАЛІТИЧНА ДОВІДКА', style: 'mainTitle', alignment: 'center' },
            { text: `щодо стану земельних відносин на території`, style: 'subtitle', alignment: 'center' },
            { text: councilName, style: 'councilName', alignment: 'center', margin: [0, 0, 0, 5] },
            { text: `Станом на ${currentDate}`, style: 'dateText', alignment: 'center', margin: [0, 0, 0, 20] },
            
            // === ВСТУП ===
            { text: '1. ЗАГАЛЬНА ХАРАКТЕРИСТИКА', style: 'sectionTitle' },
            { 
                text: [
                    `На території ${councilName} обліковується `,
                    { text: `${totalParcels} земельних ділянок`, bold: true },
                    ` загальною площею `,
                    { text: `${totalArea.toFixed(2)} га`, bold: true },
                    `. Загальна нормативна грошова оцінка земель становить `,
                    { text: `${formatNumber(totalNGO)} грн`, bold: true },
                    '.'
                ],
                style: 'paragraph',
                margin: [0, 10, 0, 10]
            },
            {
                text: [
                    `Станом на звітну дату `,
                    { text: `${rentedArea.toFixed(2)} га (${rentedPercent}%)`, bold: true },
                    ` земель перебуває в оренді у `,
                    { text: `${tenantsCount} орендарів`, bold: true },
                    `. Вільними від договорів оренди залишаються `,
                    { text: `${freeParcels} ділянок`, bold: true },
                    ` площею `,
                    { text: `${freeArea.toFixed(2)} га (${freePercent}%)`, bold: true, color: '#10B981' },
                    '.'
                ],
                style: 'paragraph',
                margin: [0, 0, 0, 15]
            },
            
            // === СТАН ДОГОВОРІВ ===
            { text: '2. СТАН ДОГОВОРІВ ОРЕНДИ', style: 'sectionTitle' },
            expiredCount > 0 ? {
                text: [
                    { text: 'УВАГА! ', bold: true, color: '#EF4444' },
                    `Виявлено `,
                    { text: `${expiredCount} прострочених договорів`, bold: true, color: '#EF4444' },
                    ` загальною площею `,
                    { text: `${expiredArea.toFixed(2)} га`, bold: true, color: '#EF4444' },
                    `. Ці договори потребують негайного переукладення або пролонгації.`
                ],
                style: 'paragraph',
                margin: [0, 10, 0, 10]
            } : { text: 'Прострочених договорів не виявлено.', style: 'paragraph', margin: [0, 10, 0, 10] },
            
            { text: 'Графік завершення діючих договорів оренди:', style: 'paragraphBold', margin: [0, 5, 0, 5] },
            {
                table: {
                    widths: ['15%', '25%', '25%', '35%'],
                    body: [
                        [
                            { text: 'Рік', style: 'tableHeader', fillColor: '#F3F4F6' },
                            { text: 'Кількість договорів', style: 'tableHeader', fillColor: '#F3F4F6' },
                            { text: 'Площа (га)', style: 'tableHeader', fillColor: '#F3F4F6' },
                            { text: 'Примітка', style: 'tableHeader', fillColor: '#F3F4F6' }
                        ],
                        ...futureYearsData.slice(0, 6).map(d => {
                            const isCurrent = d.year === currentYear;
                            const note = isCurrent ? 'Поточний рік — пріоритет!' : (d.year === currentYear + 1 ? 'Підготувати до пролонгації' : '');
                            return [
                                { text: `${d.year}`, style: isCurrent ? 'tableCellBold' : 'tableCell', color: isCurrent ? '#D97706' : '#1F2937' },
                                { text: `${d.count}`, style: 'tableCell', alignment: 'center' },
                                { text: `${d.area.toFixed(2)}`, style: 'tableCell', alignment: 'center' },
                                { text: note, style: 'tableCellNote', color: isCurrent ? '#D97706' : '#6B7280' }
                            ];
                        })
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#E5E7EB',
                    vLineColor: () => '#E5E7EB'
                },
                margin: [0, 5, 0, 15]
            },
            
            // === ПОТЕНЦІАЛ ===
            { text: '3. ПОТЕНЦІАЛ ДЛЯ УКЛАДЕННЯ НОВИХ ДОГОВОРІВ', style: 'sectionTitle' },
            {
                text: [
                    `Загальний потенціал для укладення нових договорів оренди оцінюється у `,
                    { text: `${totalPotentialArea.toFixed(2)} га`, bold: true, color: '#10B981' },
                    `, що складається з:`
                ],
                style: 'paragraph',
                margin: [0, 10, 0, 5]
            },
            {
                ul: [
                    `Вільні від оренди ділянки: ${freeParcels} шт. (${freeArea.toFixed(2)} га)`,
                    newOwnersCount > 0 ? `Нові власники без договорів (за останні 3 роки): ${newOwnersCount} шт. (${newOwnersArea.toFixed(2)} га)` : null,
                    expiredCount > 0 ? `Прострочені договори: ${expiredCount} шт. (${expiredArea.toFixed(2)} га)` : null,
                    `Договори, що завершуються у ${currentYear}: ${currentYearData.count} шт. (${currentYearData.area.toFixed(2)} га)`,
                    `Договори, що завершуються у ${currentYear + 1}: ${nextYearData.count} шт. (${nextYearData.area.toFixed(2)} га)`
                ].filter(Boolean),
                style: 'listItem',
                margin: [20, 5, 0, 15]
            },
            
            // === МАТРИЦЯ ОРЕНДАРІВ (з ЄДРПОУ та маркуванням своїх) ===
            { text: '4. МАТРИЦЯ ЗАВЕРШЕННЯ ДОГОВОРІВ ПО ОРЕНДАРЯХ', style: 'sectionTitle', pageBreak: 'before' },
            {
                text: isPersonalized 
                    ? 'Нижче наведено розподіл площ завершення договорів. Ваші підприємства виділено зеленим кольором, конкуренти — сірим.'
                    : 'Нижче наведено розподіл площ завершення договорів для основних орендарів по роках.',
                style: 'paragraph',
                margin: [0, 10, 0, 10]
            },
            matrixData.length > 0 ? {
                table: {
                    widths: ['28%', '12%', ...matrixYears.map(() => '*'), '10%'],
                    body: [
                        // Заголовок
                        [
                            { text: 'Орендар', style: 'tableHeader', fillColor: '#1F2937', color: 'white' },
                            { text: 'ЄДРПОУ', style: 'tableHeader', fillColor: '#1F2937', color: 'white', alignment: 'center' },
                            ...matrixYears.map(y => ({ 
                                text: `${y}`, 
                                style: 'tableHeader', 
                                fillColor: y === currentYear ? '#D97706' : '#374151', 
                                color: 'white',
                                alignment: 'center'
                            })),
                            { text: 'Всього', style: 'tableHeader', fillColor: '#1F2937', color: 'white', alignment: 'center' }
                        ],
                        // Дані орендарів
                        ...matrixData.map((row, idx) => {
                            const bgColor = row.isMy ? '#ECFDF5' : (idx % 2 === 0 ? '#F9FAFB' : 'white');
                            const nameColor = row.isMy ? '#059669' : '#1F2937';
                            return [
                                { text: row.name.length > 22 ? row.name.substring(0, 22) + '...' : row.name, style: row.isMy ? 'tableCellBold' : 'tableCell', fillColor: bgColor, color: nameColor },
                                { text: row.edrpou || '-', style: 'tableCell', fillColor: bgColor, alignment: 'center', fontSize: 7 },
                                ...matrixYears.map(y => ({ 
                                    text: row.years[y] > 0 ? row.years[y].toFixed(1) : '-', 
                                    style: 'tableCell', 
                                    alignment: 'center',
                                    fillColor: bgColor,
                                    color: row.years[y] > 0 ? (y === currentYear ? '#D97706' : '#1F2937') : '#9CA3AF'
                                })),
                                { text: row.total.toFixed(1), style: 'tableCellBold', alignment: 'center', fillColor: bgColor, color: row.isMy ? '#059669' : '#1F2937' }
                            ];
                        }),
                        // Підсумок
                        [
                            { text: 'ВСЬОГО по роках:', style: 'tableCellBold', fillColor: '#E5E7EB', colSpan: 2 }, {},
                            ...matrixYears.map(y => ({ 
                                text: yearTotals[y] > 0 ? yearTotals[y].toFixed(1) : '-', 
                                style: 'tableCellBold', 
                                alignment: 'center',
                                fillColor: '#E5E7EB',
                                color: y === currentYear ? '#D97706' : '#1F2937'
                            })),
                            { text: `${rentedArea.toFixed(1)}`, style: 'tableCellBold', alignment: 'center', fillColor: '#10B981', color: 'white' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#D1D5DB',
                    vLineColor: () => '#D1D5DB'
                },
                margin: [0, 5, 0, 15]
            } : { text: 'Немає даних для формування матриці.', style: 'paragraph' },
            
            // === ОСНОВНІ ОРЕНДАРІ (з ЄДРПОУ та маркуванням своїх) ===
            { text: '5. ХАРАКТЕРИСТИКА ОСНОВНИХ ОРЕНДАРІВ', style: 'sectionTitle' },
            {
                text: isPersonalized 
                    ? `На території ради діє ${tenantsCount} орендарів. Ваші підприємства: ${myTenantsData.length} (${myTotalArea.toFixed(2)} га). Конкуренти: ${competitorsData.length} (${competitorsTotalArea.toFixed(2)} га).`
                    : `На території ради діє ${tenantsCount} орендарів. Нижче наведено перелік найбільших за площею оренди:`,
                style: 'paragraph',
                margin: [0, 10, 0, 10]
            },
            topTenants.length > 0 ? {
                table: {
                    widths: ['4%', '35%', '14%', '15%', '10%', '10%', '12%'],
                    body: [
                        [
                            { text: '№', style: 'tableHeader', fillColor: '#F3F4F6' },
                            { text: 'Назва орендаря', style: 'tableHeader', fillColor: '#F3F4F6' },
                            { text: 'ЄДРПОУ', style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' },
                            { text: 'Площа', style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'right' },
                            { text: 'Частка', style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'right' },
                            { text: 'Діл.', style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'right' },
                            { text: isPersonalized ? 'Статус' : 'НГО', style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'right' }
                        ],
                        ...topTenants.map((tenant, index) => {
                            const percent = rentedArea > 0 ? (tenant.area / rentedArea * 100).toFixed(1) : 0;
                            const bgColor = tenant.isMy ? '#ECFDF5' : (index % 2 === 0 ? '#F9FAFB' : 'white');
                            const nameColor = tenant.isMy ? '#059669' : '#1F2937';
                            return [
                                { text: `${index + 1}`, style: 'tableCell', fillColor: bgColor },
                                { text: tenant.name.length > 28 ? tenant.name.substring(0, 28) + '...' : tenant.name, style: tenant.isMy ? 'tableCellBold' : 'tableCell', fillColor: bgColor, color: nameColor },
                                { text: tenant.edrpou || '-', style: 'tableCell', fillColor: bgColor, alignment: 'center', fontSize: 7 },
                                { text: `${tenant.area.toFixed(2)} га`, style: 'tableCell', fillColor: bgColor, alignment: 'right' },
                                { text: `${percent}%`, style: 'tableCell', fillColor: bgColor, alignment: 'right' },
                                { text: `${tenant.count}`, style: 'tableCell', fillColor: bgColor, alignment: 'right' },
                                isPersonalized 
                                    ? { text: tenant.isMy ? 'ВАШ' : 'Конкурент', style: 'tableCell', fillColor: bgColor, alignment: 'right', color: tenant.isMy ? '#059669' : '#9CA3AF', fontSize: 8 }
                                    : { text: formatNumber(tenant.ngo || 0), style: 'tableCell', fillColor: bgColor, alignment: 'right', fontSize: 7 }
                            ];
                        })
                    ]
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: () => '#E5E7EB'
                },
                margin: [0, 5, 0, 15]
            } : { text: 'Дані про орендарів відсутні.', style: 'paragraph' },
            
            // === ПЕРСОНАЛІЗОВАНА СТРАТЕГІЯ (якщо обрано свої підприємства) ===
            ...(isPersonalized ? [
                { text: '6. СТРАТЕГІЯ РОЗВИТКУ ЗЕМЕЛЬНОГО БАНКУ', style: 'sectionTitle', pageBreak: 'before' },
                
                // Захист свого банку
                { text: '6.1. Захист існуючого земельного банку', style: 'subsectionTitle', margin: [0, 10, 0, 5] },
                {
                    text: [
                        `Ваш поточний земельний банк: `,
                        { text: `${myTotalArea.toFixed(2)} га`, bold: true, color: '#10B981' },
                        ` (${myTotalCount} ділянок). `,
                        `Для збереження цих площ необхідно своєчасно пролонгувати договори, що завершуються.`
                    ],
                    style: 'paragraph',
                    margin: [0, 5, 0, 10]
                },
                Object.keys(myExpiringByYear).length > 0 ? {
                    table: {
                        widths: ['25%', '25%', '25%', '25%'],
                        body: [
                            [
                                { text: 'Рік', style: 'tableHeader', fillColor: '#10B981', color: 'white' },
                                { text: 'Договорів', style: 'tableHeader', fillColor: '#10B981', color: 'white', alignment: 'center' },
                                { text: 'Площа (га)', style: 'tableHeader', fillColor: '#10B981', color: 'white', alignment: 'center' },
                                { text: 'Пріоритет', style: 'tableHeader', fillColor: '#10B981', color: 'white', alignment: 'center' }
                            ],
                            ...Object.entries(myExpiringByYear)
                                .filter(([_, d]) => d.count > 0)
                                .map(([year, d]) => {
                                    const y = parseInt(year);
                                    const priority = y === currentYear ? 'ТЕРМІНОВО!' : (y === currentYear + 1 ? 'Високий' : 'Середній');
                                    const priorityColor = y === currentYear ? '#EF4444' : (y === currentYear + 1 ? '#D97706' : '#6B7280');
                                    return [
                                        { text: year, style: y === currentYear ? 'tableCellBold' : 'tableCell', color: y === currentYear ? '#EF4444' : '#1F2937' },
                                        { text: `${d.count}`, style: 'tableCell', alignment: 'center' },
                                        { text: `${d.area.toFixed(2)}`, style: 'tableCell', alignment: 'center' },
                                        { text: priority, style: 'tableCellBold', alignment: 'center', color: priorityColor, fontSize: 8 }
                                    ];
                                })
                        ]
                    },
                    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#D1D5DB', vLineColor: () => '#D1D5DB' },
                    margin: [0, 5, 0, 15]
                } : { text: 'У вас немає договорів, що завершуються найближчим часом.', style: 'paragraph', color: '#10B981' },
                
                // Потенціал росту
                { text: '6.2. Потенціал збільшення земельного банку', style: 'subsectionTitle', margin: [0, 15, 0, 5] },
                {
                    text: 'Для розширення земельного банку рекомендується звернути увагу на наступні джерела:',
                    style: 'paragraph',
                    margin: [0, 5, 0, 10]
                },
                {
                    ol: [
                        freeArea > 0 ? { text: `Вільні від оренди ділянки: ${freeParcels} шт. загальною площею ${freeArea.toFixed(2)} га. Це найпростіший спосіб збільшення банку без конкуренції.`, style: 'listItem', color: '#10B981' } : null,
                        newOwnersCount > 0 ? { text: `Нові власники (зареєстровані за останні 3 роки): ${newOwnersCount} ділянок площею ${newOwnersArea.toFixed(2)} га. Ці власники ще не мають договорів і відкриті до пропозицій.`, style: 'listItem', color: '#F97316' } : null,
                        ...Object.entries(competitorsExpiringByYear)
                            .filter(([_, d]) => d.area > 0)
                            .slice(0, 3)
                            .map(([year, d]) => ({ 
                                text: `Договори конкурентів, що завершуються у ${year}: ${d.count} шт. (${d.area.toFixed(2)} га). Можливість переукласти на вашу користь.`, 
                                style: 'listItem', 
                                color: parseInt(year) === currentYear ? '#EF4444' : '#6B7280' 
                            }))
                    ].filter(Boolean),
                    margin: [20, 5, 0, 15]
                },
                
                // Загальний потенціал
                {
                    text: [
                        `Загальний потенціал росту: `,
                        { text: `${(freeArea + newOwnersArea + Object.values(competitorsExpiringByYear).reduce((sum, d) => sum + d.area, 0)).toFixed(2)} га`, bold: true, color: '#10B981' },
                        `. При успішній реалізації стратегії ваш земельний банк може зрости до `,
                        { text: `${(myTotalArea + freeArea + newOwnersArea).toFixed(2)} га`, bold: true, color: '#10B981' },
                        ` (без урахування конкурентних площ).`
                    ],
                    style: 'paragraph',
                    margin: [0, 10, 0, 15],
                    background: '#ECFDF5',
                    padding: 10
                }
            ] : [
                // Звичайні рекомендації якщо немає персоналізації
                { text: '6. ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ', style: 'sectionTitle' },
                { text: 'На підставі проведеного аналізу рекомендується:', style: 'paragraphBold', margin: [0, 10, 0, 5] },
                {
                    ol: [
                        expiredCount > 0 ? { text: `Терміново провести роботу з переукладення ${expiredCount} прострочених договорів оренди загальною площею ${expiredArea.toFixed(2)} га.`, style: 'listItem', color: '#EF4444' } : null,
                        currentYearData.count > 0 ? { text: `До кінця ${currentYear} року забезпечити пролонгацію ${currentYearData.count} договорів, термін дії яких завершується (${currentYearData.area.toFixed(2)} га).`, style: 'listItem', color: '#D97706' } : null,
                        nextYearData.count > 0 ? { text: `Розпочати підготовчу роботу щодо ${nextYearData.count} договорів, що завершуються у ${currentYear + 1} році (${nextYearData.area.toFixed(2)} га).`, style: 'listItem' } : null,
                        newOwnersCount > 0 ? { text: `Провести роботу з ${newOwnersCount} новими власниками земельних ділянок щодо укладення договорів оренди (${newOwnersArea.toFixed(2)} га).`, style: 'listItem', color: '#10B981' } : null,
                        freeParcels > 0 ? { text: `Опрацювати можливість укладення договорів на ${freeParcels} вільних ділянок загальною площею ${freeArea.toFixed(2)} га.`, style: 'listItem', color: '#10B981' } : null
                    ].filter(Boolean),
                    margin: [20, 5, 0, 20]
                }
            ]),
            
            // === ПІДПИС ===
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#10B981' }], margin: [0, 20, 0, 15] },
            {
                columns: [
                    { 
                        stack: [
                            { text: 'Довідку підготовлено автоматично', style: 'footerNote' },
                            { text: 'на основі даних Державного земельного кадастру', style: 'footerNote' }
                        ]
                    },
                    { 
                        stack: [
                            { text: 'АГРО-ПРОСТІР', style: 'brandLogo', alignment: 'right' },
                            { text: 'agro-prostir.com.ua', style: 'brandUrl', alignment: 'right' }
                        ]
                    }
                ]
            }
        ],
        
        styles: {
            mainTitle: { fontSize: 20, bold: true, color: '#1F2937' },
            subtitle: { fontSize: 11, color: '#6B7280', margin: [0, 5, 0, 0] },
            councilName: { fontSize: 14, bold: true, color: '#10B981' },
            dateText: { fontSize: 10, color: '#6B7280' },
            sectionTitle: { fontSize: 12, bold: true, color: '#1F2937', margin: [0, 15, 0, 5] },
            subsectionTitle: { fontSize: 11, bold: true, color: '#374151', margin: [0, 10, 0, 5] },
            paragraph: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
            paragraphBold: { fontSize: 10, bold: true, color: '#1F2937', lineHeight: 1.4 },
            listItem: { fontSize: 10, color: '#374151', lineHeight: 1.3 },
            tableHeader: { fontSize: 9, bold: true, color: '#374151' },
            tableCell: { fontSize: 9, color: '#1F2937' },
            tableCellBold: { fontSize: 9, bold: true, color: '#1F2937' },
            tableCellNote: { fontSize: 8, italics: true },
            footerNote: { fontSize: 8, color: '#9CA3AF' },
            brandLogo: { fontSize: 12, bold: true, color: '#10B981' },
            brandUrl: { fontSize: 9, color: '#6B7280' },
            headerBrand: { fontSize: 9, bold: true, color: '#10B981' },
            headerPage: { fontSize: 9, color: '#9CA3AF' },
            footerText: { fontSize: 8, color: '#9CA3AF' }
        }
    };
    
    // Назва файлу залежить від персоналізації
    const fileType = isPersonalized ? 'Стратегічна_довідка' : 'Аналітична_довідка';
    const fileName = `${fileType}_${councilName.replace(/[^а-яА-Яa-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
}

// Форматування чисел
function formatNumber(num) {
    if (!num) return '0';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Індикатор завантаження
function showReportLoading(show) {
    // Можна додати спіннер
    const btns = document.querySelectorAll('.btn-report');
    btns.forEach(btn => {
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Генерація...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-file-earmark-pdf me-1"></i>Довідка';
        }
    });
}

// Експорт для глобального доступу
window.generateCouncilReport = generateCouncilReport;
window.generateReportFromStats = generateReportFromStats;
