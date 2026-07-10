// Data Storage
let departments = JSON.parse(localStorage.getItem('departments')) || [];
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
let requests = JSON.parse(localStorage.getItem('requests')) || [];

// Initialize with sample data if empty
if (departments.length === 0) {
    initializeSampleData();
}

// Charts
let departmentChart, monthlyChart, dailyExitChart, statusChart, requestsDeptChart;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeFilters();
    initializeForms();
    updateDashboard();
    renderDepartments();
    renderVehicles();
    renderRequests();
    initializeCharts();
    updateAnalytics();
});

// Initialize Sample Data
function initializeSampleData() {
    // Create departments with 3-19 vehicles each
    const deptNames = [
        'Администрация', 'Логистика', 'Техническая служба', 'Сбыт', 
        'Склад', 'Охрана', 'Бухгалтерия', 'IT отдел',
        'Производство', 'Маркетинг', 'HR отдел', 'Юридический отдел'
    ];
    
    let vehicleIdCounter = 1;
    deptNames.forEach((name, index) => {
        const vehicleCount = Math.floor(Math.random() * 17) + 3; // 3-19
        const dept = {
            id: Date.now() + index,
            name: name,
            vehicleCount: vehicleCount
        };
        departments.push(dept);
        
        // Create vehicles for this department
        for (let i = 0; i < vehicleCount; i++) {
            const inRepair = Math.random() < 0.15; // 15% chance of being in repair
            vehicles.push({
                id: vehicleIdCounter++,
                plate: generatePlateNumber(),
                model: getRandomVehicleModel(),
                departmentId: dept.id,
                inRepair: inRepair
            });
        }
    });
    
    // Ensure total is 160
    while (vehicles.length < 160) {
        const randomDept = departments[Math.floor(Math.random() * departments.length)];
        vehicles.push({
            id: vehicleIdCounter++,
            plate: generatePlateNumber(),
            model: getRandomVehicleModel(),
            departmentId: randomDept.id,
            inRepair: Math.random() < 0.15
        });
    }
    
    // Trim to exactly 160
    vehicles = vehicles.slice(0, 160);
    
    // Generate sample requests for the last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate 5-15 requests per day
        const dailyRequests = Math.floor(Math.random() * 11) + 5;
        for (let j = 0; j < dailyRequests; j++) {
            const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            const statuses = ['approved', 'approved', 'approved', 'rejected', 'pending'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            requests.push({
                id: Date.now() + Math.random() * 1000000,
                date: date.toISOString().split('T')[0],
                vehicleId: randomVehicle.id,
                departmentId: randomVehicle.departmentId,
                status: status,
                purpose: getRandomPurpose()
            });
        }
    }
    
    saveData();
}

function generatePlateNumber() {
    const letters = 'АВЕКМНОРСТУХ';
    const region = Math.floor(Math.random() * 99) + 1;
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const letter3 = letters[Math.floor(Math.random() * letters.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${letter1}${number.toString().padStart(3, '0')}${letter2}${letter3}${region.toString().padStart(2, '0')}`;
}

function getRandomVehicleModel() {
    const models = [
        'Toyota Camry', 'Toyota Corolla', 'Toyota Hilux',
        'Volkswagen Polo', 'Volkswagen Tiguan',
        'Hyundai Solaris', 'Hyundai Tucson',
        'Kia Rio', 'Kia Sportage',
        'Lada Vesta', 'Lada Granta',
        'UAZ Patriot', 'GAZelle',
        'Mercedes-Benz E-Class', 'BMW 5 Series',
        'Ford Transit', 'Renault Duster'
    ];
    return models[Math.floor(Math.random() * models.length)];
}

function getRandomPurpose() {
    const purposes = [
        'Служебная поездка', 'Доставка грузов', 'Встреча партнеров',
        'Командировка', 'Техническое обслуживание', 'Перевозка сотрудников',
        'Маршрутный рейс', 'Экскурсия', 'Перевозка оборудования'
    ];
    return purposes[Math.floor(Math.random() * purposes.length)];
}

// Navigation
function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    
    const pageTitles = {
        'dashboard': 'Дашборд',
        'departments': 'Подразделения',
        'vehicles': 'Транспорт',
        'requests': 'Заявки',
        'analytics': 'Аналитика'
    };
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');
            
            pageTitle.textContent = pageTitles[page];
            
            if (page === 'analytics') {
                updateAnalytics();
            }
        });
    });
}

// Filters
function initializeFilters() {
    const deptFilter = document.getElementById('department-filter');
    const analyticsDept = document.getElementById('analytics-department');
    const dateFilter = document.getElementById('date-filter');
    
    // Set today's date
    dateFilter.value = new Date().toISOString().split('T')[0];
    
    // Populate department filters
    updateDepartmentFilters();
    
    deptFilter.addEventListener('change', updateDashboard);
    analyticsDept.addEventListener('change', updateAnalytics);
    dateFilter.addEventListener('change', updateDashboard);
    
    document.getElementById('analytics-period').addEventListener('change', updateAnalytics);
}

function updateDepartmentFilters() {
    const deptFilter = document.getElementById('department-filter');
    const analyticsDept = document.getElementById('analytics-department');
    const vehicleDept = document.getElementById('vehicle-department');
    const requestDept = document.getElementById('request-department');
    
    const options = '<option value="all">Все подразделения</option>' + 
        departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    
    deptFilter.innerHTML = options;
    analyticsDept.innerHTML = options;
    
    if (vehicleDept) {
        vehicleDept.innerHTML = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
    
    if (requestDept) {
        requestDept.innerHTML = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
}

// Forms
function initializeForms() {
    document.getElementById('department-form').addEventListener('submit', handleDepartmentSubmit);
    document.getElementById('vehicle-form').addEventListener('submit', handleVehicleSubmit);
    document.getElementById('request-form').addEventListener('submit', handleRequestSubmit);
    
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeAllModals();
        }
    });
    
    // Set default date for request form
    document.getElementById('request-date').value = new Date().toISOString().split('T')[0];
}

// Dashboard
function updateDashboard() {
    const deptFilter = document.getElementById('department-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    let filteredVehicles = vehicles;
    let filteredRequests = requests;
    
    if (deptFilter !== 'all') {
        filteredVehicles = vehicles.filter(v => v.departmentId === parseInt(deptFilter));
        filteredRequests = requests.filter(r => r.departmentId === parseInt(deptFilter));
    }
    
    // KPI calculations
    const totalVehicles = filteredVehicles.length;
    const inRepair = filteredVehicles.filter(v => v.inRepair).length;
    
    const todayRequests = filteredRequests.filter(r => r.date === dateFilter);
    const withRequests = todayRequests.length;
    const withoutRequests = totalVehicles - inRepair - withRequests;
    const rejected = todayRequests.filter(r => r.status === 'rejected').length;
    
    const approvedToday = todayRequests.filter(r => r.status === 'approved').length;
    const availableToday = totalVehicles - inRepair;
    const exitRate = availableToday > 0 ? ((approvedToday / availableToday) * 100).toFixed(1) : 0;
    
    // Update KPI cards
    document.getElementById('total-vehicles').textContent = totalVehicles;
    document.getElementById('in-repair').textContent = inRepair;
    document.getElementById('with-requests').textContent = withRequests;
    document.getElementById('without-requests').textContent = Math.max(0, withoutRequests);
    document.getElementById('rejected').textContent = rejected;
    document.getElementById('exit-rate').textContent = `${exitRate}%`;
    
    // Update recent requests table
    updateRecentRequests(filteredRequests);
    
    // Update charts
    updateCharts(deptFilter);
}

function updateRecentRequests(filteredRequests) {
    const tbody = document.getElementById('recent-requests');
    const recent = filteredRequests
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    tbody.innerHTML = recent.map(r => {
        const vehicle = vehicles.find(v => v.id === r.vehicleId);
        const dept = departments.find(d => d.id === r.departmentId);
        const statusClass = `status-${r.status}`;
        const statusText = {
            'approved': 'Одобрено',
            'rejected': 'Отклонено',
            'pending': 'Ожидает'
        }[r.status];
        
        return `
            <tr>
                <td>${formatDate(r.date)}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td>${vehicle ? vehicle.plate : 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${r.status === 'approved' ? '✓' : '✗'}</td>
            </tr>
        `;
    }).join('');
}

// Departments
function renderDepartments() {
    const grid = document.getElementById('departments-grid');
    
    grid.innerHTML = departments.map(dept => {
        const deptVehicles = vehicles.filter(v => v.departmentId === dept.id);
        const inRepair = deptVehicles.filter(v => v.inRepair).length;
        const available = deptVehicles.length - inRepair;
        
        const today = new Date().toISOString().split('T')[0];
        const todayRequests = requests.filter(r => 
            r.departmentId === dept.id && r.date === today
        );
        const approvedToday = todayRequests.filter(r => r.status === 'approved').length;
        const exitRate = available > 0 ? ((approvedToday / available) * 100).toFixed(1) : 0;
        
        return `
            <div class="department-card">
                <h3>${dept.name}</h3>
                <div class="department-stats">
                    <div class="stat-item">
                        <div class="stat-label">Всего ТС</div>
                        <div class="stat-value">${deptVehicles.length}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">На ремонте</div>
                        <div class="stat-value">${inRepair}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Доступно</div>
                        <div class="stat-value">${available}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Выход сегодня</div>
                        <div class="stat-value">${exitRate}%</div>
                    </div>
                </div>
                <div class="department-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editDepartment(${dept.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
}

function openDepartmentModal(id = null) {
    const modal = document.getElementById('department-modal');
    const overlay = document.getElementById('modal-overlay');
    
    document.getElementById('department-form').reset();
    document.getElementById('dept-id').value = '';
    
    if (id) {
        const dept = departments.find(d => d.id === id);
        document.getElementById('dept-id').value = dept.id;
        document.getElementById('dept-name').value = dept.name;
        document.getElementById('dept-vehicle-count').value = dept.vehicleCount;
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function editDepartment(id) {
    openDepartmentModal(id);
}

function deleteDepartment(id) {
    if (confirm('Удалить подразделение и весь связанный транспорт?')) {
        departments = departments.filter(d => d.id !== id);
        vehicles = vehicles.filter(v => v.departmentId !== id);
        requests = requests.filter(r => r.departmentId !== id);
        saveData();
        renderDepartments();
        updateDashboard();
        updateDepartmentFilters();
    }
}

function handleDepartmentSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('dept-id').value;
    const name = document.getElementById('dept-name').value;
    const vehicleCount = parseInt(document.getElementById('dept-vehicle-count').value);
    
    if (id) {
        const dept = departments.find(d => d.id === parseInt(id));
        dept.name = name;
        dept.vehicleCount = vehicleCount;
    } else {
        departments.push({
            id: Date.now(),
            name: name,
            vehicleCount: vehicleCount
        });
    }
    
    saveData();
    closeAllModals();
    renderDepartments();
    updateDashboard();
    updateDepartmentFilters();
}

// Vehicles
function renderVehicles() {
    const tbody = document.getElementById('vehicles-table');
    
    tbody.innerHTML = vehicles.map(v => {
        const dept = departments.find(d => d.id === v.departmentId);
        const statusClass = v.inRepair ? 'status-in-repair' : 'status-available';
        const statusText = v.inRepair ? 'В ремонте' : 'Доступен';
        
        return `
            <tr>
                <td>${v.plate}</td>
                <td>${v.model}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${v.inRepair ? 'Да' : 'Нет'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editVehicle(${v.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${v.id})">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openVehicleModal(id = null) {
    const modal = document.getElementById('vehicle-modal');
    const overlay = document.getElementById('modal-overlay');
    
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-id').value = '';
    updateDepartmentFilters();
    
    if (id) {
        const vehicle = vehicles.find(v => v.id === id);
        document.getElementById('vehicle-id').value = vehicle.id;
        document.getElementById('vehicle-plate').value = vehicle.plate;
        document.getElementById('vehicle-model').value = vehicle.model;
        document.getElementById('vehicle-department').value = vehicle.departmentId;
        document.getElementById('vehicle-in-repair').checked = vehicle.inRepair;
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function editVehicle(id) {
    openVehicleModal(id);
}

function deleteVehicle(id) {
    if (confirm('Удалить транспортное средство?')) {
        vehicles = vehicles.filter(v => v.id !== id);
        requests = requests.filter(r => r.vehicleId !== id);
        saveData();
        renderVehicles();
        updateDashboard();
    }
}

function handleVehicleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('vehicle-id').value;
    const plate = document.getElementById('vehicle-plate').value;
    const model = document.getElementById('vehicle-model').value;
    const departmentId = parseInt(document.getElementById('vehicle-department').value);
    const inRepair = document.getElementById('vehicle-in-repair').checked;
    
    if (id) {
        const vehicle = vehicles.find(v => v.id === parseInt(id));
        vehicle.plate = plate;
        vehicle.model = model;
        vehicle.departmentId = departmentId;
        vehicle.inRepair = inRepair;
    } else {
        vehicles.push({
            id: Date.now(),
            plate: plate,
            model: model,
            departmentId: departmentId,
            inRepair: inRepair
        });
    }
    
    saveData();
    closeAllModals();
    renderVehicles();
    updateDashboard();
}

// Requests
function renderRequests() {
    const tbody = document.getElementById('requests-table');
    
    tbody.innerHTML = requests.slice().reverse().map(r => {
        const vehicle = vehicles.find(v => v.id === r.vehicleId);
        const dept = departments.find(d => d.id === r.departmentId);
        const statusClass = `status-${r.status}`;
        const statusText = {
            'approved': 'Одобрено',
            'rejected': 'Отклонено',
            'pending': 'Ожидает'
        }[r.status];
        
        return `
            <tr>
                <td>${r.id}</td>
                <td>${formatDate(r.date)}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td>${vehicle ? `${vehicle.plate} (${vehicle.model})` : 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editRequest(${r.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRequest(${r.id})">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openRequestModal(id = null) {
    const modal = document.getElementById('request-modal');
    const overlay = document.getElementById('modal-overlay');
    
    document.getElementById('request-form').reset();
    document.getElementById('request-id').value = '';
    document.getElementById('request-date').value = new Date().toISOString().split('T')[0];
    updateDepartmentFilters();
    
    if (id) {
        const request = requests.find(r => r.id === id);
        document.getElementById('request-id').value = request.id;
        document.getElementById('request-date').value = request.date;
        document.getElementById('request-department').value = request.departmentId;
        loadDepartmentVehicles();
        document.getElementById('request-vehicle').value = request.vehicleId;
        document.getElementById('request-purpose').value = request.purpose || '';
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function editRequest(id) {
    openRequestModal(id);
}

function deleteRequest(id) {
    if (confirm('Удалить заявку?')) {
        requests = requests.filter(r => r.id !== id);
        saveData();
        renderRequests();
        updateDashboard();
    }
}

function loadDepartmentVehicles() {
    const deptId = parseInt(document.getElementById('request-department').value);
    const vehicleSelect = document.getElementById('request-vehicle');
    
    const deptVehicles = vehicles.filter(v => v.departmentId === deptId && !v.inRepair);
    vehicleSelect.innerHTML = deptVehicles.map(v => 
        `<option value="${v.id}">${v.plate} - ${v.model}</option>`
    ).join('');
}

function handleRequestSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('request-id').value;
    const date = document.getElementById('request-date').value;
    const departmentId = parseInt(document.getElementById('request-department').value);
    const vehicleId = parseInt(document.getElementById('request-vehicle').value);
    const purpose = document.getElementById('request-purpose').value;
    
    if (id) {
        const request = requests.find(r => r.id === parseInt(id));
        request.date = date;
        request.departmentId = departmentId;
        request.vehicleId = vehicleId;
        request.purpose = purpose;
    } else {
        requests.push({
            id: Date.now(),
            date: date,
            departmentId: departmentId,
            vehicleId: vehicleId,
            status: 'pending',
            purpose: purpose
        });
    }
    
    saveData();
    closeAllModals();
    renderRequests();
    updateDashboard();
}

// Charts
function initializeCharts() {
    const deptCtx = document.getElementById('department-chart').getContext('2d');
    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    
    departmentChart = new Chart(deptCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Процент выхода',
                data: [],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Выход (%)',
                data: [],
                borderColor: 'rgba(118, 75, 162, 1)',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Analytics charts
    const dailyExitCtx = document.getElementById('daily-exit-chart').getContext('2d');
    const statusCtx = document.getElementById('status-chart').getContext('2d');
    const requestsDeptCtx = document.getElementById('requests-dept-chart').getContext('2d');
    
    dailyExitChart = new Chart(dailyExitCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Процент выхода',
                data: [],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Одобрено', 'Отклонено', 'Ожидает'],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(56, 142, 60, 0.8)',
                    'rgba(211, 47, 47, 0.8)',
                    'rgba(245, 124, 0, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
    
    requestsDeptChart = new Chart(requestsDeptCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 98, 146, 0.8)',
                    'rgba(67, 160, 71, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(3, 169, 244, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateCharts(deptFilter) {
    let filteredDepts = departments;
    let filteredRequests = requests;
    
    if (deptFilter !== 'all') {
        filteredDepts = departments.filter(d => d.id === parseInt(deptFilter));
        filteredRequests = requests.filter(r => r.departmentId === parseInt(deptFilter));
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Department chart
    const deptLabels = filteredDepts.map(d => d.name);
    const deptData = filteredDepts.map(dept => {
        const deptVehicles = vehicles.filter(v => v.departmentId === dept.id);
        const available = deptVehicles.filter(v => !v.inRepair).length;
        const approved = filteredRequests.filter(r => 
            r.departmentId === dept.id && r.date === today && r.status === 'approved'
        ).length;
        return available > 0 ? ((approved / available) * 100).toFixed(1) : 0;
    });
    
    departmentChart.data.labels = deptLabels;
    departmentChart.data.datasets[0].data = deptData;
    departmentChart.update();
    
    // Monthly chart
    const monthlyData = [];
    const monthlyLabels = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        monthlyLabels.push(formatDate(dateStr));
        
        const available = vehicles.filter(v => !v.inRepair).length;
        const approved = filteredRequests.filter(r => 
            r.date === dateStr && r.status === 'approved'
        ).length;
        monthlyData.push(available > 0 ? ((approved / available) * 100).toFixed(1) : 0);
    }
    
    monthlyChart.data.labels = monthlyLabels;
    monthlyChart.data.datasets[0].data = monthlyData;
    monthlyChart.update();
}

// Analytics
function updateAnalytics() {
    const period = document.getElementById('analytics-period').value;
    const deptFilter = document.getElementById('analytics-department').value;
    
    let filteredRequests = requests;
    let filteredDepts = departments;
    
    if (deptFilter !== 'all') {
        filteredRequests = requests.filter(r => r.departmentId === parseInt(deptFilter));
        filteredDepts = departments.filter(d => d.id === parseInt(deptFilter));
    }
    
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    
    // Daily exit chart
    const dailyData = [];
    const dailyLabels = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyLabels.push(formatDate(dateStr));
        
        let available, approved;
        if (deptFilter !== 'all') {
            available = vehicles.filter(v => v.departmentId === parseInt(deptFilter) && !v.inRepair).length;
            approved = filteredRequests.filter(r => r.date === dateStr && r.status === 'approved').length;
        } else {
            available = vehicles.filter(v => !v.inRepair).length;
            approved = filteredRequests.filter(r => r.date === dateStr && r.status === 'approved').length;
        }
        dailyData.push(available > 0 ? ((approved / available) * 100).toFixed(1) : 0);
    }
    
    dailyExitChart.data.labels = dailyLabels;
    dailyExitChart.data.datasets[0].data = dailyData;
    dailyExitChart.update();
    
    // Status chart
    const approved = filteredRequests.filter(r => r.status === 'approved').length;
    const rejected = filteredRequests.filter(r => r.status === 'rejected').length;
    const pending = filteredRequests.filter(r => r.status === 'pending').length;
    
    statusChart.data.datasets[0].data = [approved, rejected, pending];
    statusChart.update();
    
    // Requests by department chart
    const deptRequestData = filteredDepts.map(dept => 
        filteredRequests.filter(r => r.departmentId === dept.id).length
    );
    
    requestsDeptChart.data.labels = filteredDepts.map(d => d.name);
    requestsDeptChart.data.datasets[0].data = deptRequestData;
    requestsDeptChart.update();
    
    // Department stats table
    updateDeptStatsTable(deptFilter);
}

function updateDeptStatsTable(deptFilter) {
    const tbody = document.getElementById('dept-stats-table');
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let filteredDepts = departments;
    if (deptFilter !== 'all') {
        filteredDepts = departments.filter(d => d.id === parseInt(deptFilter));
    }
    
    tbody.innerHTML = filteredDepts.map(dept => {
        const deptVehicles = vehicles.filter(v => v.departmentId === dept.id);
        const inRepair = deptVehicles.filter(v => v.inRepair).length;
        
        const available = deptVehicles.length - inRepair;
        const approvedToday = requests.filter(r => 
            r.departmentId === dept.id && r.date === today && r.status === 'approved'
        ).length;
        const exitToday = available > 0 ? ((approvedToday / available) * 100).toFixed(1) : 0;
        
        const monthApproved = requests.filter(r => 
            r.departmentId === dept.id && r.date.startsWith(currentMonth) && r.status === 'approved'
        ).length;
        const monthAvailable = available * 30; // Approximate
        const exitMonth = monthAvailable > 0 ? ((monthApproved / monthAvailable) * 100).toFixed(1) : 0;
        
        const totalRequests = requests.filter(r => r.departmentId === dept.id).length;
        const rejectedCount = requests.filter(r => r.departmentId === dept.id && r.status === 'rejected').length;
        
        return `
            <tr>
                <td>${dept.name}</td>
                <td>${deptVehicles.length}</td>
                <td>${inRepair}</td>
                <td>${exitToday}%</td>
                <td>${exitMonth}%</td>
                <td>${totalRequests}</td>
                <td>${rejectedCount}</td>
            </tr>
        `;
    }).join('');
}

// Utilities
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById('modal-overlay').classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('modal-overlay').classList.remove('active');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function saveData() {
    localStorage.setItem('departments', JSON.stringify(departments));
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('requests', JSON.stringify(requests));
}
