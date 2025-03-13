class CoatuuLoader {
    constructor() {
        this.data = null;
        // Список тимчасово заблокованих областей
        this.blockedAreas = [
            'Автономна Республіка Крим',
            'м.Севастополь',
            'Донецька Область',
            'Луганська Область',
            'Херсонська Область',
            'Запорізька Область',
            'М.Севастополь',
            'Харківська область',
            'м.Київ'
            // Додайте або видаліть області за потребою
        ];
    }

    async loadData() {
        try {
            const response = await fetch('data/coatuu.csv');
            const text = await response.text();
            this.data = this.parseCSV(text);
            return this.data;
        } catch (error) {
            console.error('Error loading COATUU data:', error);
            throw error;
        }
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header.trim()] = values[index]?.trim() || '';
                return obj;
            }, {});
        });
    }

    getAreas() {
        if (!this.data) return [];
        // Фільтруємо області, виключаючи заблоковані
        return [...new Set(
            this.data
                .map(item => item.nameobl)
                .filter(area => !this.blockedAreas.includes(area))
        )];
    }

    getDistricts(area) {
        if (!this.data) return [];
        return [...new Set(
            this.data
                .filter(item => item.nameobl === area)
                .map(item => item.namerayon)
        )];
    }

    getVillageCouncils(area, district) {
        if (!this.data) return [];
        return [...new Set(
            this.data
                .filter(item => item.nameobl === area && item.namerayon === district)
                .map(item => item.namesr)
        )];
    }
}
