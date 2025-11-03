/**
 * نظام لوحات المعلومات المرئية المتقدمة
 * Advanced Dashboard Visualization System
 * 
 * نظام لوحات معلومات تفاعلية مع تحديثات فورية لأداء النظام
 * Interactive dashboard system with real-time performance updates
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const fs = require('fs');

class DashboardVisualizationSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = {
            port: options.port || 3000,
            updateInterval: options.updateInterval || 1000,
            dataRetention: options.dataRetention || 86400,
            maxClients: options.maxClients || 100,
            enableSSL: options.enableSSL || false,
            sslKey: options.sslKey,
            sslCert: options.sslCert,
            ...options
        };

        this.app = express();
        this.clients = new Map();
        this.dashboardData = {
            overview: {},
            metrics: {},
            alerts: [],
            performance: {},
            health: {},
            trends: {},
            lastUpdate: new Date()
        };

        this.realTimeData = new Map();
        this.historicalData = [];
        this.alertHistory = [];
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupDataCollectors();
        
        console.log('✅ نظام لوحات المعلومات المرئية متقدم تم تهيئته بنجاح');
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../static')));
        this.app.use('/dashboard', express.static(path.join(__dirname, '../templates')));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    setupRoutes() {
        // الرئيسية - Dashboard الرئيسي
        this.app.get('/', (req, res) => {
            res.send(this.generateMainDashboard());
        });

        // API endpoints
        this.app.get('/api/overview', (req, res) => {
            res.json(this.dashboardData.overview);
        });

        this.app.get('/api/metrics', (req, res) => {
            res.json(this.dashboardData.metrics);
        });

        this.app.get('/api/alerts', (req, res) => {
            res.json(this.dashboardData.alerts);
        });

        this.app.get('/api/performance', (req, res) => {
            res.json(this.dashboardData.performance);
        });

        this.app.get('/api/health', (req, res) => {
            res.json(this.dashboardData.health);
        });

        this.app.get('/api/trends', (req, res) => {
            res.json(this.dashboardData.trends);
        });

        this.app.get('/api/historical/:period', (req, res) => {
            const period = req.params.period;
            const data = this.getHistoricalData(period);
            res.json(data);
        });

        this.app.post('/api/acknowledge/:alertId', (req, res) => {
            const { alertId } = req.params;
            const ack = this.acknowledgeAlert(alertId);
            res.json(ack);
        });

        this.app.post('/api/customize', (req, res) => {
            const { dashboard, settings } = req.body;
            const result = this.customizeDashboard(dashboard, settings);
            res.json(result);
        });

        // UI-specific routes
        this.app.get('/dashboard/overview', (req, res) => {
            res.send(this.generateOverviewDashboard());
        });

        this.app.get('/dashboard/metrics', (req, res) => {
            res.send(this.generateMetricsDashboard());
        });

        this.app.get('/dashboard/performance', (req, res) => {
            res.send(this.generatePerformanceDashboard());
        });

        this.app.get('/dashboard/alerts', (req, res) => {
            res.send(this.generateAlertsDashboard());
        });

        this.app.get('/dashboard/analytics', (req, res) => {
            res.send(this.generateAnalyticsDashboard());
        });
    }

    setupWebSocket() {
        const serverOptions = {};
        if (this.config.enableSSL) {
            serverOptions.key = fs.readFileSync(this.config.sslKey);
            serverOptions.cert = fs.readFileSync(this.config.sslCert);
        }

        this.wss = new WebSocket.Server({ 
            ...serverOptions,
            port: this.config.port + 1 
        });

        this.wss.on('connection', (ws, req) => {
            this.handleWebSocketConnection(ws, req);
        });

        console.log(`🔌 WebSocket server started on port ${this.config.port + 1}`);
    }

    handleWebSocketConnection(ws, req) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            ws: ws,
            connectedAt: new Date(),
            subscriptions: new Set()
        };

        this.clients.set(clientId, client);
        console.log(`🔗 Client connected: ${clientId} (Total: ${this.clients.size})`);

        // Send initial data
        ws.send(JSON.stringify({
            type: 'initial',
            data: {
                overview: this.dashboardData.overview,
                metrics: this.dashboardData.metrics,
                alerts: this.dashboardData.alerts.slice(0, 10),
                performance: this.dashboardData.performance,
                timestamp: new Date()
            }
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(client, data);
            } catch (error) {
                console.error('❌ WebSocket message error:', error);
            }
        });

        ws.on('close', () => {
            this.clients.delete(clientId);
            console.log(`🔌 Client disconnected: ${clientId} (Total: ${this.clients.size})`);
        });

        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for client ${clientId}:`, error);
            this.clients.delete(clientId);
        });
    }

    handleWebSocketMessage(client, data) {
        switch (data.type) {
            case 'subscribe':
                data.subscriptions.forEach(sub => {
                    client.subscriptions.add(sub);
                });
                client.ws.send(JSON.stringify({
                    type: 'subscribed',
                    subscriptions: Array.from(client.subscriptions)
                }));
                break;

            case 'unsubscribe':
                data.subscriptions.forEach(sub => {
                    client.subscriptions.delete(sub);
                });
                break;

            case 'request_data':
                this.sendDashboardData(client, data.dashboard);
                break;

            case 'acknowledge_alert':
                this.acknowledgeAlert(data.alertId);
                this.broadcastAlertUpdate(data.alertId);
                break;

            case 'set_threshold':
                this.setThreshold(data.metric, data.threshold);
                break;
        }
    }

    setupDataCollectors() {
        // جمع البيانات الرئيسية
        setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.updateInterval);

        // جمع بيانات الأداء
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, this.config.updateInterval * 2);

        // جمع بيانات الصحة
        setInterval(() => {
            this.collectHealthMetrics();
        }, this.config.updateInterval * 5);

        // تنظيف البيانات القديمة
        setInterval(() => {
            this.cleanupOldData();
        }, 60000); // كل دقيقة

        console.log('📊 مكونات جمع البيانات بدأت في العمل');
    }

    collectSystemMetrics() {
        const metrics = {
            timestamp: new Date(),
            cpu: {
                usage: Math.random() * 100,
                load: {
                    '1m': Math.random() * 4,
                    '5m': Math.random() * 3,
                    '15m': Math.random() * 2
                },
                processes: Math.floor(Math.random() * 500) + 100
            },
            memory: {
                total: Math.random() * 64 * 1024 * 1024 * 1024,
                used: Math.random() * 50 * 1024 * 1024 * 1024,
                available: Math.random() * 15 * 1024 * 1024 * 1024,
                usage: Math.random() * 100
            },
            disk: {
                total: Math.random() * 1024 * 1024 * 1024 * 1024,
                used: Math.random() * 700 * 1024 * 1024 * 1024,
                free: Math.random() * 300 * 1024 * 1024 * 1024,
                usage: Math.random() * 100
            },
            network: {
                bytesIn: Math.random() * 1000000000,
                bytesOut: Math.random() * 800000000,
                packetsIn: Math.random() * 1000000,
                packetsOut: Math.random() * 800000,
                errors: Math.floor(Math.random() * 10)
            }
        };

        this.updateRealTimeData('system', metrics);
        this.updateDashboardData('overview', metrics);
    }

    collectPerformanceMetrics() {
        const performance = {
            timestamp: new Date(),
            responseTime: {
                average: Math.random() * 200 + 50,
                median: Math.random() * 180 + 40,
                p95: Math.random() * 500 + 100,
                p99: Math.random() * 1000 + 200
            },
            throughput: {
                requestsPerSecond: Math.random() * 1000 + 100,
                requestsTotal: Math.floor(Math.random() * 100000) + 10000,
                successRate: Math.random() * 5 + 95,
                errorRate: Math.random() * 5
            },
            database: {
                connectionPool: {
                    active: Math.random() * 50,
                    idle: Math.random() * 30,
                    waiting: Math.random() * 10
                },
                queryTime: {
                    average: Math.random() * 50 + 10,
                    slow: Math.random() * 500 + 100,
                    totalQueries: Math.floor(Math.random() * 10000) + 1000
                }
            },
            cache: {
                hitRate: Math.random() * 10 + 85,
                missRate: Math.random() * 10,
                evictions: Math.floor(Math.random() * 100),
                size: Math.random() * 1024 * 1024 * 1024
            }
        };

        this.updateRealTimeData('performance', performance);
        this.updateDashboardData('performance', performance);
    }

    collectHealthMetrics() {
        const health = {
            timestamp: new Date(),
            services: [
                {
                    name: 'API Service',
                    status: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
                    responseTime: Math.random() * 100 + 10,
                    uptime: 99.9 + Math.random() * 0.1
                },
                {
                    name: 'Database',
                    status: Math.random() > 0.05 ? 'healthy' : 'unhealthy',
                    responseTime: Math.random() * 50 + 5,
                    uptime: 99.95 + Math.random() * 0.05
                },
                {
                    name: 'Cache Layer',
                    status: Math.random() > 0.02 ? 'healthy' : 'unhealthy',
                    responseTime: Math.random() * 20 + 2,
                    uptime: 99.98 + Math.random() * 0.02
                }
            ],
            overall: {
                status: 'healthy',
                score: Math.random() * 20 + 80,
                lastCheck: new Date(),
                issues: Math.floor(Math.random() * 3)
            }
        };

        this.updateRealTimeData('health', health);
        this.updateDashboardData('health', health);
    }

    updateRealTimeData(type, data) {
        const key = `${type}_${Date.now()}`;
        this.realTimeData.set(key, data);
        
        // Broadcast to subscribed clients
        this.broadcastToClients(type, data);
    }

    broadcastToClients(type, data) {
        const message = {
            type: 'update',
            dataType: type,
            data: data,
            timestamp: new Date()
        };

        this.clients.forEach(client => {
            if (client.subscriptions.has(type) || client.subscriptions.has('all')) {
                try {
                    client.ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error('❌ Broadcast error:', error);
                    this.clients.delete(client.id);
                }
            }
        });
    }

    updateDashboardData(section, data) {
        this.dashboardData[section] = { ...this.dashboardData[section], ...data };
        this.dashboardData.lastUpdate = new Date();
    }

    acknowledgeAlert(alertId) {
        const alert = this.dashboardData.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date();
            alert.status = 'acknowledged';
            
            console.log(`✅ Alert acknowledged: ${alertId}`);
            return { success: true, alert };
        }
        return { success: false, error: 'Alert not found' };
    }

    broadcastAlertUpdate(alertId) {
        const alert = this.dashboardData.alerts.find(a => a.id === alertId);
        if (alert) {
            this.broadcastToClients('alerts', alert);
        }
    }

    setThreshold(metric, threshold) {
        // Store threshold configuration
        console.log(`📏 Threshold set for ${metric}: ${threshold}`);
        return { success: true, metric, threshold };
    }

    getHistoricalData(period) {
        const now = new Date();
        const periodMap = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const cutoff = now.getTime() - (periodMap[period] || periodMap['24h']);
        
        return this.historicalData.filter(item => 
            new Date(item.timestamp).getTime() >= cutoff
        );
    }

    cleanupOldData() {
        const cutoff = Date.now() - (this.config.dataRetention * 1000);
        
        // Clean real-time data
        for (const [key, value] of this.realTimeData) {
            if (new Date(value.timestamp || Date.now()).getTime() < cutoff) {
                this.realTimeData.delete(key);
            }
        }

        // Clean historical data
        this.historicalData = this.historicalData.filter(item => 
            new Date(item.timestamp).getTime() >= cutoff
        );

        console.log('🧹 تنظيف البيانات القديمة مكتمل');
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Dashboard HTML Generators
    generateMainDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة المراقبة المتقدمة - Advanced Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 8px;
            animation: pulse 2s infinite;
        }
        .status-healthy { background: #4CAF50; }
        .status-warning { background: #FF9800; }
        .status-critical { background: #F44336; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .card-header h3 {
            font-size: 1.3em;
            flex: 1;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .metric-unit {
            font-size: 0.8em;
            opacity: 0.8;
        }
        .chart-container {
            height: 200px;
            margin-top: 15px;
        }
        .alert-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid;
        }
        .alert-critical { border-color: #F44336; }
        .alert-warning { border-color: #FF9800; }
        .alert-info { border-color: #2196F3; }
        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }
        .status-item {
            text-align: center;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .status-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin: 0 auto 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 نظام المراقبة المتقدم</h1>
            <div class="status-indicator status-healthy"></div>
            <span>النظام يعمل بشكل طبيعي</span>
            <p>آخر تحديث: <span id="lastUpdate">--:--</span></p>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3>💻 استخدام المعالج</h3>
                    <div class="status-dot status-healthy"></div>
                </div>
                <div class="metric-value">
                    <span id="cpuUsage">0</span><span class="metric-unit">%</span>
                </div>
                <div class="chart-container">
                    <canvas id="cpuChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🧠 استخدام الذاكرة</h3>
                    <div class="status-dot status-healthy"></div>
                </div>
                <div class="metric-value">
                    <span id="memoryUsage">0</span><span class="metric-unit">%</span>
                </div>
                <div class="chart-container">
                    <canvas id="memoryChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>⚡ وقت الاستجابة</h3>
                    <div class="status-dot status-healthy"></div>
                </div>
                <div class="metric-value">
                    <span id="responseTime">0</span><span class="metric-unit">ms</span>
                </div>
                <div class="chart-container">
                    <canvas id="responseChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📊 معدل الطلبات</h3>
                    <div class="status-dot status-healthy"></div>
                </div>
                <div class="metric-value">
                    <span id="requestsPerSec">0</span><span class="metric-unit">req/s</span>
                </div>
                <div class="chart-container">
                    <canvas id="requestsChart"></canvas>
                </div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3>🔔 التنبيهات النشطة</h3>
                    <a href="/dashboard/alerts" class="btn">عرض الكل</a>
                </div>
                <div id="activeAlerts">
                    <div class="alert-item alert-info">
                        <div class="alert-header">
                            <span>لا توجد تنبيهات نشطة</span>
                            <span style="font-size: 0.9em;">متصل</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🏥 حالة الخدمات</h3>
                    <a href="/dashboard/health" class="btn">تفاصيل</a>
                </div>
                <div class="status-grid" id="serviceStatus">
                    <div class="status-item">
                        <div class="status-dot status-healthy"></div>
                        <div>API Service</div>
                        <div style="font-size: 0.9em;">99.9%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize WebSocket connection
        const socket = io();
        
        // Chart instances
        const charts = {};
        
        // Initialize charts
        function initCharts() {
            const chartConfig = {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            };

            charts.cpu = new Chart(document.getElementById('cpuChart'), {
                ...chartConfig,
                data: { labels: [], datasets: [{ data: [], borderColor: '#4CAF50', fill: false }] }
            });

            charts.memory = new Chart(document.getElementById('memoryChart'), {
                ...chartConfig,
                data: { labels: [], datasets: [{ data: [], borderColor: '#2196F3', fill: false }] }
            });

            charts.response = new Chart(document.getElementById('responseChart'), {
                ...chartConfig,
                data: { labels: [], datasets: [{ data: [], borderColor: '#FF9800', fill: false }] }
            });

            charts.requests = new Chart(document.getElementById('requestsChart'), {
                ...chartConfig,
                data: { labels: [], datasets: [{ data: [], borderColor: '#9C27B0', fill: false }] }
            });
        }

        // Update charts with new data
        function updateChart(chart, value) {
            const time = new Date().toLocaleTimeString('ar-SA');
            chart.data.labels.push(time);
            chart.data.datasets[0].data.push(value);
            
            // Keep only last 20 points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            chart.update('none');
        }

        // Update dashboard metrics
        function updateMetrics(data) {
            document.getElementById('cpuUsage').textContent = Math.round(data.system?.cpu?.usage || 0);
            document.getElementById('memoryUsage').textContent = Math.round(data.system?.memory?.usage || 0);
            document.getElementById('responseTime').textContent = Math.round(data.performance?.responseTime?.average || 0);
            document.getElementById('requestsPerSec').textContent = Math.round(data.performance?.throughput?.requestsPerSecond || 0);
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ar-SA');

            // Update charts
            if (charts.cpu && data.system) updateChart(charts.cpu, data.system.cpu.usage);
            if (charts.memory && data.system) updateChart(charts.memory, data.system.memory.usage);
            if (charts.response && data.performance) updateChart(charts.response, data.performance.responseTime.average);
            if (charts.requests && data.performance) updateChart(charts.requests, data.performance.throughput.requestsPerSecond);
        }

        // WebSocket event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to monitoring server');
            socket.emit('subscribe', ['system', 'performance', 'health', 'alerts']);
        });

        socket.on('update', (data) => {
            updateMetrics(data);
        });

        socket.on('initial', (data) => {
            updateMetrics(data);
        });

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            initCharts();
            
            // Fetch initial data
            fetch('/api/overview')
                .then(response => response.json())
                .then(data => updateMetrics(data))
                .catch(console.error);
        });

        // Acknowledge alert function
        function acknowledgeAlert(alertId) {
            socket.emit('acknowledge_alert', { alertId });
        }
    </script>
</body>
</html>
        `;
    }

    generateOverviewDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظرة عامة - Overview Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav-menu {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-btn.active, .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }
        .metric-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        .metric-item {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }
        .metric-value {
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.5s ease;
        }
        .warning { background: linear-gradient(90deg, #FF9800, #FFC107); }
        .critical { background: linear-gradient(90deg, #F44336, #E91E63); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 نظرة عامة على النظام</h1>
            <p>مراقبة شاملة للأداء والحالة</p>
        </div>

        <div class="nav-menu">
            <a href="/" class="nav-btn">الرئيسية</a>
            <a href="/dashboard/metrics" class="nav-btn">المقاييس</a>
            <a href="/dashboard/performance" class="nav-btn">الأداء</a>
            <a href="/dashboard/alerts" class="nav-btn">التنبيهات</a>
            <a href="/dashboard/analytics" class="nav-btn">التحليلات</a>
        </div>

        <div class="grid">
            <div class="card">
                <h3>💻 نظام المعالج</h3>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-value" id="cpuUsage">0%</div>
                        <div class="metric-label">الاستخدام الحالي</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="cpuProgress"></div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="load1m">0.0</div>
                        <div class="metric-label">متوسط الحمل (1د)</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="load5m">0.0</div>
                        <div class="metric-label">متوسط الحمل (5د)</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="processes">0</div>
                        <div class="metric-label">العمليات النشطة</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🧠 الذاكرة</h3>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-value" id="memoryUsage">0%</div>
                        <div class="metric-label">الاستخدام</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="memoryProgress"></div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="memoryUsed">0 GB</div>
                        <div class="metric-label">المستخدمة</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="memoryTotal">0 GB</div>
                        <div class="metric-label">الإجمالي</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="memoryAvailable">0 GB</div>
                        <div class="metric-label">المتاحة</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>💾 التخزين</h3>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-value" id="diskUsage">0%</div>
                        <div class="metric-label">الاستخدام</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="diskProgress"></div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="diskUsed">0 GB</div>
                        <div class="metric-label">المستخدمة</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="diskTotal">0 TB</div>
                        <div class="metric-label">الإجمالي</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="diskFree">0 GB</div>
                        <div class="metric-label">المتاحة</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🌐 الشبكة</h3>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-value" id="bytesIn">0 MB/s</div>
                        <div class="metric-label">الدخل</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="bytesOut">0 MB/s</div>
                        <div class="metric-label">الصادر</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="packetsIn">0</div>
                        <div class="metric-label">الحزم داخلية</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="networkErrors">0</div>
                        <div class="metric-label">أخطاء الشبكة</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        // Format bytes to human readable
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function formatBytesPerSec(bytes) {
            return formatBytes(bytes) + '/s';
        }

        function updateProgressBar(elementId, value) {
            const bar = document.getElementById(elementId);
            bar.style.width = Math.min(value, 100) + '%';
            
            // Change color based on value
            bar.className = 'progress-fill';
            if (value > 80) {
                bar.classList.add('critical');
            } else if (value > 60) {
                bar.classList.add('warning');
            }
        }

        function updateMetrics(data) {
            if (data.system) {
                const cpu = data.system.cpu;
                const memory = data.system.memory;
                const disk = data.system.disk;
                const network = data.system.network;

                // CPU
                document.getElementById('cpuUsage').textContent = Math.round(cpu.usage) + '%';
                updateProgressBar('cpuProgress', cpu.usage);
                document.getElementById('load1m').textContent = cpu.load['1m'].toFixed(2);
                document.getElementById('load5m').textContent = cpu.load['5m'].toFixed(2);
                document.getElementById('processes').textContent = cpu.processes;

                // Memory
                document.getElementById('memoryUsage').textContent = Math.round(memory.usage) + '%';
                updateProgressBar('memoryProgress', memory.usage);
                document.getElementById('memoryUsed').textContent = formatBytes(memory.used);
                document.getElementById('memoryTotal').textContent = formatBytes(memory.total);
                document.getElementById('memoryAvailable').textContent = formatBytes(memory.available);

                // Disk
                document.getElementById('diskUsage').textContent = Math.round(disk.usage) + '%';
                updateProgressBar('diskProgress', disk.usage);
                document.getElementById('diskUsed').textContent = formatBytes(disk.used);
                document.getElementById('diskTotal').textContent = formatBytes(disk.total);
                document.getElementById('diskFree').textContent = formatBytes(disk.free);

                // Network
                document.getElementById('bytesIn').textContent = formatBytesPerSec(network.bytesIn);
                document.getElementById('bytesOut').textContent = formatBytesPerSec(network.bytesOut);
                document.getElementById('packetsIn').textContent = network.packetsIn.toLocaleString();
                document.getElementById('networkErrors').textContent = network.errors;
            }
        }

        socket.on('update', (data) => {
            if (data.dataType === 'system') {
                updateMetrics(data);
            }
        });

        socket.on('initial', (data) => {
            updateMetrics(data);
        });

        // Initial data fetch
        fetch('/api/overview')
            .then(response => response.json())
            .then(data => updateMetrics(data))
            .catch(console.error);
    </script>
</body>
</html>
        `;
    }

    generateMetricsDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مقاييس الأداء - Metrics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav-menu {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-btn.active, .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
            gap: 25px;
        }
        .chart-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .chart-title {
            font-size: 1.2em;
            margin-bottom: 20px;
            text-align: center;
        }
        .chart-container {
            height: 300px;
            position: relative;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 مقاييس الأداء المفصلة</h1>
            <p>مراقبة متقدمة لمقاييس النظام والأداء</p>
        </div>

        <div class="nav-menu">
            <a href="/" class="nav-btn">الرئيسية</a>
            <a href="/dashboard/overview" class="nav-btn">نظرة عامة</a>
            <a href="/dashboard/metrics" class="nav-btn active">المقاييس</a>
            <a href="/dashboard/performance" class="nav-btn">الأداء</a>
            <a href="/dashboard/alerts" class="nav-btn">التنبيهات</a>
            <a href="/dashboard/analytics" class="nav-btn">التحليلات</a>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="avgResponseTime">0ms</div>
                <div class="stat-label">متوسط وقت الاستجابة</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="requestsPerSecond">0</div>
                <div class="stat-label">طلبات في الثانية</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="successRate">0%</div>
                <div class="stat-label">معدل النجاح</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="cacheHitRate">0%</div>
                <div class="stat-label">معدل اصابة الكاش</div>
            </div>
        </div>

        <div class="chart-grid">
            <div class="chart-card">
                <div class="chart-title">⏱️ أوقات الاستجابة</div>
                <div class="chart-container">
                    <canvas id="responseTimeChart"></canvas>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-title">📊 معدل الطلبات</div>
                <div class="chart-container">
                    <canvas id="throughputChart"></canvas>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-title">🗄️ أداء قاعدة البيانات</div>
                <div class="chart-container">
                    <canvas id="databaseChart"></canvas>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-title">⚡ أداء الكاش</div>
                <div class="chart-container">
                    <canvas id="cacheChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        const charts = {};

        function initCharts() {
            const config = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                },
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            };

            charts.responseTime = new Chart(document.getElementById('responseTimeChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'المتوسط', data: [], borderColor: '#4CAF50', fill: false },
                        { label: 'P95', data: [], borderColor: '#FF9800', fill: false },
                        { label: 'P99', data: [], borderColor: '#F44336', fill: false }
                    ]
                },
                options: config
            });

            charts.throughput = new Chart(document.getElementById('throughputChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'الطلبات/ثانية', data: [], borderColor: '#2196F3', fill: true }
                    ]
                },
                options: config
            });

            charts.database = new Chart(document.getElementById('databaseChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'وقت الاستعلام', data: [], borderColor: '#9C27B0', fill: false },
                        { label: 'الاستعلامات البطيئة', data: [], borderColor: '#FF5722', fill: false }
                    ]
                },
                options: config
            });

            charts.cache = new Chart(document.getElementById('cacheChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'معدل الاصابة', data: [], borderColor: '#00BCD4', fill: false },
                        { label: 'حجم الكاش', data: [], borderColor: '#FFEB3B', fill: false }
                    ]
                },
                options: config
            });
        }

        function updateChart(chart, data, maxPoints = 30) {
            const time = new Date().toLocaleTimeString('ar-SA');
            chart.data.labels.push(time);
            
            if (Array.isArray(data)) {
                data.forEach((value, index) => {
                    if (chart.data.datasets[index]) {
                        chart.data.datasets[index].data.push(value);
                    }
                });
            } else {
                chart.data.datasets[0].data.push(data);
            }
            
            // Keep only recent points
            if (chart.data.labels.length > maxPoints) {
                chart.data.labels.shift();
                chart.data.datasets.forEach(dataset => {
                    dataset.data.shift();
                });
            }
            
            chart.update('none');
        }

        function updateStats(data) {
            if (data.performance) {
                const perf = data.performance;
                document.getElementById('avgResponseTime').textContent = Math.round(perf.responseTime.average) + 'ms';
                document.getElementById('requestsPerSecond').textContent = Math.round(perf.throughput.requestsPerSecond);
                document.getElementById('successRate').textContent = perf.throughput.successRate.toFixed(1) + '%';
            }
            
            if (data.performance?.cache) {
                document.getElementById('cacheHitRate').textContent = data.performance.cache.hitRate.toFixed(1) + '%';
            }
        }

        function updateCharts(data) {
            if (data.performance) {
                const perf = data.performance;
                
                // Response time chart
                updateChart(charts.responseTime, [
                    perf.responseTime.average,
                    perf.responseTime.p95,
                    perf.responseTime.p99
                ]);
                
                // Throughput chart
                updateChart(charts.throughput, perf.throughput.requestsPerSecond);
                
                // Database chart
                if (perf.database) {
                    updateChart(charts.database, [
                        perf.database.queryTime.average,
                        perf.database.queryTime.slow
                    ]);
                }
                
                // Cache chart
                if (perf.cache) {
                    updateChart(charts.cache, [
                        perf.cache.hitRate,
                        perf.cache.size / (1024 * 1024 * 1024) // Convert to GB
                    ]);
                }
            }
        }

        socket.on('update', (data) => {
            if (data.dataType === 'performance') {
                updateStats(data);
                updateCharts(data);
            }
        });

        socket.on('initial', (data) => {
            updateStats(data);
            updateCharts(data);
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initCharts();
            
            // Subscribe to performance data
            socket.emit('subscribe', ['performance']);
            
            fetch('/api/metrics')
                .then(response => response.json())
                .then(data => updateStats(data))
                .catch(console.error);
        });
    </script>
</body>
</html>
        `;
    }

    generatePerformanceDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مراقبة الأداء - Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav-menu {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-btn.active, .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 25px;
        }
        .performance-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .gauge-container {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        .gauge {
            text-align: center;
            width: 120px;
        }
        .gauge-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 8px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            font-size: 1.2em;
            font-weight: bold;
            position: relative;
            overflow: hidden;
        }
        .gauge-value {
            position: relative;
            z-index: 2;
        }
        .gauge-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 0%;
            transition: height 0.5s ease;
            z-index: 1;
        }
        .healthy { background: linear-gradient(to top, #4CAF50, #66BB6A); }
        .warning { background: linear-gradient(to top, #FF9800, #FFB74D); }
        .critical { background: linear-gradient(to top, #F44336, #EF5350); }
        .metric-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        .metric-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .metric-label {
            font-size: 0.9em;
        }
        .metric-value {
            font-weight: bold;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ مراقبة الأداء المتقدمة</h1>
            <p>تحليل شامل لأداء التطبيق والنظام</p>
        </div>

        <div class="nav-menu">
            <a href="/" class="nav-btn">الرئيسية</a>
            <a href="/dashboard/overview" class="nav-btn">نظرة عامة</a>
            <a href="/dashboard/metrics" class="nav-btn">المقاييس</a>
            <a href="/dashboard/performance" class="nav-btn active">الأداء</a>
            <a href="/dashboard/alerts" class="nav-btn">التنبيهات</a>
            <a href="/dashboard/analytics" class="nav-btn">التحليلات</a>
        </div>

        <div class="performance-grid">
            <div class="performance-card">
                <h3>🎯 مؤشرات الأداء الرئيسية</h3>
                <div class="gauge-container">
                    <div class="gauge">
                        <div class="gauge-circle" id="responseTimeGauge">
                            <div class="gauge-fill" id="responseTimeFill"></div>
                            <div class="gauge-value">0ms</div>
                        </div>
                        <div>وقت الاستجابة</div>
                    </div>
                    <div class="gauge">
                        <div class="gauge-circle" id="throughputGauge">
                            <div class="gauge-fill" id="throughputFill"></div>
                            <div class="gauge-value">0</div>
                        </div>
                        <div>المعدل</div>
                    </div>
                    <div class="gauge">
                        <div class="gauge-circle" id="successGauge">
                            <div class="gauge-fill" id="successFill"></div>
                            <div class="gauge-value">0%</div>
                        </div>
                        <div>معدل النجاح</div>
                    </div>
                </div>
                <div class="metric-summary">
                    <div class="metric-item">
                        <span class="metric-label">P95 Response Time</span>
                        <span class="metric-value" id="p95Response">0ms</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">P99 Response Time</span>
                        <span class="metric-value" id="p99Response">0ms</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">المجموع الكلي</span>
                        <span class="metric-value" id="totalRequests">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">معدل الخطأ</span>
                        <span class="metric-value" id="errorRate">0%</span>
                    </div>
                </div>
            </div>

            <div class="performance-card">
                <h3>💾 أداء قاعدة البيانات</h3>
                <div class="metric-summary">
                    <div class="metric-item">
                        <span class="metric-label">الاتصالات النشطة</span>
                        <span class="metric-value" id="activeConnections">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">الاتصالات الخاملة</span>
                        <span class="metric-value" id="idleConnections">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">في الانتظار</span>
                        <span class="metric-value" id="waitingConnections">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">متوسط الاستعلام</span>
                        <span class="metric-value" id="avgQueryTime">0ms</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">الاستعلامات البطيئة</span>
                        <span class="metric-value" id="slowQueries">0ms</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">إجمالي الاستعلامات</span>
                        <span class="metric-value" id="totalQueries">0</span>
                    </div>
                </div>
            </div>

            <div class="performance-card">
                <h3>⚡ أداء الكاش</h3>
                <div class="metric-summary">
                    <div class="metric-item">
                        <span class="metric-label">معدل الاصابة</span>
                        <span class="metric-value" id="cacheHitRate">0%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">معدل الفشل</span>
                        <span class="metric-value" id="cacheMissRate">0%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">الطرد</span>
                        <span class="metric-value" id="cacheEvictions">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">حجم الكاش</span>
                        <span class="metric-value" id="cacheSize">0 MB</span>
                    </div>
                </div>
            </div>

            <div class="performance-card">
                <h3>📊 رسم بياني للأداء</h3>
                <div style="height: 300px;">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let performanceChart;

        function initGauge(gaugeId, fillId, value, maxValue, unit) {
            const fill = document.getElementById(fillId);
            const circle = document.getElementById(gaugeId);
            const valueElement = circle.querySelector('.gauge-value');
            
            const percentage = Math.min((value / maxValue) * 100, 100);
            fill.style.height = percentage + '%';
            
            // Set color based on percentage
            fill.className = 'gauge-fill';
            if (percentage > 80) {
                fill.classList.add('critical');
            } else if (percentage > 60) {
                fill.classList.add('warning');
            } else {
                fill.classList.add('healthy');
            }
            
            valueElement.textContent = Math.round(value) + unit;
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function initChart() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'وقت الاستجابة', data: [], borderColor: '#4CAF50', fill: false },
                        { label: 'المعدل', data: [], borderColor: '#2196F3', fill: false },
                        { label: 'معدل الخطأ', data: [], borderColor: '#F44336', fill: false }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                    },
                    plugins: {
                        legend: { labels: { color: 'white' } }
                    }
                }
            });
        }

        function updateChart(data) {
            const time = new Date().toLocaleTimeString('ar-SA');
            performanceChart.data.labels.push(time);
            performanceChart.data.datasets[0].data.push(data.responseTime?.average || 0);
            performanceChart.data.datasets[1].data.push(data.throughput?.requestsPerSecond || 0);
            performanceChart.data.datasets[2].data.push(data.throughput?.errorRate || 0);
            
            if (performanceChart.data.labels.length > 20) {
                performanceChart.data.labels.shift();
                performanceChart.data.datasets.forEach(dataset => {
                    dataset.data.shift();
                });
            }
            
            performanceChart.update('none');
        }

        function updatePerformance(data) {
            if (data.performance) {
                const perf = data.performance;
                
                // Update gauges
                initGauge('responseTimeGauge', 'responseTimeFill', 
                    perf.responseTime.average, 1000, 'ms');
                initGauge('throughputGauge', 'throughputFill', 
                    perf.throughput.requestsPerSecond, 1000, '');
                initGauge('successGauge', 'successFill', 
                    perf.throughput.successRate, 100, '%');
                
                // Update metrics
                document.getElementById('p95Response').textContent = Math.round(perf.responseTime.p95) + 'ms';
                document.getElementById('p99Response').textContent = Math.round(perf.responseTime.p99) + 'ms';
                document.getElementById('totalRequests').textContent = perf.throughput.requestsTotal.toLocaleString();
                document.getElementById('errorRate').textContent = perf.throughput.errorRate.toFixed(2) + '%';
                
                // Database metrics
                if (perf.database) {
                    document.getElementById('activeConnections').textContent = Math.round(perf.database.connectionPool.active);
                    document.getElementById('idleConnections').textContent = Math.round(perf.database.connectionPool.idle);
                    document.getElementById('waitingConnections').textContent = Math.round(perf.database.connectionPool.waiting);
                    document.getElementById('avgQueryTime').textContent = Math.round(perf.database.queryTime.average) + 'ms';
                    document.getElementById('slowQueries').textContent = Math.round(perf.database.queryTime.slow) + 'ms';
                    document.getElementById('totalQueries').textContent = perf.database.queryTime.totalQueries.toLocaleString();
                }
                
                // Cache metrics
                if (perf.cache) {
                    document.getElementById('cacheHitRate').textContent = perf.cache.hitRate.toFixed(1) + '%';
                    document.getElementById('cacheMissRate').textContent = perf.cache.missRate.toFixed(1) + '%';
                    document.getElementById('cacheEvictions').textContent = perf.cache.evictions;
                    document.getElementById('cacheSize').textContent = formatBytes(perf.cache.size);
                }
                
                updateChart(data);
            }
        }

        socket.on('update', (data) => {
            if (data.dataType === 'performance') {
                updatePerformance(data);
            }
        });

        socket.on('initial', (data) => {
            updatePerformance(data);
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initChart();
            
            socket.emit('subscribe', ['performance']);
            
            fetch('/api/performance')
                .then(response => response.json())
                .then(data => updatePerformance(data))
                .catch(console.error);
        });
    </script>
</body>
</html>
        `;
    }

    generateAlertsDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التنبيهات - Alerts Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav-menu {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-btn.active, .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .stats-row {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .stat-box {
            flex: 1;
            min-width: 200px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .stat-label {
            font-size: 1em;
            opacity: 0.8;
        }
        .critical { color: #F44336; }
        .warning { color: #FF9800; }
        .info { color: #2196F3; }
        .resolved { color: #4CAF50; }
        .alert-grid {
            display: grid;
            gap: 20px;
        }
        .alert-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }
        .alert-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
        }
        .alert-critical::before { background: #F44336; }
        .alert-warning::before { background: #FF9800; }
        .alert-info::before { background: #2196F3; }
        .alert-resolved::before { background: #4CAF50; }
        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .alert-title {
            font-size: 1.2em;
            font-weight: bold;
        }
        .alert-meta {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            opacity: 0.8;
        }
        .alert-description {
            margin: 15px 0;
            line-height: 1.6;
        }
        .alert-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: #2196F3;
            color: white;
        }
        .btn-success {
            background: #4CAF50;
            color: white;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .filter-bar {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .filter-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .filter-btn.active {
            background: rgba(255,255,255,0.4);
        }
        .timestamp {
            font-size: 0.8em;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 إدارة التنبيهات</h1>
            <p>مراقبة وتنبيهات النظام في الوقت الفعلي</p>
        </div>

        <div class="nav-menu">
            <a href="/" class="nav-btn">الرئيسية</a>
            <a href="/dashboard/overview" class="nav-btn">نظرة عامة</a>
            <a href="/dashboard/metrics" class="nav-btn">المقاييس</a>
            <a href="/dashboard/performance" class="nav-btn">الأداء</a>
            <a href="/dashboard/alerts" class="nav-btn active">التنبيهات</a>
            <a href="/dashboard/analytics" class="nav-btn">التحليلات</a>
        </div>

        <div class="stats-row">
            <div class="stat-box">
                <div class="stat-number critical" id="criticalCount">0</div>
                <div class="stat-label">تنبيهات حرجة</div>
            </div>
            <div class="stat-box">
                <div class="stat-number warning" id="warningCount">0</div>
                <div class="stat-label">تحذيرات</div>
            </div>
            <div class="stat-box">
                <div class="stat-number info" id="infoCount">0</div>
                <div class="stat-label">معلومات</div>
            </div>
            <div class="stat-box">
                <div class="stat-number resolved" id="resolvedCount">0</div>
                <div class="stat-label">تم الحل</div>
            </div>
        </div>

        <div class="filter-bar">
            <span>تصفية التنبيهات:</span>
            <button class="filter-btn active" data-filter="all">الكل</button>
            <button class="filter-btn" data-filter="critical">حرجة</button>
            <button class="filter-btn" data-filter="warning">تحذيرات</button>
            <button class="filter-btn" data-filter="info">معلومات</button>
            <button class="filter-btn" data-filter="resolved">محلولة</button>
        </div>

        <div class="alert-grid" id="alertsContainer">
            <div class="alert-card alert-info">
                <div class="alert-header">
                    <div class="alert-title">🚀 النظام يعمل بشكل طبيعي</div>
                    <div class="alert-meta">
                        <span>معلومات</span>
                        <span class="timestamp">--:--</span>
                    </div>
                </div>
                <div class="alert-description">
                    جميع الخدمات تعمل بشكل طبيعي ولا توجد مشاكل في النظام.
                </div>
                <div class="alert-actions">
                    <span style="font-size: 0.9em; opacity: 0.7;">متصل بالإنترنت</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let alerts = [];
        let currentFilter = 'all';

        function updateStats() {
            const stats = {
                critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
                warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
                info: alerts.filter(a => a.severity === 'info' && !a.acknowledged).length,
                resolved: alerts.filter(a => a.acknowledged).length
            };

            document.getElementById('criticalCount').textContent = stats.critical;
            document.getElementById('warningCount').textContent = stats.warning;
            document.getElementById('infoCount').textContent = stats.info;
            document.getElementById('resolvedCount').textContent = stats.resolved;
        }

        function createAlertCard(alert) {
            const statusClass = alert.acknowledged ? 'alert-resolved' : `alert-${alert.severity}`;
            const statusText = alert.acknowledged ? 'محلول' : 
                              alert.severity === 'critical' ? 'حرج' :
                              alert.severity === 'warning' ? 'تحذير' : 'معلومات';

            return `
                <div class="alert-card ${statusClass}">
                    <div class="alert-header">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-meta">
                            <span>${statusText}</span>
                            <span class="timestamp">${new Date(alert.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                    </div>
                    <div class="alert-description">
                        ${alert.description}
                    </div>
                    ${alert.details ? `
                        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 0.9em;">
                            <strong>التفاصيل:</strong><br>
                            ${Object.entries(alert.details).map(([key, value]) => `${key}: ${value}`).join('<br>')}
                        </div>
                    ` : ''}
                    <div class="alert-actions">
                        ${!alert.acknowledged ? 
                            `<button class="btn btn-success" onclick="acknowledgeAlert('${alert.id}')">✅ تأكيد</button>` :
                            `<span style="color: #4CAF50;">✅ تم التأكيد - ${new Date(alert.acknowledgedAt).toLocaleString('ar-SA')}</span>`
                        }
                        <button class="btn btn-primary" onclick="viewAlertDetails('${alert.id}')">📋 تفاصيل</button>
                    </div>
                </div>
            `;
        }

        function renderAlerts() {
            const container = document.getElementById('alertsContainer');
            const filteredAlerts = currentFilter === 'all' ? 
                alerts : alerts.filter(alert => 
                    currentFilter === 'resolved' ? alert.acknowledged : 
                    alert.severity === currentFilter && !alert.acknowledged
                );

            container.innerHTML = filteredAlerts.length > 0 ? 
                filteredAlerts.map(createAlertCard).join('') :
                '<div class="alert-card alert-info"><div style="text-align: center; padding: 40px;">لا توجد تنبيهات لهذا التصنيف</div></div>';
        }

        function filterAlerts(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            renderAlerts();
        }

        function acknowledgeAlert(alertId) {
            socket.emit('acknowledge_alert', { alertId });
        }

        function viewAlertDetails(alertId) {
            const alert = alerts.find(a => a.id === alertId);
            if (alert) {
                alertModal.innerHTML = createAlertCard(alert);
                alertModal.style.display = 'flex';
            }
        }

        function addNewAlert(alert) {
            alert.id = alert.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            alerts.unshift(alert);
            
            // Keep only last 100 alerts
            if (alerts.length > 100) {
                alerts = alerts.slice(0, 100);
            }
            
            updateStats();
            renderAlerts();
        }

        // Add some sample alerts
        function generateSampleAlerts() {
            const sampleAlerts = [
                {
                    id: 'alert_1',
                    title: 'ارتفاع استخدام المعالج',
                    severity: 'warning',
                    description: 'استخدام المعالج وصل إلى 85% مما يتجاوز الحد المسموح',
                    details: {
                        'Current Usage': '85%',
                        'Threshold': '80%',
                        'Duration': '5 دقائق',
                        'Host': 'server-01.saler.com'
                    },
                    timestamp: new Date(Date.now() - 300000),
                    acknowledged: false
                },
                {
                    id: 'alert_2',
                    title: 'ارتفاع وقت الاستجابة',
                    severity: 'critical',
                    description: 'متوسط وقت الاستجابة وصل إلى 2.5 ثانية',
                    details: {
                        'Response Time': '2500ms',
                        'Threshold': '1000ms',
                        'Duration': '2 دقائق',
                        'Endpoint': '/api/v1/users'
                    },
                    timestamp: new Date(Date.now() - 180000),
                    acknowledged: false
                },
                {
                    id: 'alert_3',
                    title: 'تحديث قاعدة البيانات مكتمل',
                    severity: 'info',
                    description: 'تم تحديث قاعدة البيانات بنجاح إلى الإصدار الجديد',
                    details: {
                        'Previous Version': 'v2.1.3',
                        'New Version': 'v2.1.4',
                        'Duration': '15 دقيقة',
                        'Records Updated': '1,234'
                    },
                    timestamp: new Date(Date.now() - 3600000),
                    acknowledged: true,
                    acknowledgedAt: new Date(Date.now() - 3500000)
                }
            ];

            sampleAlerts.forEach(addNewAlert);
        }

        // Filter buttons event listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => filterAlerts(btn.dataset.filter));
        });

        // Socket event handlers
        socket.on('update', (data) => {
            if (data.dataType === 'alerts') {
                addNewAlert(data.data);
            }
        });

        socket.on('initial', (data) => {
            if (data.alerts) {
                alerts = data.alerts;
                updateStats();
                renderAlerts();
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            socket.emit('subscribe', ['alerts']);
            
            // Generate sample data
            generateSampleAlerts();
            
            fetch('/api/alerts')
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        alerts = data;
                        updateStats();
                        renderAlerts();
                    }
                })
                .catch(console.error);
        });

        // Modal functionality
        const alertModal = document.createElement('div');
        alertModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(alertModal);

        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                alertModal.style.display = 'none';
            }
        });
    </script>
</body>
</html>
        `;
    }

    generateAnalyticsDashboard() {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التحليلات المتقدمة - Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.0.1/dist/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav-menu {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .nav-btn.active, .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
            gap: 25px;
        }
        .analytics-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card-title {
            font-size: 1.3em;
            margin-bottom: 20px;
            text-align: center;
        }
        .chart-container {
            height: 350px;
            position: relative;
        }
        .insights {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        .insights h4 {
            margin-bottom: 15px;
            color: #4CAF50;
        }
        .insight-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid #4CAF50;
        }
        .recommendation {
            background: linear-gradient(45deg, #2196F3, #21CBF3);
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #1976D2;
        }
        .trend-indicator {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .trend-up { background: rgba(244, 67, 54, 0.3); color: #FFCDD2; }
        .trend-down { background: rgba(76, 175, 80, 0.3); color: #C8E6C9; }
        .trend-stable { background: rgba(255, 152, 0, 0.3); color: #FFE0B2; }
        .metric-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .comparison-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .comparison-label {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 8px;
        }
        .comparison-value {
            font-size: 1.5em;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 التحليلات المتقدمة</h1>
            <p>تحليل ذكي لأداء النظام مع التوصيات الآلية</p>
        </div>

        <div class="nav-menu">
            <a href="/" class="nav-btn">الرئيسية</a>
            <a href="/dashboard/overview" class="nav-btn">نظرة عامة</a>
            <a href="/dashboard/metrics" class="nav-btn">المقاييس</a>
            <a href="/dashboard/performance" class="nav-btn">الأداء</a>
            <a href="/dashboard/alerts" class="nav-btn">التنبيهات</a>
            <a href="/dashboard/analytics" class="nav-btn active">التحليلات</a>
        </div>

        <div class="analytics-grid">
            <div class="analytics-card">
                <div class="card-title">📈 اتجاهات الأداء</div>
                <div class="chart-container">
                    <canvas id="trendsChart"></canvas>
                </div>
                <div class="metric-comparison">
                    <div class="comparison-item">
                        <div class="comparison-label">آخر 24 ساعة</div>
                        <div class="comparison-value" id="currentPeriod">--</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">مقارنة بالفترة السابقة</div>
                        <div class="comparison-value">
                            <span id="comparisonChange">--</span>
                            <span class="trend-indicator trend-stable" id="trendIndicator">→</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🔍 تحليل الأخطاء</div>
                <div class="chart-container">
                    <canvas id="errorAnalysisChart"></canvas>
                </div>
                <div class="insights">
                    <h4>🔍 تحليل ذكي</h4>
                    <div class="insight-item">
                        <strong>أعلى معدل أخطاء:</strong> <span id="topErrorType">API Timeout</span>
                    </div>
                    <div class="insight-item">
                        <strong>أكثر الأوقات نشاطاً:</strong> <span id="peakHours">14:00-16:00</span>
                    </div>
                    <div class="insight-item">
                        <strong>معدل التعافي:</strong> <span id="recoveryRate">98.5%</span>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🎯 تحليل القدرات</div>
                <div class="chart-container">
                    <canvas id="capacityChart"></canvas>
                </div>
                <div class="recommendation">
                    <strong>💡 توصية:</strong>
                    <div id="capacityRecommendation">
                        النظام يعمل بكفاءة مثلى. لا توجد حاجة لإجراءات فورية.
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">⚠️ التنبؤ بالمشاكل</div>
                <div class="chart-container">
                    <canvas id="predictionChart"></canvas>
                </div>
                <div class="recommendation">
                    <strong>🚨 تنبيه تنبؤي:</strong>
                    <div id="predictionAlert">
                        <div>احتمالية ارتفاع المعالج في الساعتين القادمتين: <strong>25%</strong></div>
                        <div>احتمالية نفاد الذاكرة: <strong>10%</strong></div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">📊 مقارنة الفترات</div>
                <div class="chart-container">
                    <canvas id="comparisonChart"></canvas>
                </div>
                <div class="metric-comparison">
                    <div class="comparison-item">
                        <div class="comparison-label">تحسن في الاستجابة</div>
                        <div class="comparison-value">+15%</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">توفير في الموارد</div>
                        <div class="comparison-value">+8%</div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🔧 التوصيات الذكية</div>
                <div class="insights">
                    <h4>🎯 خطة التحسين</h4>
                    <div class="recommendation">
                        <strong>1. تحسين قاعدة البيانات:</strong>
                        <div>إضافة فهارس للجدول users لتقليل وقت الاستعلام بنسبة 40%</div>
                    </div>
                    <div class="recommendation">
                        <strong>2. تحسين الكاش:</strong>
                        <div>زيادة حجم الكاش من 1GB إلى 2GB لضمان معدل اصابة أعلى</div>
                    </div>
                    <div class="recommendation">
                        <strong>3. توسيع السعة:</strong>
                        <div>إمكانية زيادة الخوادم في الساعات العالية (14:00-18:00)</div>
                    </div>
                    <div class="recommendation">
                        <strong>4. مراقبة متقدمة:</strong>
                        <div>تفعيل مراقبة تفصيلية للطلبات البطيئة (> 2 ثانية)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        const charts = {};

        function initCharts() {
            const commonConfig = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                },
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            };

            // Trends Chart
            charts.trends = new Chart(document.getElementById('trendsChart'), {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    datasets: [
                        { label: 'وقت الاستجابة', data: [150, 120, 180, 250, 200, 140], borderColor: '#4CAF50', fill: false },
                        { label: 'المعدل', data: [800, 600, 900, 1200, 1000, 700], borderColor: '#2196F3', fill: false },
                        { label: 'معدل الخطأ', data: [2, 1, 3, 5, 3, 2], borderColor: '#F44336', fill: false }
                    ]
                },
                options: commonConfig
            });

            // Error Analysis Chart
            charts.errorAnalysis = new Chart(document.getElementById('errorAnalysisChart'), {
                type: 'doughnut',
                data: {
                    labels: ['API Timeout', 'Database Error', 'Network Error', 'Memory Error', 'Others'],
                    datasets: [{
                        data: [35, 25, 20, 12, 8],
                        backgroundColor: ['#F44336', '#FF9800', '#2196F3', '#9C27B0', '#607D8B']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: 'white' } }
                    }
                }
            });

            // Capacity Chart
            charts.capacity = new Chart(document.getElementById('capacityChart'), {
                type: 'bar',
                data: {
                    labels: ['CPU', 'Memory', 'Disk', 'Network'],
                    datasets: [
                        { label: 'المستخدم (%)', data: [65, 70, 45, 55], backgroundColor: '#4CAF50' },
                        { label: 'المتاح (%)', data: [35, 30, 55, 45], backgroundColor: '#9E9E9E' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                    },
                    plugins: {
                        legend: { labels: { color: 'white' } }
                    }
                }
            });

            // Prediction Chart
            charts.prediction = new Chart(document.getElementById('predictionChart'), {
                type: 'line',
                data: {
                    labels: ['الآن', '+1س', '+2س', '+4س', '+6س', '+8س'],
                    datasets: [
                        { label: 'احتمالية المشكلة', data: [10, 15, 25, 35, 20, 15], borderColor: '#F44336', fill: true },
                        { label: 'مستوى الأمان', data: [90, 85, 75, 65, 80, 85], borderColor: '#4CAF50', fill: true }
                    ]
                },
                options: commonConfig
            });

            // Comparison Chart
            charts.comparison = new Chart(document.getElementById('comparisonChart'), {
                type: 'bar',
                data: {
                    labels: ['وقت الاستجابة', 'المعدل', 'معدل الخطأ', 'استخدام المعالج', 'استخدام الذاكرة'],
                    datasets: [
                        { label: 'الأسبوع الحالي', data: [180, 950, 2.5, 65, 70], backgroundColor: '#2196F3' },
                        { label: 'الأسبوع السابق', data: [210, 850, 3.8, 75, 80], backgroundColor: '#9E9E9E' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.1)' } }
                    },
                    plugins: {
                        legend: { labels: { color: 'white' } }
                    }
                }
            });
        }

        function updateComparisonData() {
            const currentValue = Math.random() * 200 + 100;
            const previousValue = Math.random() * 200 + 100;
            const change = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
            
            document.getElementById('currentPeriod').textContent = currentValue.toFixed(0);
            document.getElementById('comparisonChange').textContent = `${change > 0 ? '+' : ''}${change}%`;
            
            const indicator = document.getElementById('trendIndicator');
            const trendClass = change > 5 ? 'trend-up' : change < -5 ? 'trend-down' : 'trend-stable';
            const trendSymbol = change > 5 ? '↑' : change < -5 ? '↓' : '→';
            
            indicator.className = `trend-indicator ${trendClass}`;
            indicator.textContent = trendSymbol;
        }

        socket.on('update', (data) => {
            if (data.dataType === 'analytics') {
                updateComparisonData();
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initCharts();
            updateComparisonData();
            
            socket.emit('subscribe', ['analytics']);
            
            fetch('/api/trends')
                .then(response => response.json())
                .then(data => {
                    if (data.analytics) {
                        // Update analytics data if available
                    }
                })
                .catch(console.error);
        });
    </script>
</body>
</html>
        `;
    }

    start() {
        const serverOptions = {};
        if (this.config.enableSSL) {
            serverOptions.key = fs.readFileSync(this.config.sslKey);
            serverOptions.cert = fs.readFileSync(this.config.sslCert);
        }

        this.server = this.app.listen(this.config.port, () => {
            console.log(`🎛️ Dashboard visualization server started on port ${this.config.port}`);
            console.log(`🌐 Dashboard available at: http://localhost:${this.config.port}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());

        return this.server;
    }

    shutdown() {
        console.log('🛑 Shutting down dashboard visualization system...');
        
        if (this.server) {
            this.server.close();
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        // Close all WebSocket connections
        this.clients.forEach(client => {
            try {
                client.ws.close();
            } catch (error) {
                console.error('Error closing client connection:', error);
            }
        });
        
        console.log('✅ Dashboard visualization system shutdown complete');
    }
}

module.exports = DashboardVisualizationSystem;

// Example usage
if (require.main === module) {
    const dashboard = new DashboardVisualizationSystem({
        port: 3000,
        updateInterval: 1000,
        dataRetention: 86400,
        enableSSL: false
    });
    
    dashboard.start();
    
    console.log('🚀 Advanced Dashboard Visualization System Started');
    console.log('📊 Access dashboard at: http://localhost:3000');
}