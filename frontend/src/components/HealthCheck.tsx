/**
 * Health Check Component for Saler Frontend
 * =========================================
 * 
 * This component provides comprehensive health monitoring for the application,
 * including system status, API connectivity, and real-time health updates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Progress,
  Grid,
  GridItem,
  Icon,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  useColorModeValue,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Code,
  Select
} from '@chakra-ui/react';
import {
  FiActivity,
  FiDatabase,
  FiServer,
  FiHardDrive,
  FiCpu,
  FiMemoryStick,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';

// Types for health data
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  responseTimeMs: number;
  connectionCount: number;
  error?: string;
}

interface RedisHealth {
  status: 'healthy' | 'unhealthy';
  responseTimeMs: number;
  memoryUsage: number;
  error?: string;
}

interface SystemHealth {
  cpuPercent: number;
  memoryPercent: number;
  diskUsagePercent: number;
  loadAverage: number[];
}

interface DependencyHealth {
  database: DatabaseHealth;
  redis: RedisHealth;
}

interface ApplicationHealth {
  health: HealthStatus;
  system: SystemHealth;
  dependencies: DependencyHealth;
  services: Record<string, any>;
}

interface SystemInfo {
  status: 'healthy' | 'warning' | 'critical';
  totalGb: number;
  usedGb: number;
  freeGb: number;
  usagePercent: number;
}

interface MemoryInfo {
  status: 'healthy' | 'warning' | 'critical';
  totalMb: number;
  usedMb: number;
  availableMb: number;
  usagePercent: number;
}

// Main Health Check Component
const HealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<ApplicationHealth | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Color scheme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const successColor = 'green.500';
  const warningColor = 'yellow.500';
  const errorColor = 'red.500';

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch comprehensive health data
      const healthResponse = await fetch(`${API_BASE}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.statusText}`);
      }
      const health = await healthResponse.json();
      
      // Fetch system health
      const systemResponse = await fetch(`${API_BASE}/health/system`);
      const system = systemResponse.ok ? await systemResponse.json() : null;
      
      setHealthData(health);
      setSystemInfo(system);
      setLastUpdate(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, loading]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchHealthData]);

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Helper functions
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return successColor;
      case 'warning':
        return warningColor;
      case 'unhealthy':
      case 'critical':
        return errorColor;
      default:
        return 'gray.500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return FiCheckCircle;
      case 'warning':
        return FiAlertTriangle;
      case 'unhealthy':
      case 'critical':
        return FiAlertTriangle;
      default:
        return FiActivity;
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Render status badge
  const StatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
    const color = getStatusColor(status);
    const IconComponent = getStatusIcon(status);
    
    return (
      <Badge
        colorScheme={status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red'}
        variant="solid"
        px={3}
        py={1}
        borderRadius="md"
      >
        <HStack spacing={2}>
          <Icon as={IconComponent} />
          <Text>{label || status}</Text>
        </HStack>
      </Badge>
    );
  };

  // Render metric card
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    helpText?: string;
  }> = ({ title, value, icon, color, helpText }) => (
    <Card>
      <CardBody>
        <HStack spacing={4}>
          <Box p={3} borderRadius="md" bg={`${color}.100`}>
            <Icon as={icon} boxSize={6} color={color} />
          </Box>
          <Box flex={1}>
            <Text fontSize="sm" color="gray.600" mb={1}>
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
            {helpText && (
              <Text fontSize="xs" color="gray.500">
                {helpText}
              </Text>
            )}
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );

  // Render progress bar
  const ProgressBar: React.FC<{
    label: string;
    value: number;
    max: number;
    colorScheme?: string;
  }> = ({ label, value, max, colorScheme = 'blue' }) => {
    const percentage = Math.round((value / max) * 100);
    const progressColor = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : colorScheme;
    
    return (
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            {label}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {value} / {max} ({percentage}%)
          </Text>
        </HStack>
        <Progress
          value={percentage}
          colorScheme={progressColor}
          size="lg"
          borderRadius="md"
        />
      </Box>
    );
  };

  // Error state
  if (error && !healthData) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Health Check Failed!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={2}>
              <Heading size="lg">System Health Monitor</Heading>
              <Text color="gray.600">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Text>
            </VStack>
            
            <VStack align="end" spacing={2}>
              <HStack>
                <Select
                  size="sm"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  width="120px"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </Select>
                <Button
                  size="sm"
                  leftIcon={<FiRefreshCw />}
                  onClick={fetchHealthData}
                  isLoading={loading}
                  loadingText="Refreshing"
                >
                  Refresh
                </Button>
              </HStack>
              <Button
                size="sm"
                variant={autoRefresh ? 'solid' : 'outline'}
                colorScheme={autoRefresh ? 'green' : 'gray'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </VStack>
          </HStack>
        </Box>

        {/* Overall Status */}
        {healthData && (
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Overall Status</Heading>
                <StatusBadge status={healthData.health.status} />
              </HStack>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                <MetricCard
                  title="Uptime"
                  value={formatUptime(healthData.health.uptime)}
                  icon={FiClock}
                  color="blue"
                />
                <MetricCard
                  title="Version"
                  value={healthData.health.version}
                  icon={FiServer}
                  color="purple"
                />
                <MetricCard
                  title="Environment"
                  value={healthData.health.environment}
                  icon={FiActivity}
                  color="green"
                />
                <MetricCard
                  title="Database"
                  value={`${healthData.dependencies.database.connectionCount} connections`}
                  icon={FiDatabase}
                  color={getStatusColor(healthData.dependencies.database.status)}
                />
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* System Resources */}
        {healthData && (
          <Card>
            <CardHeader>
              <Heading size="md">System Resources</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <ProgressBar
                  label="CPU Usage"
                  value={healthData.system.cpuPercent}
                  max={100}
                />
                <ProgressBar
                  label="Memory Usage"
                  value={healthData.system.memoryPercent}
                  max={100}
                />
                <ProgressBar
                  label="Disk Usage"
                  value={healthData.system.diskUsagePercent}
                  max={100}
                />
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mt={4}>
                  <Stat>
                    <StatLabel>CPU Cores</StatLabel>
                    <StatNumber>{navigator.hardwareConcurrency || 'N/A'}</StatNumber>
                    <StatHelpText>Available cores</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Load Average</StatLabel>
                    <StatNumber>
                      {healthData.system.loadAverage.slice(0, 2).join(', ')}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      System load
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Memory</StatLabel>
                    <StatNumber>
                      {formatBytes((window.performance as any)?.memory?.usedJSHeapSize || 0)}
                    </StatNumber>
                    <StatHelpText>Browser memory usage</StatHelpText>
                  </Stat>
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Dependencies Status */}
        {healthData && (
          <Card>
            <CardHeader>
              <Heading size="md">Dependencies</Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Service</Th>
                    <Th>Status</Th>
                    <Th>Response Time</Th>
                    <Th>Details</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>
                      <HStack>
                        <Icon as={FiDatabase} />
                        <Text>PostgreSQL</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <StatusBadge status={healthData.dependencies.database.status} />
                    </Td>
                    <Td>{formatResponseTime(healthData.dependencies.database.responseTimeMs)}</Td>
                    <Td>
                      <Tooltip
                        label={healthData.dependencies.database.error || 'Connection count'}
                        hasArrow
                      >
                        <Text fontSize="sm">
                          {healthData.dependencies.database.connectionCount} active connections
                        </Text>
                      </Tooltip>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>
                      <HStack>
                        <Icon as={FiServer} />
                        <Text>Redis</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <StatusBadge status={healthData.dependencies.redis.status} />
                    </Td>
                    <Td>{formatResponseTime(healthData.dependencies.redis.responseTimeMs)}</Td>
                    <Td>
                      <Tooltip
                        label={healthData.dependencies.redis.error || 'Memory usage'}
                        hasArrow
                      >
                        <Text fontSize="sm">
                          {formatBytes(healthData.dependencies.redis.memoryUsage)}
                        </Text>
                      </Tooltip>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* System Information (if available) */}
        {systemInfo && (
          <Card>
            <CardHeader>
              <Heading size="md">Detailed System Information</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                {/* Disk Information */}
                {systemInfo.disk && (
                  <Box>
                    <Heading size="sm" mb={3}>
                      Disk Storage
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <ProgressBar
                        label="Disk Usage"
                        value={systemInfo.disk.usagePercent}
                        max={100}
                        colorScheme="blue"
                      />
                      <Text fontSize="sm" color="gray.600">
                        Total: {systemInfo.disk.totalGb}GB | 
                        Used: {systemInfo.disk.usedGb}GB | 
                        Free: {systemInfo.disk.freeGb}GB
                      </Text>
                    </VStack>
                  </Box>
                )}

                {/* Memory Information */}
                {systemInfo.memory && (
                  <Box>
                    <Heading size="sm" mb={3}>
                      Memory Usage
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <ProgressBar
                        label="Memory Usage"
                        value={systemInfo.memory.usagePercent}
                        max={100}
                        colorScheme="green"
                      />
                      <Text fontSize="sm" color="gray.600">
                        Total: {systemInfo.memory.totalMb}MB | 
                        Used: {systemInfo.memory.usedMb}MB | 
                        Available: {systemInfo.memory.availableMb}MB
                      </Text>
                    </VStack>
                  </Box>
                )}
              </Grid>

              {/* Process Information */}
              {systemInfo.processes && systemInfo.processes.status === 'healthy' && (
                <Box mt={6}>
                  <Heading size="sm" mb={3}>
                    Top Processes
                  </Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Total Processes: {systemInfo.processes.total_processes}
                  </Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>PID</Th>
                        <Th>Name</Th>
                        <Th isNumeric>CPU %</Th>
                        <Th isNumeric>Memory %</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {systemInfo.processes.top_processes?.slice(0, 5).map((proc: any, index: number) => (
                        <Tr key={index}>
                          <Td fontFamily="mono">{proc.pid}</Td>
                          <Td>{proc.name}</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={proc.cpu_percent > 80 ? 'red' : proc.cpu_percent > 50 ? 'yellow' : 'green'}
                            >
                              {proc.cpu_percent?.toFixed(1)}%
                            </Badge>
                          </Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={proc.memory_percent > 80 ? 'red' : proc.memory_percent > 50 ? 'yellow' : 'green'}
                            >
                              {proc.memory_percent?.toFixed(1)}%
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Health Check Warning</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !healthData && (
          <Card>
            <CardBody>
              <HStack justify="center" py={8}>
                <Spinner size="lg" />
                <Text>Checking system health...</Text>
              </HStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default HealthCheck;