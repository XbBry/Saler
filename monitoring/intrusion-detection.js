/**
 * نظام كشف التسلل
 * Intrusion Detection System
 */

const EventEmitter = require('events');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class IntrusionDetectionSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoringPaths: config.monitoringPaths || ['/var/log', '/var/www', '/home'],
      logFiles: config.logFiles || [
        '/var/log/auth.log',
        '/var/log/syslog',
        '/var/log/secure',
        '/var/log/nginx/access.log',
        '/var/log/nginx/error.log'
      ],
      maxLogSize: config.maxLogSize || 100 * 1024 * 1024, // 100MB
      alertThreshold: config.alertThreshold || 10,
      checkInterval: config.checkInterval || 30000, // 30 seconds
      enableFileIntegrity: config.enableFileIntegrity !== false,
      enableNetworkMonitoring: config.enableNetworkMonitoring !== false,
      enableProcessMonitoring: config.enableProcessMonitoring !== false,
      enableUserActivity: config.enableUserActivity !== false,
      quarantineEnabled: config.quarantineEnabled !== false,
      quarantinePath: config.quarantinePath || './quarantine',
      ...config
    };
    
    // إعداد نظام السجلات
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'intrusion_detection.log' }),
        new winston.transports.Console()
      ]
    });
    
    // إعدادات المراقبة
    this.monitoring = {
      fileIntegrity: new Map(),
      networkConnections: new Map(),
      processes: new Map(),
      userActivity: new Map(),
      suspiciousPatterns: new Map()
    };
    
    // إنشاء مجلد العزل
    if (this.config.quarantineEnabled && !fs.existsSync(this.config.quarantinePath)) {
      fs.mkdirSync(this.config.quarantinePath, { recursive: true });
    }
    
    // قواعد كشف التسلل
    this.intrusionRules = this.loadIntrusionRules();
    
    // إحصائيات
    this.stats = {
      totalAlerts: 0,
      criticalAlerts: 0,
      blockedAttempts: 0,
      startTime: Date.now(),
      lastScan: null
    };
    
    this.initializeMonitoring();
  }
  
  /**
   * تحميل قواعد كشف التسلل
   */
  loadIntrusionRules() {
    return {
      // أنماط الهجمات الشائعة
      attackPatterns: [
        {
          name: 'SQL Injection',
          pattern: /(\bunion\s+select\b|\bdrop\s+table\b|\binsert\s+into\b|\bor\s+1=1\b)/gi,
          severity: 'high',
          category: 'web_attack',
          description: 'Potential SQL injection attack detected'
        },
        {
          name: 'XSS Attack',
          pattern: /(<script[^>]*>.*?<\/script>)|(javascript:)|(on\w+\s*=)/gi,
          severity: 'medium',
          category: 'web_attack',
          description: 'Potential cross-site scripting attack'
        },
        {
          name: 'Path Traversal',
          pattern: /(\.\.\/)|(\.\.\\)|(\.\.%2f)|(\.\.%5c)/gi,
          severity: 'high',
          category: 'web_attack',
          description: 'Potential directory traversal attack'
        },
        {
          name: 'Command Injection',
          pattern: /([;&|`$])\s*[\w-]+\s*\1|(?:wget|curl|nc|netcat)\s+[\w\.\/-]+/gi,
          severity: 'critical',
          category: 'system_attack',
          description: 'Potential command injection attack'
        },
        {
          name: 'File Upload Attack',
          pattern: /(\.php$|\.jsp$|\.asp$|\.aspx$|\.sh$|\.exe$|\.bat$)/gi,
          severity: 'high',
          category: 'web_attack',
          description: 'Suspicious file upload detected'
        }
      ],
      
      // أنماط الأنشطة المشبوهة
      suspiciousPatterns: [
        {
          name: 'Multiple Failed Logins',
          pattern: /(authentication failure|failed login|invalid user|bad login)/gi,
          severity: 'medium',
          category: 'brute_force',
          description: 'Multiple failed login attempts detected'
        },
        {
          name: 'Privilege Escalation',
          pattern: /(sudo|suid|setuid|cap_setuid)/gi,
          severity: 'high',
          category: 'privilege_escalation',
          description: 'Potential privilege escalation attempt'
        },
        {
          name: 'Suspicious Network Activity',
          pattern: /(port scan|nmap|masscan|scanner)/gi,
          severity: 'medium',
          category: 'network_attack',
          description: 'Suspicious network scanning activity'
        },
        {
          name: 'Data Exfiltration',
          pattern: /(base64|encode|encode64|compress|dd\s+if=)/gi,
          severity: 'high',
          category: 'data_exfiltration',
          description: 'Potential data exfiltration attempt'
        }
      ],
      
      // أنماط الملفات المشبوهة
      filePatterns: [
        {
          name: 'Hidden Executable',
          pattern: /^\.(bash|profile|rc|bashrc|sh)$/,
          severity: 'medium',
          category: 'malicious_file',
          description: 'Hidden executable file detected'
        },
        {
          name: 'Suspicious File Extension',
          pattern: /(\.php\d*$|\.phtml$|\.phar$|\.phpt$|\.phps$)/gi,
          severity: 'low',
          category: 'malicious_file',
          description: 'Suspicious PHP file extension'
        },
        {
          name: 'Encrypted Archive',
          pattern: /(\.enc$|\.crypt$|\.locked$|\.crypto$)/gi,
          severity: 'critical',
          category: 'ransomware',
          description: 'Encrypted file detected (potential ransomware)'
        }
      ]
    };
  }
  
  /**
   * تهيئة المراقبة
   */
  initializeMonitoring() {
    this.logger.info('Initializing intrusion detection system');
    
    // مراقبة سلامة الملفات
    if (this.config.enableFileIntegrity) {
      this.initializeFileIntegrityMonitoring();
    }
    
    // مراقبة الشبكة
    if (this.config.enableNetworkMonitoring) {
      this.initializeNetworkMonitoring();
    }
    
    // مراقبة العمليات
    if (this.config.enableProcessMonitoring) {
      this.initializeProcessMonitoring();
    }
    
    // مراقبة أنشطة المستخدم
    if (this.config.enableUserActivity) {
      this.initializeUserActivityMonitoring();
    }
    
    // بدء مراقبة السجلات
    this.startLogMonitoring();
  }
  
  /**
   * تهيئة مراقبة سلامة الملفات
   */
  initializeFileIntegrityMonitoring() {
    this.logger.info('Initializing file integrity monitoring');
    
    // إنشاء فهارس الملفات
    for (const monitoringPath of this.config.monitoringPaths) {
      this.scanDirectory(monitoringPath);
    }
    
    // بدء مراقبة دورية
    setInterval(() => {
      this.performFileIntegrityCheck();
    }, this.config.checkInterval);
  }
  
  /**
   * فحص مجلد وملفاته
   */
  scanDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }
      
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          this.createFileHash(filePath);
        } else if (stat.isDirectory() && !file.startsWith('.')) {
          this.scanDirectory(filePath);
        }
      }
      
    } catch (error) {
      this.logger.error('Error scanning directory', { dirPath, error: error.message });
    }
  }
  
  /**
   * إنشاء hash للملف
   */
  createFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const stat = fs.statSync(filePath);
      
      this.monitoring.fileIntegrity.set(filePath, {
        hash,
        size: stat.size,
        mtime: stat.mtime,
        mode: stat.mode,
        uid: stat.uid,
        gid: stat.gid,
        firstSeen: Date.now()
      });
      
    } catch (error) {
      this.logger.debug('Error creating file hash', { filePath, error: error.message });
    }
  }
  
  /**
   * فحص سلامة الملفات
   */
  performFileIntegrityCheck() {
    const alerts = [];
    
    for (const [filePath, originalHash] of this.monitoring.fileIntegrity.entries()) {
      try {
        if (!fs.existsSync(filePath)) {
          // ملف محذوف
          alerts.push({
            type: 'FILE_DELETED',
            severity: 'medium',
            message: `Monitored file has been deleted: ${filePath}`,
            filePath,
            timestamp: Date.now()
          });
          continue;
        }
        
        const currentContent = fs.readFileSync(filePath);
        const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
        const currentStat = fs.statSync(filePath);
        
        if (currentHash !== originalHash.hash) {
          // الملف تغير
          alerts.push({
            type: 'FILE_MODIFIED',
            severity: 'high',
            message: `Monitored file has been modified: ${filePath}`,
            filePath,
            originalHash: originalHash.hash,
            newHash: currentHash,
            timestamp: Date.now()
          });
          
          // عزل الملف المشبوه
          if (this.config.quarantineEnabled) {
            this.quarantineFile(filePath);
          }
        }
        
        if (currentStat.size !== originalHash.size) {
          alerts.push({
            type: 'FILE_SIZE_CHANGED',
            severity: 'low',
            message: `File size changed: ${filePath}`,
            filePath,
            originalSize: originalHash.size,
            newSize: currentStat.size,
            timestamp: Date.now()
          });
        }
        
        if (currentStat.mtime.getTime() !== originalHash.mtime.getTime()) {
          alerts.push({
            type: 'FILE_MTIME_CHANGED',
            severity: 'low',
            message: `File modification time changed: ${filePath}`,
            filePath,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        this.logger.error('Error checking file integrity', { filePath, error: error.message });
      }
    }
    
    if (alerts.length > 0) {
      this.processAlerts(alerts);
    }
  }
  
  /**
   * عزل ملف مشبوه
   */
  quarantineFile(filePath) {
    try {
      const fileName = path.basename(filePath);
      const quarantineFileName = `${Date.now()}_${fileName}`;
      const quarantineFilePath = path.join(this.config.quarantinePath, quarantineFileName);
      
      // نسخ الملف إلى مجلد العزل
      fs.copyFileSync(filePath, quarantineFilePath);
      
      this.logger.warn('File quarantined', {
        originalPath: filePath,
        quarantinePath: quarantineFilePath
      });
      
    } catch (error) {
      this.logger.error('Error quarantining file', { filePath, error: error.message });
    }
  }
  
  /**
   * تهيئة مراقبة الشبكة
   */
  initializeNetworkMonitoring() {
    this.logger.info('Initializing network monitoring');
    
    // مراقبة الاتصالات الشبكية
    setInterval(() => {
      this.checkNetworkConnections();
    }, this.config.checkInterval);
  }
  
  /**
   * فحص الاتصالات الشبكية
   */
  async checkNetworkConnections() {
    try {
      // فحص الاتصالات النشطة
      const { stdout } = await execPromise('netstat -tuln 2>/dev/null || ss -tuln');
      const connections = this.parseNetworkConnections(stdout);
      
      // فحص الاتصالات المشبوهة
      for (const conn of connections) {
        this.checkSuspiciousConnection(conn);
      }
      
    } catch (error) {
      this.logger.debug('Error checking network connections', { error: error.message });
    }
  }
  
  /**
   * تحليل الاتصالات الشبكية
   */
  parseNetworkConnections(output) {
    const connections = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const protocol = parts[0];
        const localAddress = parts[3];
        
        if (protocol.includes('tcp') || protocol.includes('udp')) {
          connections.push({
            protocol,
            localAddress,
            port: this.extractPort(localAddress),
            isListening: parts[0].includes('LISTEN')
          });
        }
      }
    }
    
    return connections;
  }
  
  /**
   * استخراج رقم المنفذ
   */
  extractPort(address) {
    const match = address.match(/:(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
  
  /**
   * فحص اتصال مشبوه
   */
  checkSuspiciousConnection(connection) {
    const suspiciousPorts = [22, 23, 135, 139, 445, 1433, 3306, 5432, 3389];
    
    if (suspiciousPorts.includes(connection.port)) {
      this.logger.warn('Suspicious network connection', connection);
      
      this.emit('alert', {
        type: 'SUSPICIOUS_NETWORK',
        severity: 'medium',
        message: `Connection to suspicious port: ${connection.port}`,
        details: connection,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * تهيئة مراقبة العمليات
   */
  initializeProcessMonitoring() {
    this.logger.info('Initializing process monitoring');
    
    setInterval(() => {
      this.checkProcesses();
    }, this.config.checkInterval);
  }
  
  /**
   * فحص العمليات
   */
  async checkProcesses() {
    try {
      const { stdout } = await execPromise('ps aux');
      const processes = this.parseProcesses(stdout);
      
      for (const process of processes) {
        this.checkSuspiciousProcess(process);
      }
      
    } catch (error) {
      this.logger.debug('Error checking processes', { error: error.message });
    }
  }
  
  /**
   * تحليل العمليات
   */
  parseProcesses(output) {
    const processes = [];
    const lines = output.split('\n').slice(1); // تخطي رأس الجدول
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          user: parts[0],
          pid: parseInt(parts[1], 10),
          cpu: parseFloat(parts[2]),
          mem: parseFloat(parts[3]),
          command: parts.slice(10).join(' ')
        });
      }
    }
    
    return processes;
  }
  
  /**
   * فحص عملية مشبوهة
   */
  checkSuspiciousProcess(process) {
    const suspiciousCommands = ['nc', 'netcat', 'tcpdump', 'wireshark', 'nmap', 'masscan'];
    const suspiciousArgs = ['shell', 'reverse', 'backdoor', 'exploit'];
    
    const command = process.command.toLowerCase();
    
    // فحص الأوامر المشبوهة
    if (suspiciousCommands.some(cmd => command.includes(cmd))) {
      this.emit('alert', {
        type: 'SUSPICIOUS_PROCESS',
        severity: 'high',
        message: `Suspicious process detected: ${process.command}`,
        details: process,
        timestamp: Date.now()
      });
    }
    
    // فحص المعاملات المشبوهة
    if (suspiciousArgs.some(arg => command.includes(arg))) {
      this.emit('alert', {
        type: 'SUSPICIOUS_PROCESS',
        severity: 'medium',
        message: `Process with suspicious arguments: ${process.command}`,
        details: process,
        timestamp: Date.now()
      });
    }
    
    // فحص استخدام CPU عالي
    if (process.cpu > 80) {
      this.emit('alert', {
        type: 'HIGH_CPU_USAGE',
        severity: 'low',
        message: `High CPU usage process: ${process.command}`,
        details: process,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * تهيئة مراقبة أنشطة المستخدم
   */
  initializeUserActivityMonitoring() {
    this.logger.info('Initializing user activity monitoring');
    
    setInterval(() => {
      this.checkUserActivity();
    }, this.config.checkInterval);
  }
  
  /**
   * فحص أنشطة المستخدم
   */
  async checkUserActivity() {
    try {
      // فحص آخر تسجيلات الدخول
      const { stdout } = await execPromise('last -n 10 2>/dev/null || who');
      const logins = this.parseUserLogins(stdout);
      
      for (const login of logins) {
        this.checkSuspiciousLogin(login);
      }
      
    } catch (error) {
      this.logger.debug('Error checking user activity', { error: error.message });
    }
  }
  
  /**
   * تحليل تسجيلات الدخول
   */
  parseUserLogins(output) {
    const logins = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        logins.push({
          user: parts[0],
          terminal: parts[1],
          host: parts[2],
          timestamp: new Date(parts.slice(3).join(' ')).getTime()
        });
      }
    }
    
    return logins;
  }
  
  /**
   * فحص تسجيل دخول مشبوه
   */
  checkSuspiciousLogin(login) {
    // فحص تسجيلات الدخول الخارجية
    if (login.host && !['localhost', '127.0.0.1'].includes(login.host)) {
      this.emit('alert', {
        type: 'REMOTE_LOGIN',
        severity: 'low',
        message: `Remote login detected: ${login.user} from ${login.host}`,
        details: login,
        timestamp: Date.now()
      });
    }
    
    // فحص تسجيل الدخول root
    if (login.user === 'root') {
      this.emit('alert', {
        type: 'ROOT_LOGIN',
        severity: 'medium',
        message: 'Root user login detected',
        details: login,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * بدء مراقبة السجلات
   */
  startLogMonitoring() {
    this.logger.info('Starting log file monitoring');
    
    for (const logFile of this.config.logFiles) {
      this.monitorLogFile(logFile);
    }
  }
  
  /**
   * مراقبة ملف سجل
   */
  monitorLogFile(logFile) {
    if (!fs.existsSync(logFile)) {
      return;
    }
    
    try {
      const stats = fs.statSync(logFile);
      let position = stats.size;
      
      const watchInterval = setInterval(() => {
        try {
          if (!fs.existsSync(logFile)) {
            clearInterval(watchInterval);
            return;
          }
          
          const currentStats = fs.statSync(logFile);
          
          if (currentStats.size < position) {
            // الملف تم تدويره
            position = 0;
          }
          
          if (currentStats.size > position) {
            const stream = fs.createReadStream(logFile, { start: position });
            
            stream.on('data', (chunk) => {
              const lines = chunk.toString().split('\n');
              for (const line of lines) {
                this.analyzeLogLine(line, logFile);
              }
            });
            
            stream.on('end', () => {
              position = currentStats.size;
            });
            
            stream.on('error', (error) => {
              this.logger.error('Error reading log file', { logFile, error: error.message });
            });
          }
          
        } catch (error) {
          this.logger.error('Error monitoring log file', { logFile, error: error.message });
        }
      }, 5000); // فحص كل 5 ثوان
      
    } catch (error) {
      this.logger.error('Error setting up log monitoring', { logFile, error: error.message });
    }
  }
  
  /**
   * تحليل سطر من السجل
   */
  analyzeLogLine(line, logFile) {
    if (!line.trim()) return;
    
    // فحص الأنماط الهجومية
    for (const rule of this.intrusionRules.attackPatterns) {
      if (rule.pattern.test(line)) {
        this.processIntrusionAlert({
          type: rule.category,
          severity: rule.severity,
          message: rule.description,
          details: { logFile, line },
          timestamp: Date.now()
        });
        
        // إعادة تعيين regex state
        rule.pattern.lastIndex = 0;
      }
    }
    
    // فحص الأنماط المشبوهة
    for (const rule of this.intrusionRules.suspiciousPatterns) {
      if (rule.pattern.test(line)) {
        this.processSuspiciousActivity({
          type: rule.category,
          severity: rule.severity,
          message: rule.description,
          details: { logFile, line },
          timestamp: Date.now()
        });
        
        rule.pattern.lastIndex = 0;
      }
    }
  }
  
  /**
   * معالجة تنبيه تسلل
   */
  processIntrusionAlert(alert) {
    this.logger.warn('Intrusion detected', alert);
    
    this.stats.totalAlerts++;
    if (alert.severity === 'critical') {
      this.stats.criticalAlerts++;
    }
    
    this.emit('intrusion', alert);
    
    // إجراءات فورية للتهديدات الحرجة
    if (alert.severity === 'critical') {
      this.takeImmediateAction(alert);
    }
  }
  
  /**
   * معالجة نشاط مشبوه
   */
  processSuspiciousActivity(alert) {
    this.logger.info('Suspicious activity detected', alert);
    
    this.stats.totalAlerts++;
    this.emit('suspicious_activity', alert);
  }
  
  /**
   * معالجة التنبيهات
   */
  processAlerts(alerts) {
    for (const alert of alerts) {
      if (alert.type === 'FILE_MODIFIED' || alert.type === 'FILE_DELETED') {
        this.processFileIntegrityAlert(alert);
      } else {
        this.emit('alert', alert);
      }
    }
  }
  
  /**
   * معالجة تنبيه سلامة الملف
   */
  processFileIntegrityAlert(alert) {
    this.logger.warn('File integrity alert', alert);
    
    // تحديث فهرس الملفات
    if (alert.type === 'FILE_MODIFIED') {
      this.monitoring.fileIntegrity.delete(alert.filePath);
      this.createFileHash(alert.filePath);
    }
    
    this.emit('file_integrity_alert', alert);
  }
  
  /**
   * إجراءات فورية للتهديدات الحرجة
   */
  takeImmediateAction(alert) {
    this.logger.error('Taking immediate action for critical threat', alert);
    
    // حظر IP إذا كان متاحاً
    if (alert.details && alert.details.sourceIP) {
      this.blockSuspiciousIP(alert.details.sourceIP);
    }
    
    // إيقاف العملية المشبوهة
    if (alert.details && alert.details.pid) {
      this.terminateProcess(alert.details.pid);
    }
    
    // إرسال تنبيه طارئ
    this.emit('critical_alert', alert);
  }
  
  /**
   * حظر IP مشبوه
   */
  blockSuspiciousIP(ip) {
    try {
      // إضافة قاعدة جدار الحماية
      exec(`iptables -A INPUT -s ${ip} -j DROP`, (error) => {
        if (error) {
          this.logger.error('Failed to block IP', { ip, error: error.message });
        } else {
          this.logger.info('IP blocked', { ip });
          this.stats.blockedAttempts++;
        }
      });
      
    } catch (error) {
      this.logger.error('Error blocking IP', { ip, error: error.message });
    }
  }
  
  /**
   * إيقاف عملية
   */
  terminateProcess(pid) {
    try {
      process.kill(pid, 'SIGKILL');
      this.logger.info('Process terminated', { pid });
      this.stats.blockedAttempts++;
      
    } catch (error) {
      this.logger.error('Failed to terminate process', { pid, error: error.message });
    }
  }
  
  /**
   * الحصول على الإحصائيات
   */
  getStatistics() {
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      uptime_seconds: Math.floor(uptime / 1000),
      monitored_files: this.monitoring.fileIntegrity.size,
      last_scan: this.stats.lastScan,
      alerts_per_hour: this.stats.totalAlerts / (uptime / (1000 * 60 * 60))
    };
  }
  
  /**
   * بدء المراقبة
   */
  start() {
    this.logger.info('Starting intrusion detection system');
    
    this.monitoringInterval = setInterval(() => {
      this.stats.lastScan = Date.now();
    }, this.config.checkInterval);
  }
  
  /**
   * إيقاف المراقبة
   */
  stop() {
    this.logger.info('Stopping intrusion detection system');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.emit('system_stopped');
  }
}

// تصدير الكلاس
module.exports = IntrusionDetectionSystem;

// مثال على الاستخدام
if (require.main === module) {
  const ids = new IntrusionDetectionSystem({
    monitoringPaths: ['/var/www/html', '/home'],
    checkInterval: 15000,
    quarantineEnabled: true,
    enableFileIntegrity: true,
    enableNetworkMonitoring: true,
    enableProcessMonitoring: true
  });
  
  // تسجيل مستمعي الأحداث
  ids.on('intrusion', (alert) => {
    console.log('🚨 INTRUSION DETECTED:', alert);
  });
  
  ids.on('suspicious_activity', (alert) => {
    console.log('⚠️ SUSPICIOUS ACTIVITY:', alert);
  });
  
  ids.on('alert', (alert) => {
    console.log('🔔 ALERT:', alert);
  });
  
  ids.on('critical_alert', (alert) => {
    console.log('🆘 CRITICAL ALERT:', alert);
    // إرسال تنبيه طارئ
  });
  
  // بدء المراقبة
  ids.start();
  
  // عرض الإحصائيات كل دقيقة
  setInterval(() => {
    const stats = ids.getStatistics();
    console.log('📊 IDS Statistics:', JSON.stringify(stats, null, 2));
  }, 60000);
  
  // إيقاف نظيفة
  process.on('SIGINT', () => {
    console.log('\nShutting down IDS...');
    ids.stop();
    process.exit(0);
  });
}