// Конфігурація Supabase
const SUPABASE_URL = 'https://jkoxvjaxjljijhiztmlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb3h2amF4amxqaWpoaXp0bWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODA3NzcsImV4cCI6MjA1MDQ1Njc3N30.PEm1iG4mppgoB3CjBtBN3y2iqtOfWYfY091o1TJ9-nA';

// Ініціалізація Supabase клієнта
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Генерування GUID для користувача
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// При завантаженні сторінки
document.addEventListener('DOMContentLoaded', async function() {
    // Перевіряємо чи завантажився SDK
    if (!window.supabase) {
        console.error('Supabase SDK not loaded');
        return;
    }

    // Ініціалізуємо клієнт

    // Генеруємо або отримуємо існуючий GUID
    let userGuid = localStorage.getItem('userGuid');
    if (!userGuid) {
        userGuid = generateGUID();
        localStorage.setItem('userGuid', userGuid);
    }
    document.getElementById('user_guid').value = userGuid;

    // Ініціалізуємо завантажувач КОАТУУ
    const coatuuLoader = new CoatuuLoader();
    
    try {
        await coatuuLoader.loadData();
        
        // Заповнюємо список областей
        const areaSelect = document.getElementById('area');
        
        // Додаємо всі області, включаючи заблоковані
        const allAreas = [...new Set(coatuuLoader.data.map(item => item.nameobl))];
        allAreas.sort().forEach(area => {
            const option = new Option(area, area);
            if (coatuuLoader.blockedAreas.includes(area)) {
                option.disabled = true;
                option.className = 'text-danger';
                option.text = `${area} (тимчасово недоступно)`;
            }
            areaSelect.add(option);
        });

        // Обробник зміни області
        areaSelect.addEventListener('change', function() {
            const districtSelect = document.getElementById('district');
            const villageSelect = document.getElementById('village_council');
            
            districtSelect.innerHTML = '<option value="">Виберіть район</option>';
            villageSelect.innerHTML = '<option value="">Виберіть сільську раду</option>';
            
            if (this.value) {
                const districts = coatuuLoader.getDistricts(this.value);
                districts.forEach(district => {
                    const option = new Option(district, district);
                    districtSelect.add(option);
                });
                districtSelect.disabled = false;
                villageSelect.disabled = true;
            } else {
                districtSelect.disabled = true;
                villageSelect.disabled = true;
            }
        });

        // Обробник зміни району
        document.getElementById('district').addEventListener('change', function() {
            const area = document.getElementById('area').value;
            const villageSelect = document.getElementById('village_council');
            
            villageSelect.innerHTML = '<option value="">Виберіть сільську раду</option>';
            
            if (this.value) {
                const villages = coatuuLoader.getVillageCouncils(area, this.value);
                villages.forEach(village => {
                    const option = new Option(village, village);
                    villageSelect.add(option);
                });
                villageSelect.disabled = false;
            } else {
                villageSelect.disabled = true;
            }
        });

    } catch (error) {
        console.error('Error initializing COATUU data:', error);
        alert('Помилка завантаження довідника адрес. Спробуйте оновити сторінку.');
    }

    // Обробка подання форми
    document.getElementById('business-info-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Відправляємо...';

        try {
            const formData = {
                area: document.getElementById('area').value,
                district: document.getElementById('district').value,
                village_council: document.getElementById('village_council').value,
                user_guid: document.getElementById('user_guid').value,
                business_name: document.getElementById('business_name').value,
                contact_person: document.getElementById('contact_person').value,
                phone: document.getElementById('phone').value,
                note: document.getElementById('note').value
            };

            const { data, error } = await supabaseClient
                .from('business_info')
                .insert([formData]);

            if (error) throw error;

            // Success
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            modal.hide();
            
            alert('Дякуємо! Ваше замовлення прийнято. Ми зв\'яжемося з вами найближчим часом.');
            event.target.reset();

        } catch (error) {
            console.error('Error:', error);
            alert('Помилка при відправці даних. Будь ласка, спробуйте пізніше.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Відправити';
        }
    });
});
